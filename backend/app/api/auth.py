import time
import uuid
import hashlib
import secrets
import json
from typing import Optional, Dict, Any, Tuple
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from app.core.clients import supabase, get_supabase_admin_client

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

# ── SUPABASE DATABASE HELPERS (Supports both 'users' table and fallback 'documents' table) ──

def check_user_exists(email_clean: str) -> bool:
    """Checks whether a user already exists in either 'users' table or 'documents' table."""
    # 1. Try dedicated 'users' table
    try:
        res = supabase.table("users").select("id").eq("email", email_clean).limit(1).execute()
        if res.data and len(res.data) > 0:
            return True
    except Exception:
        pass

    # 2. Try documents table fallback
    try:
        res = (
            supabase.table("documents")
            .select("id")
            .eq("metadata->>type", "app_user")
            .eq("metadata->>email", email_clean)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return True
    except Exception:
        pass

    return False

def find_user_record(email_clean: str) -> Tuple[Optional[Dict[str, Any]], Optional[str], Optional[Any]]:
    """
    Finds user record from 'users' table or 'documents' table.
    Returns: (user_dict, source_type, record_id)
    """
    # 1. Try dedicated 'users' table
    try:
        res = supabase.table("users").select("*").eq("email", email_clean).limit(1).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            return {
                "id": str(row.get("id")),
                "email": row.get("email"),
                "name": row.get("name") or email_clean.split("@")[0].capitalize(),
                "password_hash": row.get("password_hash", ""),
            }, "users", row.get("id")
    except Exception:
        pass

    # 2. Try documents table
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
            meta = res.data[0].get("metadata", {})
            return {
                "id": meta.get("user_id", str(doc_id)),
                "email": meta.get("email", email_clean),
                "name": meta.get("name") or email_clean.split("@")[0].capitalize(),
                "password_hash": meta.get("password_hash", ""),
                "_meta": meta
            }, "documents", doc_id
    except Exception:
        pass

    return None, None, None

def save_user_record(user_id: str, email_clean: str, name: str, pwd_hash: str, now_str: str):
    """Saves user record to 'users' table if present, and to 'documents' table as verified backup."""
    saved_to_users_table = False
    try:
        supabase.table("users").insert({
            "id": user_id,
            "email": email_clean,
            "name": name,
            "password_hash": pwd_hash,
            "created_at": now_str,
            "last_login": now_str
        }).execute()
        saved_to_users_table = True
    except Exception as e:
        # Table 'users' may not have been created yet by developer
        pass

    # Save to 'documents' table as well (guarantees persistence even if 'users' table isn't created yet)
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
        if not saved_to_users_table:
            raise HTTPException(status_code=500, detail=f"Failed to persist user in Supabase: {e}")

def update_user_last_login(source_type: str, record_id: Any, user_dict: Dict[str, Any]):
    """Updates last_login timestamp in the appropriate Supabase table."""
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    try:
        if source_type == "users":
            supabase.table("users").update({"last_login": now_str}).eq("id", record_id).execute()
        elif source_type == "documents":
            meta = user_dict.get("_meta", {})
            meta["last_login"] = now_str
            supabase.table("documents").update({"metadata": meta}).eq("id", record_id).execute()
    except Exception as e:
        print(f"Notice: Failed to update last_login: {e}")


# ── AUTHENTICATION ROUTES ──

@router.post("/signup", response_model=AuthResponse)
async def signup(req: UserSignupRequest):
    email_clean = req.email.strip().lower()
    password = req.password.strip()
    name = req.name.strip() if req.name else email_clean.split("@")[0].capitalize()

    if not email_clean or "@" not in email_clean or "." not in email_clean:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    # 1. Check if user already exists
    if check_user_exists(email_clean):
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    # 2. Register with native Supabase Auth
    supabase_auth_id = None

    # Priority A: If Supabase Admin client is available (via SUPABASE_SERVICE_ROLE_KEY),
    # create user directly with email_confirm=True (bypasses email rate limits 100%)
    admin = get_supabase_admin_client()
    if admin:
        try:
            admin_res = admin.auth.admin.create_user({
                "email": email_clean,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": name}
            })
            if admin_res and admin_res.user:
                supabase_auth_id = admin_res.user.id
                print(f"[Supabase Auth Admin] Created confirmed user: {email_clean} ({supabase_auth_id})")
        except Exception as e:
            print(f"Supabase Admin create_user notice: {e}")

    # Priority B: Standard sign_up via anon client
    if not supabase_auth_id:
        try:
            auth_res = supabase.auth.sign_up({
                "email": email_clean,
                "password": password,
                "options": {"data": {"full_name": name}}
            })
            if auth_res and auth_res.user:
                supabase_auth_id = auth_res.user.id
                print(f"[Supabase Auth] Registered user: {email_clean} ({supabase_auth_id})")
        except Exception as e:
            err_msg = str(e)
            if "email rate limit exceeded" in err_msg.lower():
                print("[AUTH NOTICE] Supabase Email Rate Limit Exceeded. To fix: In Supabase Dashboard -> Authentication -> Providers -> Email, disable 'Confirm email' or provide SUPABASE_SERVICE_ROLE_KEY in .env.")
            else:
                print(f"Supabase Auth sign_up notice: {e}")

    # 3. Store verified user record in Supabase database (users table / documents table)
    user_id = supabase_auth_id or f"usr_{uuid.uuid4().hex[:12]}"
    pwd_hash = hash_password(password)
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    save_user_record(user_id, email_clean, name, pwd_hash, now_str)

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

    # 1. First attempt native Supabase Auth sign-in
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": email_clean,
            "password": password
        })
        if auth_res and auth_res.user:
            full_name = (auth_res.user.user_metadata or {}).get("full_name") or email_clean.split("@")[0].capitalize()
            token = auth_res.session.access_token if auth_res.session else f"sess_{uuid.uuid4().hex}"
            
            # Update last_login in database
            user_data, src, rec_id = find_user_record(email_clean)
            if src and rec_id and user_data:
                update_user_last_login(src, rec_id, user_data)

            return AuthResponse(
                user=AuthUser(id=auth_res.user.id, email=email_clean, name=full_name),
                token=token,
                message="Login successful via Supabase Auth."
            )
    except Exception as e:
        # If Supabase Auth requires unconfirmed email or user was registered in DB fallback
        print(f"Supabase Auth sign_in check notice: {e}")

    # 2. Validate against Supabase user database records
    user_found, source_type, record_id = find_user_record(email_clean)

    if not user_found or not verify_password(password, user_found.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Update last_login in Supabase
    if source_type and record_id:
        update_user_last_login(source_type, record_id, user_found)

    token = f"sess_{uuid.uuid4().hex}"
    return AuthResponse(
        user=AuthUser(
            id=user_found.get("id", f"usr_{uuid.uuid4().hex[:12]}"),
            email=email_clean,
            name=user_found.get("name", email_clean.split("@")[0].capitalize())
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
    
    # 1. Try dedicated user_conversations table
    try:
        res = (
            supabase.table("user_conversations")
            .select("conversations")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            convs = res.data[0].get("conversations") or []
            return {"conversations": convs}
    except Exception:
        pass

    # 2. Try documents table fallback
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
            raw_content = res.data[0].get("content") or "[]"
            convs = json.loads(raw_content)
            return {"conversations": convs}
        return {"conversations": []}
    except Exception as e:
        print(f"Error fetching user conversations: {e}")
        return {"conversations": []}

@router.post("/conversations")
async def save_user_conversations(req: ConversationsSyncRequest):
    if not req.user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")

    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    saved_to_dedicated = False

    # 1. Try dedicated user_conversations table
    try:
        existing = (
            supabase.table("user_conversations")
            .select("id")
            .eq("user_id", req.user_id)
            .limit(1)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            supabase.table("user_conversations").update({
                "conversations": req.conversations,
                "updated_at": now_str
            }).eq("user_id", req.user_id).execute()
        else:
            supabase.table("user_conversations").insert({
                "user_id": req.user_id,
                "conversations": req.conversations,
                "updated_at": now_str
            }).execute()
        saved_to_dedicated = True
    except Exception:
        pass

    # 2. Fallback to documents table
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
                "updated_at": now_str,
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
        if not saved_to_dedicated:
            print(f"Error saving user conversations: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        return {"status": "success", "message": "User conversations saved to Supabase."}
