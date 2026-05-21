from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException

from .config import settings
from .models import RunJobRequest
from .pipeline import run_job

app = FastAPI(title="P11 Buzz Optimizer Worker")


def verify_worker_token(authorization: str | None = Header(default=None)) -> None:
    expected = f"Bearer {settings.worker_api_token}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid worker token")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/jobs/{job_id}/run", dependencies=[Depends(verify_worker_token)])
async def enqueue_job(job_id: str, _request: RunJobRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    background_tasks.add_task(run_job, job_id)
    return {"status": "queued", "job_id": job_id}
