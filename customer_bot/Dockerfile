FROM python:3.11-slim-buster

RUN useradd bot

ENV PYTHONUNBUFFERED=1

COPY requirements.txt /
RUN pip install --no-cache-dir -r /requirements.txt


WORKDIR /app
COPY bot.py ./bot.py
COPY create_bot.py ./create_bot.py
COPY src ./src

USER bot