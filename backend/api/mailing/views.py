
import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from celery_app import app as celery_app
from .serializers import MassMailingSerializer
from core.models import ScheduledMailing

logger = logging.getLogger(__name__)
User = get_user_model()

class MassMailingView(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = MassMailingSerializer

    def post(self, request, *args, **kwargs):
        """
        Обработка запроса на рассылку сообщений пользователям.
        """
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        image = serializer.validated_data.get('image')
        scheduled_time = serializer.validated_data.get('scheduled_time')

        # Если есть изображение, читаем его содержимое
        image_content = None
        if image:
            image.seek(0)
            image_content = image.read()

        # Получаем количество пользователей для рассылки
        total_users = User.objects.exclude(telegram_chat_id__isnull=True).count()
        
        if not total_users:
            return Response({
                'status': 'warning',
                'message': 'Нет пользователей для отправки сообщений'
            })

        # Планируем рассылку на будущее
        if scheduled_time and scheduled_time > timezone.now():
            try:
                # Создаем запись о запланированной рассылке
                mailing = ScheduledMailing.objects.create(
                    message=message,
                    image=image,
                    scheduled_time=scheduled_time,
                    is_sent=False,
                    in_progress=False
                )

                # Планируем задачу в Celery для выполнения в указанное время
                celery_app.send_task(
                    "api.mailing.process_scheduled",
                    eta=scheduled_time,
                    queue="mailing"
                )
    
                return Response({
                    'status': 'success',
                    'message': f'Рассылка запланирована на {scheduled_time}',
                    'data': {
                        'mailing_id': mailing.id,
                        'total_users': total_users
                    }
                })
            except Exception as e:
                logger.error(f"Ошибка планирования рассылки: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': 'Не удалось запланировать рассылку'
                }, status=500)

        # Для немедленной отправки используем новую оптимизированную задачу
        try:
            # Запускаем задачу немедленной рассылки
            celery_app.send_task(
                "api.mailing.process_immediate",
                args=[message, image_content],
                queue="mailing"
            )
            
            # Оценка времени на основе лимита 30 сообщений в секунду
            estimated_time = total_users / 30
            
            return Response({
                'status': 'success',
                'message': 'Рассылка запущена',
                'data': {
                    'total_users': total_users,
                    'estimated_time': f"Примерно {int(estimated_time)} секунд при скорости 30 сообщений/сек"
                }
            })
            
        except Exception as e:
            logger.error(f"Ошибка запуска рассылки: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Не удалось запустить рассылку'
            }, status=500)