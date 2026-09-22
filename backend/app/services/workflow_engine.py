import time
from typing import List, Dict, Any

def get_default_workflow_nodes() -> List[Dict[str, Any]]:
    return [
        {
            "id": "start",
            "title": "Start",
            "type": "trigger",
            "icon": "play",
            "color": "#10B981",
            "status": "completed",
            "duration": "0.1s"
        },
        {
            "id": "set_var_1",
            "title": "Set variable",
            "type": "variable",
            "icon": "variable",
            "color": "#6366F1",
            "status": "completed",
            "duration": "0.2s"
        },
        {
            "id": "manager",
            "title": "KnowledgeX-Manager",
            "type": "agent",
            "icon": "agent",
            "color": "#06B6D4",
            "status": "completed",
            "duration": "1.4s"
        },
        {
            "id": "set_var_2",
            "title": "Set variable",
            "type": "variable",
            "icon": "variable",
            "color": "#6366F1",
            "status": "completed",
            "duration": "0.1s"
        },
        {
            "id": "knowledge",
            "title": "KnowledgeX-Knowledge",
            "type": "retriever",
            "icon": "database",
            "color": "#14B8A6",
            "status": "completed",
            "duration": "2.8s"
        },
        {
            "id": "condition",
            "title": "If / else condition",
            "type": "condition",
            "icon": "condition",
            "color": "#F59E0B",
            "status": "completed",
            "duration": "0.3s"
        },
        {
            "id": "final_answer",
            "title": "KnowledgeX-FinalAnswer",
            "branch": "FACTUAL",
            "type": "synthesizer",
            "icon": "document",
            "color": "#0EA5E9",
            "status": "completed",
            "duration": "7.2s"
        },
        {
            "id": "send_message",
            "title": "Send message",
            "branch": "OTHER",
            "type": "output",
            "icon": "message",
            "color": "#D946EF",
            "status": "completed",
            "duration": "0.0s"
        }
    ]

def execute_knowledgex_workflow(query: str, has_context: bool, start_time: float) -> Dict[str, Any]:
    elapsed = max(round(time.time() - start_time, 1), 1.2)
    elapsed_str = f"{int(elapsed)}s" if elapsed >= 1 else f"{elapsed}s"
    
    nodes = get_default_workflow_nodes()
    
    return {
        "execution_id": f"wf_{int(time.time() * 1000)}",
        "status": "Completed",
        "elapsed": elapsed_str,
        "total_duration": elapsed_str,
        "active_branch": "FACTUAL" if has_context else "GENERAL",
        "nodes": nodes
    }

execute_consultai_workflow = execute_knowledgex_workflow
