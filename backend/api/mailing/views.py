
# import logging
# from typing import Optional
# from django.utils import timezone
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAdminUser
# from django.core.files.uploadedfile import InMemoryUploadedFile
# from django.contrib.auth import get_user_model
# from celery_app import app as celery_app
# from .serializers import MassMailingSerializer
# from core.models import ScheduledMailing

# logger = logging.getLogger(__name__)
# User = get_user_model()

# class MassMailingView(APIView):
#     permission_classes = [IsAdminUser]
#     serializer_class = MassMailingSerializer
    
#     # Константы
#     BATCH_SIZE = 100  # Количество пользователей в одной задаче

#     def post(self, request, *args, **kwargs):
#         serializer = self.serializer_class(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         message = serializer.validated_data['message']
#         image = serializer.validated_data.get('image')
#         scheduled_time = serializer.validated_data.get('scheduled_time')

#         # Если есть изображение, читаем его содержимое
#         image_content = None
#         if image:
#             image.seek(0)
#             image_content = image.read()

#         # Получаем ID пользователей для рассылки
#         user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
#         total_users = len(user_ids)
        
#         if not user_ids:
#             return Response({
#                 'status': 'warning',
#                 'message': 'No users to send messages to'
#             })

#         # Планируем рассылку на будущее
#         if scheduled_time and scheduled_time > timezone.now():
#             try:
#                 # Создаем запись в базе данных
#                 mailing = ScheduledMailing.objects.create(
#                     message=message,
#                     image=image,
#                     scheduled_time=scheduled_time,
#                     is_sent=False
#                 )

#                 # Просто запускаем задачу проверки расписания, которая потом разобьет на пакеты
#                 # Убираем передачу аргументов, так как мы сохранили рассылку в БД
#                 celery_app.send_task(
#                     "api.mailing.process_scheduled",
#                     eta=scheduled_time
#                 )

#                 return Response({
#                     'status': 'success',
#                     'message': f'Рассылка запланирована на {scheduled_time}',
#                     'data': {
#                         'mailing_id': mailing.id,
#                         'total_users': total_users
#                     }
#                 })
#             except Exception as e:
#                 logger.error(f"Ошибка планирования рассылки: {str(e)}")
#                 return Response({
#                     'status': 'error',
#                     'message': 'Не удалось запланировать рассылку'
#                 }, status=500)

#         # Немедленная отправка - разбиваем на батчи
#         batch_count = 0
#         for i in range(0, total_users, self.BATCH_SIZE):
#             batch = user_ids[i:i+self.BATCH_SIZE]
#             celery_app.send_task(
#                 "api.mailing.process_batch",
#                 args=[batch, message, image_content]
#             )
#             batch_count += 1

#         return Response({
#             'status': 'success',
#             'message': 'Рассылка запущена',
#             'data': {
#                 'total_users': total_users,
#                 'batch_count': batch_count
#             }
#         })


# import logging
# from typing import Optional
# from django.utils import timezone
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAdminUser
# from django.core.files.uploadedfile import InMemoryUploadedFile
# from django.contrib.auth import get_user_model
# from celery_app import app as celery_app
# from .serializers import MassMailingSerializer
# from core.models import ScheduledMailing

# logger = logging.getLogger(__name__)
# User = get_user_model()

# class MassMailingView(APIView):
#     permission_classes = [IsAdminUser]
#     serializer_class = MassMailingSerializer
    
#     # Оптимизированные константы
#     BATCH_SIZE = 500  # Размер пакета пользователей

#     def post(self, request, *args, **kwargs):
#         """
#         Обработка запроса на рассылку сообщений пользователям.
#         Поддерживает немедленную отправку и планирование на будущее.
#         """
#         serializer = self.serializer_class(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         message = serializer.validated_data['message']
#         image = serializer.validated_data.get('image')
#         scheduled_time = serializer.validated_data.get('scheduled_time')
        
#         # Дополнительные параметры для тонкой настройки рассылки
#         priority = serializer.validated_data.get('priority', 5)  # Приоритет задачи (1-9)
#         threads = serializer.validated_data.get('threads')  # Количество потоков (опционально)

#         # Если есть изображение, читаем его содержимое
#         image_content = None
#         if image:
#             image.seek(0)
#             image_content = image.read()

#         # Получаем ID пользователей для рассылки
#         user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
#         total_users = len(user_ids)
        
#         if not user_ids:
#             return Response({
#                 'status': 'warning',
#                 'message': 'Нет пользователей для отправки сообщений'
#             })

