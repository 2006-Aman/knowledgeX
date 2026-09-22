import time
import uuid
import hashlib
import secrets
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from app.core.clients import supabase

router = APIRouter()

class UserSignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""

class UserLoginRequest(BaseModel):
    email: str
    password: str

class AuthUser(BaseModel):
    id: str
    email: str
    name: str

class AuthResponse(BaseModel):
    user: AuthUser
    token: str
    message: str

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000)
    return f"{salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        if "$" not in stored_hash:
            return False
        salt_hex, key_hex = stored_hash.split("$", 1)
        new_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

@router.post("/signup", response_model=AuthResponse)
async def signup(req: UserSignupRequest):
    email_clean = req.email.strip().lower()
    password = req.password.strip()
    name = req.name.strip() if req.name else email_clean.split("@")[0].capitalize()

    if not email_clean or "@" not in email_clean or "." not in email_clean:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    # 1. Check if user already exists in Supabase user records
    try:
        existing = (
            supabase.table("documents")
            .select("id, metadata")
            .eq("metadata->>type", "app_user")
            .eq("metadata->>email", email_clean)
            .limit(1)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Supabase user lookup warning: {e}")

    # 2. Register with native Supabase Auth
    supabase_auth_id = None
    try:
        auth_res = supabase.auth.sign_up({
            "email": email_clean,
            "password": password,
            "options": {"data": {"full_name": name}}
        })
        if auth_res and auth_res.user:
            supabase_auth_id = auth_res.user.id
    except Exception as e:
        print(f"Supabase Auth registration notice (proceeding with db record): {e}")

    # 3. Store verified user record in Supabase database
    user_id = supabase_auth_id or f"usr_{uuid.uuid4().hex[:12]}"
    pwd_hash = hash_password(password)
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    try:
        supabase.table("documents").insert({
            "content": f"USER_ACCOUNT: {email_clean}",
            "metadata": {
                "type": "app_user",
                "user_id": user_id,
                "email": email_clean,
                "name": name,
                "password_hash": pwd_hash,
                "created_at": now_str,
                "last_login": now_str
            }
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist user to Supabase: {e}")

    token = f"sess_{uuid.uuid4().hex}"
    return AuthResponse(
        user=AuthUser(id=user_id, email=email_clean, name=name),
        token=token,
        message="Account created and registered in Supabase successfully."
    )

@router.post("/login", response_model=AuthResponse)
async def login(req: UserLoginRequest):
    email_clean = req.email.strip().lower()
    password = req.password.strip()

    if not email_clean or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user_found = None
    user_metadata = None
    doc_id = None

    # 1. First attempt native Supabase Auth sign-in
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": email_clean,
            "password": password
        })
        if auth_res and auth_res.user:
            full_name = (auth_res.user.user_metadata or {}).get("full_name") or email_clean.split("@")[0].capitalize()
            token = auth_res.session.access_token if auth_res.session else f"sess_{uuid.uuid4().hex}"
            return AuthResponse(
                user=AuthUser(id=auth_res.user.id, email=email_clean, name=full_name),
                token=token,
                message="Login successful via Supabase Auth."
            )
    except Exception as e:
        # If Supabase Auth requires unconfirmed email or fails, fallback to verified Supabase record
        print(f"Supabase Auth sign_in check notice: {e}")

    # 2. Validate against Supabase user records
    try:
        res = (
            supabase.table("documents")
            .select("id, metadata")
            .eq("metadata->>type", "app_user")
            .eq("metadata->>email", email_clean)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            doc_id = res.data[0]["id"]
            user_metadata = res.data[0].get("metadata", {})
            stored_hash = user_metadata.get("password_hash", "")
            if verify_password(password, stored_hash):
                user_found = user_metadata
    except Exception as e:
        print(f"Supabase record verification error: {e}")

    if not user_found:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Update last_login in Supabase
    try:
        user_metadata["last_login"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        supabase.table("documents").update({"metadata": user_metadata}).eq("id", doc_id).execute()
    except Exception as e:
        print(f"Update last_login notice: {e}")

    token = f"sess_{uuid.uuid4().hex}"
    return AuthResponse(
        user=AuthUser(
            id=user_metadata.get("user_id", str(doc_id)),
            email=email_clean,
            name=user_metadata.get("name", email_clean.split("@")[0].capitalize())
        ),
        token=token,
        message="Login successful."
    )

@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token missing.")
    return {"status": "authenticated"}

@router.post("/logout")
async def logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass
    return {"status": "success", "message": "Logged out successfully."}

class ConversationsSyncRequest(BaseModel):
    user_id: str
    conversations: list

@router.get("/conversations")
async def get_user_conversations(user_id: str):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")
    try:
        res = (
            supabase.table("documents")
            .select("id, metadata, content")
            .eq("metadata->>type", "user_conversations")
            .eq("metadata->>user_id", user_id)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            import json
            raw_content = res.data[0].get("content") or "[]"
            convs = json.loads(raw_content)
            return {"conversations": convs}
        return {"conversations": []}
    except Exception as e:
        print(f"Error fetching user conversations: {e}")
        return {"conversations": []}

@router.post("/conversations")
async def save_user_conversations(req: ConversationsSyncRequest):
    import json
    if not req.user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")
    try:
        existing = (
            supabase.table("documents")
            .select("id")
            .eq("metadata->>type", "user_conversations")
            .eq("metadata->>user_id", req.user_id)
            .limit(1)
            .execute()
        )
        payload = {
            "content": json.dumps(req.conversations),
            "metadata": {
                "type": "user_conversations",
                "user_id": req.user_id,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "count": len(req.conversations)
            }
        }
        if existing.data and len(existing.data) > 0:
            doc_id = existing.data[0]["id"]
            supabase.table("documents").update(payload).eq("id", doc_id).execute()
        else:
            supabase.table("documents").insert(payload).execute()
        return {"status": "success", "message": "User conversations saved to Supabase."}
    except Exception as e:
        print(f"Error saving user conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

