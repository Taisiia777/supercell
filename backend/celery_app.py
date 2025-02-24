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
app.conf.task_time_limit = 3000
app.conf.include = [
    "core.tasks",
]
