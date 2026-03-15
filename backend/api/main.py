from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from api.queue_runner import ResearchQueueRunner
from api.schemas import (
    CreateJobResponse,
    DashboardSnapshot,
    DatabaseHealthSnapshot,
    JobStatusResponse,
    PersistFinalOutputRequest,
    PersistFinalOutputResponse,
    ResearchRequest,
    SentimentSnapshot,
)

backend_root = Path(__file__).resolve().parents[1]
queue_runner = ResearchQueueRunner(backend_root=backend_root)

app = FastAPI(title="Competitive Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/database/health", response_model=DatabaseHealthSnapshot)
def get_database_health_snapshot():
    return queue_runner.get_database_health_snapshot()


@app.post("/research", response_model=CreateJobResponse)
def create_research_job(payload: ResearchRequest):
    keyword = payload.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="keyword is required")

    platforms = payload.platforms or ["amazon", "flipkart", "meesho"]
    job_id = queue_runner.create_job(
        keyword=keyword,
        platforms=platforms,
        max_products=payload.max_products,
    )
    return {"job_id": job_id, "status": "queued"}


@app.get("/research/{job_id}", response_model=JobStatusResponse)
def get_research_job(job_id: str):
    job = queue_runner.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")

    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "result": job.get("result"),
        "errors": job.get("errors", []),
    }


@app.post("/research/{job_id}/final-output", response_model=PersistFinalOutputResponse)
def persist_final_output(job_id: str, payload: PersistFinalOutputRequest):
    return queue_runner.persist_final_output(
        job_id=job_id,
        keyword=payload.keyword,
        result=payload.result.model_dump(),
        source=payload.source,
        is_ai_enriched=payload.isAiEnriched,
    )


@app.get("/dashboard", response_model=DashboardSnapshot)
def get_dashboard_snapshot():
    return queue_runner.get_dashboard_snapshot()


@app.get("/sentiment", response_model=SentimentSnapshot)
def get_sentiment_snapshot(keyword: str = Query(default="", max_length=120)):
    return queue_runner.get_sentiment_snapshot(keyword)
