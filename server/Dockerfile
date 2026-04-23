FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
# If there are dependencies in pyproject.toml, you might want to install them here
RUN pip install .

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
