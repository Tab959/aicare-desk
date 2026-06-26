# AICare Agent Service

Stage 1 keeps this service intentionally small. Real intent detection, RAG, tool calling and human-in-the-loop workflows are scheduled after the Java core and frontend flows are stable.

Run locally:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[dev]"
.\.venv\Scripts\python -m uvicorn aicare_agent_service.main:app --reload --port 8090
```
