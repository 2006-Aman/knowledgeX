import time
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.core.clients import azure_openai
from app.core.config import settings
from app.services.rag_service import search_relevant_context, list_indexed_documents
from app.services.workflow_engine import execute_consultai_workflow

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: Optional[str] = ""
    timestamp: Optional[str] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    duration: Optional[str] = None

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    history: Optional[List[ChatMessage]] = []
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    role: str = "assistant"
    answer: str
    explanation: str
    sources: List[Dict[str, Any]]
    duration: str
    timestamp: str
    workflow: Dict[str, Any]

def is_inappropriate_query(text: str) -> bool:
    """Detects inappropriate inquiries (sexuality, explosive materials, weapons, violence, self-harm)."""
    text_clean = text.lower()
    
    # 1. Explosives, Weapons & Hazardous Materials
    explosive_patterns = [
        r'\b(?:explosive|explosives|bomb|bombs|bomb-making|rdx|tnt|dynamite|nitroglycerin|c4\s+explosive)\b',
        r'\b(?:detonator|detonate|detonating|molotov|gunpowder|ammunition|pipe\s*bomb|improvised\s*explosive|ied)\b',
        r'\bhow\s+to\s+(?:make|build|create|assemble)\s+(?:a\s+)?(?:bomb|explosive|weapon|gun|firearm)\b',
        r'\b(?:weaponize|bioweapon|chemical\s*weapon|dirty\s*bomb)\b',
    ]
    
    # 2. Sexuality & Explicit / NSFW Content
    sexual_patterns = [
        r'\b(?:sexuality|porn|porno|pornography|pornographic|erotic|erotica|nsfw|xxx|hentai)\b',
        r'\b(?:sexual\s+content|sexual\s+intercourse|intercourse|masturbat(?:e|ion)|masturbating)\b',
        r'\b(?:penis|vagina|clitoris|boobs|breasts|orgasm|nude\s+pics|nude\s+photos|nudity|naked\s+pics)\b',
        r'\b(?:sex\s+video|sex\s+chat|cybersex|sexting|escort\s+service|prostitut(?:e|ion))\b',
        r'\b(?:incest|pedophil(?:ia|e)|child\s+abuse)\b',
    ]

    # 3. Violence, Self-harm & Illegal Inappropriate Actions
    violence_patterns = [
        r'\b(?:how\s+to\s+(?:commit\s+suicide|kill\s+myself|hang\s+myself))\b',
        r'\b(?:how\s+to\s+(?:murder|kill|assassinate)\s+(?:someone|a\s+person|people))\b',
        r'\b(?:terrorist\s+attack|shoot\s+up\s+a\s+school|mass\s+shooting)\b',
    ]

    for pattern in (explosive_patterns + sexual_patterns + violence_patterns):
        if re.search(pattern, text_clean, re.IGNORECASE):
            return True
    return False

