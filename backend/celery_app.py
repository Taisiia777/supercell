# import os
# import sys
# from pathlib import Path

# from celery import Celery
# from dotenv import load_dotenv


# base_dir = Path(__file__).resolve().parent.parent

# if sys.argv[0].endswith("celery"):
#     load_dotenv(base_dir / ".env")
#     os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# app = Celery("davdam")
# app.conf.timezone = "UTC"
# app.conf.enable_utc = True
# app.conf.broker_url = os.environ["CELERY_BROKER_URL"]
# app.conf.broker_connection_retry_on_startup = True

# app.conf.task_track_started = True
# app.conf.task_time_limit = 3000
# app.conf.include = [
#     "core.tasks",
# ]
import os
import sys
from pathlib import Path

from celery import Celery
from dotenv import load_dotenv


base_dir = Path(__file__).resolve().parent.parent

if sys.argv[0].endswith("celery"):
    load_dotenv(base_dir / ".env")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("davdam")
app.conf.timezone = "UTC"
app.conf.enable_utc = True
app.conf.broker_url = os.environ["CELERY_BROKER_URL"]
app.conf.broker_connection_retry_on_startup = True

app.conf.task_track_started = True
app.conf.task_time_limit = 30000
app.conf.include = [
    "core.tasks",
    "api.mailing.send",  # Добавляем задачи рассылки
]

# Настройка очередей с поддержкой приоритетов
app.conf.task_queues = {
    'celery': {
        'exchange': 'celery',
        'routing_key': 'celery',
        'queue_arguments': {'x-max-priority': 10},
    },
    'mailing': {  # Отдельная очередь для рассылок
        'exchange': 'mailing',
        'routing_key': 'mailing',
        'queue_arguments': {'x-max-priority': 10},
    },
    'default': {
        'exchange': 'default',
        'routing_key': 'default',
        'queue_arguments': {'x-max-priority': 10},
    },
}

# Настройка маршрутизации задач по очередям
app.conf.task_routes = {
    'api.mailing.*': {'queue': 'mailing'},  # Все задачи рассылки в отдельную очередь
    '*': {'queue': 'celery'},               # Остальные задачи в основную очередь
}

# Настройка параллельного выполнения
app.conf.worker_prefetch_multiplier = 1  # Воркер берет только по одной задаче
app.conf.worker_concurrency = 4          # Число параллельных исполнителей

# Включаем поддержку приоритетов
app.conf.task_default_priority = 5       # Средний приоритет по умолчанию
app.conf.task_queue_max_priority = 10    # Максимальный приоритет
app.conf.task_default_queue = 'default'  # Очередь по умолчанию

# Ack-late для предотвращения потери задач при сбоях
app.conf.task_acks_late = True

# Не доставлять задачи повторно если воркер умер
app.conf.task_reject_on_worker_lost = True