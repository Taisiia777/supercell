FROM python:3.11-slim-buster

RUN useradd web
EXPOSE 8000

ENV PYTHONUNBUFFERED=1 \
    PORT=8000

RUN apt-get update --yes --quiet && apt-get install --yes --quiet --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache -r requirements.txt

WORKDIR /app
RUN chown web:web /app
COPY --chown=web:web . .

USER web