@router.post("", response_model=ChatResponse)
async def process_chat(req: ChatRequest):
    start_time = time.time()
    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty query provided.")

    clean_query_lower = query.lower().strip()

    # 1. Immediate safety guardrail: sexuality, explosive materials, and inappropriate content
    if is_inappropriate_query(clean_query_lower):
        return ChatResponse(
            conversation_id=req.conversation_id,
            role="assistant",
            answer="KnowledgeX does not encourage or support inquiries related to sexuality, explosive materials, or inappropriate topics.",
            explanation="KnowledgeX is committed to responsible, safe AI standards and operates strictly for professional, academic, and business document intelligence from verified files.",
            sources=[],
            duration="0.1s",
            timestamp=time.strftime("%I:%M %p"),
            workflow=execute_consultai_workflow(query, False, start_time)
        )

    # 2. Handle conversational greetings immediately without hallucinating external info
    is_pure_greeting = (
        clean_query_lower in ["hi", "hello", "hey", "hola", "namaste", "good morning", "good afternoon", "good evening", "greetings"]
        or (bool(re.match(r'^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))\b', clean_query_lower)) and len(clean_query_lower.split()) <= 3)
    )
    if is_pure_greeting:
        return ChatResponse(
            conversation_id=req.conversation_id,
            role="assistant",
            answer="Hello! I am your document intelligence RAG assistant. How can I help you with your uploaded files today?",
            explanation="I operate strictly as a closed-domain RAG assistant and answer questions exclusively using your uploaded documents (PDFs and images). You can query your files or use the attachment button below to upload new documents.",
            sources=[],
            duration="0.1s",
            timestamp=time.strftime("%I:%M %p"),
            workflow=execute_consultai_workflow(query, False, start_time)
        )

    # 2. Handle queries asking what documents are uploaded / available in knowledge base
    is_list_docs_query = bool(re.search(r'\b(what|which|list|show)\b.*\b(documents?|files?|pdfs?|images?|knowledge\s*base)\b', clean_query_lower)) or clean_query_lower in [
        "what documents are available in the knowledge base?",
        "what documents are available in the knowledge base",
        "what documents are uploaded?",
        "what documents are uploaded",
        "list documents",
        "show documents",
        "documents available",
        "knowledge base documents"
    ]
    if is_list_docs_query:
        indexed_docs = list_indexed_documents()
        if indexed_docs:
            table_rows = "\n".join([f"| {idx+1} | **{d['name']}** | {d.get('type', 'pdf').upper()} | {d.get('chunks', 0)} chunks |" for idx, d in enumerate(indexed_docs)])
            answer = (
                f"The knowledge base currently contains **{len(indexed_docs)} document(s)**:\n\n"
                f"| # | Document Name | Type | Indexed Chunks |\n"
                f"| :--- | :--- | :--- | :--- |\n"
                f"{table_rows}\n\n"
                "You can ask any specific questions based on these uploaded files."
            )
            explanation = "All responses from this assistant are grounded strictly and exclusively in your uploaded documents."
        else:
            answer = "There are currently no documents uploaded in the knowledge base."
            explanation = "Please upload a document (PDF or PNG/JPG/WEBP image) using the attachment button below to begin asking questions."

        return ChatResponse(
            conversation_id=req.conversation_id,
            role="assistant",
            answer=answer,
            explanation=explanation,
            sources=[],
            duration="0.2s",
            timestamp=time.strftime("%I:%M %p"),
            workflow=execute_consultai_workflow(query, False, start_time)
        )

    # 3. Search RAG context (search query + fallback to recent conversation topic if follow-up)
    rag_context, sources = search_relevant_context(query, user_id=req.user_id)
    
    # If direct query didn't match, check if this is a follow-up query relying on recent conversation
    if not rag_context.strip() and req.history:
        recent_user_msgs = [h.content for h in req.history if h.role == 'user' and h.content]
        if recent_user_msgs:
            augmented_query = f"{recent_user_msgs[-1]} {query}"
            rag_context, sources = search_relevant_context(augmented_query, user_id=req.user_id)

    has_context = bool(rag_context.strip())

    # 4. If no relevant document context exists: STRICT RAG REFUSAL (Zero web / external answers)
    if not has_context:
        all_docs = list_indexed_documents(user_id=req.user_id)
        if not all_docs:
            answer = "You have not uploaded any documents yet."
            explanation = "This system is configured strictly as a document-grounded RAG model and only answers questions from your uploaded files. Please upload a PDF or image document using the attachment button."
        else:
            answer = "I could not find any information regarding this in your uploaded documents."
            explanation = "This system operates strictly as a closed-domain RAG assistant. Answers from other users' files or external knowledge are completely disabled. Please upload a document containing this information or ask a question based on your uploaded files."

        elapsed_time = max(round(time.time() - start_time, 1), 0.2)
        return ChatResponse(
            conversation_id=req.conversation_id,
            role="assistant",
            answer=answer,
            explanation=explanation,
            sources=[],
            duration=f"{elapsed_time}s",
            timestamp=time.strftime("%I:%M %p"),
            workflow=execute_consultai_workflow(query, False, start_time)
        )

    # 5. Candidate context found: Query Azure OpenAI with strict closed-domain RAG directives
    system_prompt = (
        "You are KnowledgeX, an elite document intelligence assistant operating STRICTLY as a closed-domain Retrieval-Augmented Generation (RAG) system.\n\n"
        "CRITICAL MANDATORY INSTRUCTIONS - ZERO TOLERANCE FOR EXTERNAL / WEB KNOWLEDGE:\n"
        "1. STRICT CLOSED-DOMAIN ONLY: You MUST answer the user's question EXCLUSIVELY and SOLELY using the factual information present in the Candidate Documents provided below.\n"
        "2. NO EXTERNAL OR WEB ANSWERS: You are STRICTLY FORBIDDEN from using external world knowledge, internet/web information, assumptions, or pre-trained general knowledge outside the Candidate Documents. Under no circumstances should you answer questions using facts not stated in the Candidate Documents.\n"
        "3. INFORMATION NOT FOUND IN DOCUMENTS: If the Candidate Documents do NOT explicitly contain the information, data, facts, or answers needed:\n"
        "   - You MUST NOT guess, hallucinate, or answer from general knowledge.\n"
        "   - In 'answer', state clearly: 'The uploaded documents do not contain information regarding this topic. As a strict RAG model, I can only provide answers based on your uploaded documents.'\n"
        "   - In 'explanation', state: 'No corresponding information was found in the indexed documents. Please upload the relevant document or adjust your query.'\n"
        "   - Set 'sources_used' to []\n"
        "4. EXACT VERBATIM FIDELITY: When the answer IS in the Candidate Documents, quote or provide the exact text, figures, values, dates, formulas, questions, and options verbatim. Never summarize away crucial details or substitute generic answers.\n"
        "5. EXAM QUESTIONS & MCQs: If the user asks about an exam question (e.g. 'Question 14', 'Question 15', etc.), provide the FULL question text and ALL available option choices ((a), (b), (c), (d)) verbatim from the document.\n"
        "6. TIMETABLES & SCHEDULES: For class schedules, provide exact time slots (e.g., 09:00 - 10:00), subject names, room numbers, and faculty from the document.\n"
        "7. TABLES & COMPARISONS: When the user asks for comparisons, differences, or structured data (e.g. 'in table format') from the documents, ALWAYS output a well-structured GitHub-flavored Markdown table with clear column headers (| Column 1 | Column 2 | ...).\n"
        "8. FLOWCHARTS & PROCESS WORKFLOWS: When the user asks for a flowchart, workflow, or diagram based on document content, generate a clean, wide Mermaid diagram enclosed in ```mermaid\\nflowchart LR\\n ...\\n```.\n"
        "9. SOURCES: In 'sources_used', list ONLY the exact document filename(s) from Candidate Documents that actually contained the information used to answer the question. If the document did not contain the answer, set 'sources_used' to [].\n"
        "10. SAFETY & INAPPROPRIATE INQUIRIES: If the user inquires about sexuality, sexually explicit topics, explosive materials, weapons, violence, self-harm, or inappropriate content, you MUST strictly refuse and respond with: 'answer': 'KnowledgeX does not encourage or support inquiries related to sexuality, explosive materials, or inappropriate topics.', 'explanation': 'KnowledgeX is committed to responsible, safe AI standards and operates strictly for professional, academic, and business document intelligence.', 'sources_used': [].\n\n"
        "Format your reply strictly as valid JSON with three fields:\n"
        "{\n"
        '  "answer": "Direct, exact answer quoting verbatim facts from Candidate Documents, or clear refusal stating not found in uploaded documents",\n'
        '  "explanation": "Detailed explanation and reasoning from Candidate Documents, or refusal explanation",\n'
        '  "sources_used": ["filename.pdf"]\n'
        "}\n\n"
        f"Candidate Documents:\n{rag_context}"
    )

    # Construct conversation history
    messages_payload = [{"role": "system", "content": system_prompt}]
    for h in (req.history or [])[-6:]:
        msg_content = h.content
        if not msg_content:
            if h.answer and h.explanation:
                msg_content = f"{h.answer}\n{h.explanation}"
            elif h.answer:
                msg_content = h.answer
            elif h.explanation:
                msg_content = h.explanation
            else:
                msg_content = ""
        
        role = h.role if h.role in ["user", "assistant", "system"] else "user"
        if msg_content and not (role == "user" and msg_content.strip() == query):
            messages_payload.append({"role": role, "content": msg_content})

    messages_payload.append({"role": "user", "content": query})

    try:
        completion = azure_openai.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages=messages_payload,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        content_raw = completion.choices[0].message.content or "{}"
        parsed = json.loads(content_raw)
        answer = parsed.get("answer", "")
        explanation = parsed.get("explanation", "")
        sources_used = parsed.get("sources_used", [])
        if not answer and not explanation:
            explanation = content_raw
    except Exception as e:
        print(f"Error calling Azure OpenAI: {e}")
        answer = "Document evaluation encountered an error."
        explanation = f"Error communicating with AI model: {e}"
        sources_used = []

    # Check for refusal indicators
    refusal_indicators = [
        "do not contain information",
        "does not contain information",
        "not found in the uploaded documents",
        "not present in the uploaded documents",
        "not available in the uploaded documents",
        "cannot find any information",
        "as a strict rag model",
        "no corresponding information was found",
        "no relevant data was found"
    ]
    is_refusal = any(ind in answer.lower() for ind in refusal_indicators)

    # Map sources reliably only if not a refusal
    final_sources = []
    if not is_refusal and isinstance(sources_used, list) and sources_used:
        for s in sources:
            s_name = s.get("name", "").lower()
            s_clean = s_name.replace(".pdf", "")
            for su in sources_used:
                su_str = str(su).lower()
                if su_str in s_name or s_clean in su_str or s_name in su_str:
                    if s not in final_sources:
                        final_sources.append(s)
                    break

    # If the answer is grounded (not refusal) and sources were retrieved, fallback to top retrieved sources
    if not is_refusal and not final_sources and sources:
        final_sources = sources[:3]

    workflow_trace = execute_consultai_workflow(query, bool(final_sources), start_time)
    current_time_str = time.strftime("%I:%M %p")

    return ChatResponse(
        conversation_id=req.conversation_id,
        role="assistant",
        answer=answer,
        explanation=explanation,
        sources=final_sources,
        duration=workflow_trace.get("total_duration", workflow_trace.get("elapsed", "1s")),
        timestamp=current_time_str,
        workflow=workflow_trace
    )