#         # Устанавливаем количество потоков, если указано
#         if threads:
#             celery_app.send_task(
#                 "api.mailing.set_max_threads",
#                 args=[threads]
#             )

#         # Планируем рассылку на будущее
#         if scheduled_time and scheduled_time > timezone.now():
#             try:
#                 # Создаем запись о запланированной рассылке
#                 mailing = ScheduledMailing.objects.create(
#                     message=message,
#                     image=image,
#                     scheduled_time=scheduled_time,
#                     is_sent=False,
#                     in_progress=False
#                 )

#                 # Планируем задачу в Celery для выполнения в указанное время
#                 celery_app.send_task(
#                     "api.mailing.process_scheduled",
#                     eta=scheduled_time
#                 )

#                 return Response({
#                     'status': 'success',
#                     'message': f'Рассылка запланирована на {scheduled_time}',
#                     'data': {
#                         'mailing_id': mailing.id,
#                         'total_users': total_users
#                     }
#                 })
#             except Exception as e:
#                 logger.error(f"Ошибка планирования рассылки: {str(e)}")
#                 return Response({
#                     'status': 'error',
#                     'message': 'Не удалось запланировать рассылку'
#                 }, status=500)

#         # Для немедленной отправки используем многопоточную задачу
#         try:
#             # Запускаем задачу немедленной рассылки с заданным приоритетом
#             celery_app.send_task(
#                 "api.mailing.send_immediate_mailing",
#                 args=[message, image_content],
#                 priority=priority
#             )
            
#             batch_count = (total_users + self.BATCH_SIZE - 1) // self.BATCH_SIZE  # Округляем вверх
            
#             return Response({
#                 'status': 'success',
#                 'message': 'Рассылка запущена в многопоточном режиме',
#                 'data': {
#                     'total_users': total_users,
#                     'batch_count': batch_count,
#                     'estimated_time': f"Примерно {batch_count} секунд" # Сокращенная оценка благодаря многопоточности
#                 }
#             })
            
#         except Exception as e:
#             logger.error(f"Ошибка запуска рассылки: {str(e)}")
#             return Response({
#                 'status': 'error',
#                 'message': 'Не удалось запустить рассылку'
#             }, status=500)



import logging
from typing import Optional
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.contrib.auth import get_user_model
from celery_app import app as celery_app
from .serializers import MassMailingSerializer
from core.models import ScheduledMailing

logger = logging.getLogger(__name__)
User = get_user_model()

class MassMailingView(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = MassMailingSerializer
    
    # Оптимизированные константы
    BATCH_SIZE = 500  # Размер пакета пользователей

    def post(self, request, *args, **kwargs):
        """
        Обработка запроса на рассылку сообщений пользователям.
        Поддерживает немедленную отправку и планирование на будущее.
        """
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        image = serializer.validated_data.get('image')
        scheduled_time = serializer.validated_data.get('scheduled_time')
        
        # Дополнительные параметры для тонкой настройки рассылки
        priority = serializer.validated_data.get('priority', 5)  # Приоритет задачи (1-9)
        threads = serializer.validated_data.get('threads')  # Количество потоков (опционально)

        # Если есть изображение, читаем его содержимое
        image_content = None
        if image:
            image.seek(0)
            image_content = image.read()

        # Получаем ID пользователей для рассылки
        user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
        total_users = len(user_ids)
        
        if not user_ids:
            return Response({
                'status': 'warning',
                'message': 'Нет пользователей для отправки сообщений'
            })

        # Устанавливаем количество потоков, если указано
        if threads:
            celery_app.send_task(
                "api.mailing.set_max_threads",
                args=[threads],
                queue="mailing"  # Явно указываем очередь
            )

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
                    queue="mailing"  # Явно указываем очередь
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

        # Для немедленной отправки используем многопоточную задачу
        try:
            # Запускаем задачу немедленной рассылки с заданным приоритетом
            celery_app.send_task(
                "api.mailing.send_immediate_mailing",
                args=[message, image_content],
                priority=priority,
                queue="mailing"  # Явно указываем очередь
            )
            
            batch_count = (total_users + self.BATCH_SIZE - 1) // self.BATCH_SIZE  # Округляем вверх
            
            return Response({
                'status': 'success',
                'message': 'Рассылка запущена в многопоточном режиме',
                'data': {
                    'total_users': total_users,
                    'batch_count': batch_count,
                    'estimated_time': f"Примерно {batch_count*60} секунд" # Оценка с учетом лимитов Telegram
                }
            })
            
        except Exception as e:
            logger.error(f"Ошибка запуска рассылки: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Не удалось запустить рассылку'
            }, status=500)