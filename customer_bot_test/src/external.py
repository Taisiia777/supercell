from celery import Celery

from create_bot import settings


app = Celery("davdam")
app.conf.broker_url = settings.CELERY_BROKER_URL
