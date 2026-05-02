import uuid
import io
import pandas as pd
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from app.services.bulk import BulkMessageService, bulk_jobs, BULK_JOBS_DIR

router = APIRouter()

@router.post("/estimate")
async def estimate_bulk_send(
    delay: int = Form(3),
    file: UploadFile = File(...),
):
    """
    Estimate the time it will take to complete a bulk messaging job.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    ext = Path(file.filename).suffix.lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=400, detail="Unsupported file format. Please upload CSV or Excel."
        )

    try:
        content = await file.read()
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
            
        total_rows = len(df)
        
        # Base overhead per message: ~1s for number check + ~1s for message send = 2s
        # The jitter applied is random.uniform(0.5, 1.5) * delay
        avg_delay = delay * 1.0
        min_delay = delay * 0.5
        max_delay = delay * 1.5
        
        avg_seconds = int(total_rows * (avg_delay + 2))
        min_seconds = int(total_rows * (min_delay + 2))
        max_seconds = int(total_rows * (max_delay + 2))
        
        return {
            "total_rows": total_rows,
            "estimated_time_seconds": avg_seconds,
            "estimated_time_formatted": f"~{min_seconds // 60}m {min_seconds % 60}s to {max_seconds // 60}m {max_seconds % 60}s"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

@router.post("/send")
async def start_bulk_send(
    background_tasks: BackgroundTasks,
    template: str = Form(...),
    delay: int = Form(3),
    file: UploadFile = File(...),
):
    """
    Start a bulk messaging job. Upload a CSV or Excel file.
    The template can contain variables matching column names, e.g. "Hello {Name}".
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    # Supported extensions
    ext = Path(file.filename).suffix.lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=400, detail="Unsupported file format. Please upload CSV or Excel."
        )

    job_id = str(uuid.uuid4())
    file_path = BULK_JOBS_DIR / f"{job_id}{ext}"

    # Save uploaded file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Initialize job tracking
    bulk_jobs[job_id] = {
        "status": "pending",
        "total": 0,
        "processed": 0,
        "sent": 0,
        "failed": 0,
    }

    # Add to background tasks
    background_tasks.add_task(
        BulkMessageService.process_bulk_file,
        job_id=job_id,
        file_path=file_path,
        template=template,
        original_filename=file.filename,
        delay=delay,
    )

    return {"status": "success", "job_id": job_id, "message": "Bulk job started"}


@router.get("/status/{job_id}")
async def get_bulk_status(job_id: str):
    """Get the live progress of a bulk job."""
    if job_id not in bulk_jobs:
        raise HTTPException(status_code=404, detail="Job ID not found")
    return bulk_jobs[job_id]


@router.get("/download/{job_id}")
async def download_bulk_file(job_id: str):
    """Download the updated file containing the 'Bulk_Status' column."""
    # Find the file with the given job_id
    for ext in [".csv", ".xlsx", ".xls"]:
        file_path = BULK_JOBS_DIR / f"{job_id}{ext}"
        if file_path.exists():
            return FileResponse(
                path=file_path,
                filename=f"bulk_results_{file_path.name}",
                media_type="application/octet-stream",
            )
            
    raise HTTPException(status_code=404, detail="File for Job ID not found")