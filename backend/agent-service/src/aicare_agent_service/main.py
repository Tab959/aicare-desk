from fastapi import FastAPI

from aicare_agent_service.schemas import HealthResponse

app = FastAPI(
    title="AICare Agent Service",
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="UP", service="aicare-agent-service", version="0.1.0")


@app.get("/api/v1/agent/health", response_model=HealthResponse)
async def agent_health() -> HealthResponse:
    return HealthResponse(status="UP", service="aicare-agent-service", version="0.1.0")
