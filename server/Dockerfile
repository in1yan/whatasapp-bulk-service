FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
# Use pip to install dependencies from pyproject.toml directly
RUN pip install .

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
