FROM python:3.11-slim-buster

RUN useradd web
EXPOSE 8000

ENV PYTHONUNBUFFERED=1 \
    PORT=8000

RUN apt-get update --yes --quiet && apt-get install --yes --quiet --no-install-recommends \
    build-essential \
    libpq-dev \
    wget \
    unzip \
 && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
 && apt-get install -y ./google-chrome-stable_current_amd64.deb \
 && rm google-chrome-stable_current_amd64.deb \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache -r requirements.txt

WORKDIR /app
RUN chown web:web /app
COPY --chown=web:web . .

USER web