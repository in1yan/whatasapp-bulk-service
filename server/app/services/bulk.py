import asyncio
import random
from pathlib import Path
from typing import Any, Dict

import pandas as pd

from app.services.whatsapp import WhatsappService

# In-memory store for bulk job progress
# Format: {"job_id": {"status": "processing", "total": 100, "processed": 45, "sent": 40, "failed": 5}}
bulk_jobs: Dict[str, Dict[str, Any]] = {}

BULK_JOBS_DIR = Path("data/bulk_jobs")
BULK_JOBS_DIR.mkdir(parents=True, exist_ok=True)


class BulkMessageService:
    @staticmethod
    async def process_bulk_file(
        job_id: str, file_path: Path, template: str, delay: int = 3
    ):
        bulk_jobs[job_id]["status"] = "processing"

        try:
            # Load the file
            if file_path.suffix.lower() == ".csv":
                df = pd.read_csv(file_path)
            elif file_path.suffix.lower() in [".xlsx", ".xls"]:
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format")

            # Initialize status column if it doesn't exist
            if "Bulk_Status" not in df.columns:
                df["Bulk_Status"] = ""

            # Find the target phone number column
            target_col = None
            for col in df.columns:
                if str(col).lower() in ["phone", "number", "whatsapp"]:
                    target_col = col
                    break

            if not target_col:
                raise ValueError(
                    "Could not find a column named 'phone', 'number', or 'whatsapp'"
                )

            total_rows = len(df)
            bulk_jobs[job_id]["total"] = total_rows

            for index, row in df.iterrows():
                # Skip if already sent
                if (
                    pd.notna(row.get("Bulk_Status"))
                    and str(row.get("Bulk_Status")).lower() == "sent"
                ):
                    bulk_jobs[job_id]["processed"] += 1
                    bulk_jobs[job_id]["sent"] += 1
                    continue

                phone_number = str(row[target_col]).strip()
                if not phone_number or phone_number == "nan":
                    df.at[index, "Bulk_Status"] = "Failed: Empty phone number"
                    bulk_jobs[job_id]["failed"] += 1
                    bulk_jobs[job_id]["processed"] += 1
                    continue

                # Prepare the template dictionary (replace NaNs with empty string)
                row_dict = {
                    str(k): (str(v) if pd.notna(v) else "") for k, v in row.items()
                }

                try:
                    # Inject variables into template
                    message_text = template.format(**row_dict)

                    # Send message
                    await WhatsappService.send_message(
                        number=phone_number, text=message_text
                    )
                    df.at[index, "Bulk_Status"] = "Sent"
                    bulk_jobs[job_id]["sent"] += 1

                except KeyError as e:
                    df.at[index, "Bulk_Status"] = (
                        f"Failed: Missing template variable {e}"
                    )
                    bulk_jobs[job_id]["failed"] += 1
                except Exception as e:
                    df.at[index, "Bulk_Status"] = f"Failed: {str(e)}"
                    bulk_jobs[job_id]["failed"] += 1

                bulk_jobs[job_id]["processed"] += 1

                # Save file back to disk after each message to preserve progress
                try:
                    if file_path.suffix.lower() == ".csv":
                        df.to_csv(file_path, index=False)
                    else:
                        df.to_excel(file_path, index=False)
                except Exception as e:
                    print(f"Failed to save progress to file: {e}")

                # Anti-ban delay - using the user provided delay
                if index < total_rows - 1:
                    # Add a bit of jitter to the user delay
                    jitter = random.uniform(0.5, 1.5)
                    await asyncio.sleep(delay * jitter)

            bulk_jobs[job_id]["status"] = "completed"

        except Exception as e:
            bulk_jobs[job_id]["status"] = f"error: {str(e)}"
            print(f"Bulk job {job_id} failed: {e}")
