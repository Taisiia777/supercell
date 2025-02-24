# import logging
# import asyncio
# from typing import Optional
# from django.utils import timezone
# from aiogram import Bot, types
# from django.conf import settings
# from django.contrib.auth import get_user_model
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAdminUser
# from django.core.files.uploadedfile import InMemoryUploadedFile
# from celery_app import app as celery_app
# from .serializers import MassMailingSerializer
# from core.models import ScheduledMailing, User, Role

# logger = logging.getLogger(__name__)
# User = get_user_model()

# class MassMailingView(APIView):
#     permission_classes = [IsAdminUser]
#     serializer_class = MassMailingSerializer

#     async def send_message_to_user(
#         self, 
#         bot: Bot, 
#         chat_id: int, 
#         message: str, 
#         image: Optional[InMemoryUploadedFile] = None
#     ) -> bool:
#         try:
#             keyboard = types.InlineKeyboardMarkup(
#                 inline_keyboard=[[
#                     types.InlineKeyboardButton(
#                         text="В магазин",
#                         web_app=types.WebAppInfo(url="https://shop.mamostore.ru")
#                     )
#                 ]]
#             )

#             if image:
#                 image.seek(0)
#                 image_content = image.read()
                
#                 if not image_content:
#                     raise ValueError("Empty image file")
                    
#                 image_input = types.BufferedInputFile(
#                     file=image_content,
#                     filename=image.name
#                 )
                
#                 await bot.send_photo(
#                     chat_id=chat_id,
#                     photo=image_input,
#                     caption=message,
#                     reply_markup=keyboard
#                 )
#             else:
#                 await bot.send_message(
#                     chat_id=chat_id,
#                     text=message,
#                     reply_markup=keyboard
#                 )
#             return True
#         except Exception as e:
#             logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {str(e)}")
#             return False

  
#     def post(self, request, *args, **kwargs):
#         serializer = self.serializer_class(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         message = serializer.validated_data['message']
#         image = serializer.validated_data.get('image')
#         scheduled_time = serializer.validated_data.get('scheduled_time')

#         if scheduled_time:
#             if scheduled_time <= timezone.now():
#                 return Response({
#                     'status': 'error',
#                     'message': 'Scheduled time must be in the future'
#                 }, status=400)

#             try:
#                 # Создаем запись в базе данных
#                 mailing = ScheduledMailing.objects.create(
#                     message=message,
#                     image=image,
#                     scheduled_time=scheduled_time,
#                     is_sent=False
#                 )

#                 # Если есть изображение, читаем его содержимое
#                 image_content = None
#                 if image:
#                     image.seek(0)
#                     image_content = image.read()

#                 # Отправляем задачу в Celery
#                 celery_app.send_task(
#                     "api.mailing.process_scheduled",
#                     args=[message, image_content],
#                     eta=scheduled_time
#                 )

#                 return Response({
#                     'status': 'success',
#                     'message': 'Mailing scheduled successfully',
#                     'mailing_id': mailing.id
#                 })
#             except Exception as e:
#                 logger.error(f"Error scheduling mailing: {str(e)}")
#                 return Response({
#                     'status': 'error',
#                     'message': 'Failed to schedule mailing'
#                 }, status=500)

#         # Немедленная отправка
#         users = User.objects.exclude(telegram_chat_id__isnull=True)
#         success_count = 0
#         failed_count = 0
        
#         bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)

#         try:
#             for user in users:
#                 success = loop.run_until_complete(
#                     self.send_message_to_user(
#                         bot=bot,
#                         chat_id=user.telegram_chat_id,
#                         message=message,
#                         image=image
#                     )
#                 )
#                 if success:
#                     success_count += 1
#                 else:
#                     failed_count += 1
#         finally:
#             loop.close()
#             bot.session.close()

#         return Response({
#             'status': 'success',
#             'data': {
#                 'total_users': users.count(),
#                 'success_count': success_count,
#                 'failed_count': failed_count
#             }
#         })
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
    
    # Константы
    BATCH_SIZE = 100  # Количество пользователей в одной задаче

    def post(self, request, *args, **kwargs):
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

        # Получаем ID пользователей для рассылки
        user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
        total_users = len(user_ids)
        
        if not user_ids:
            return Response({
                'status': 'warning',
                'message': 'No users to send messages to'
            })

        # Планируем рассылку на будущее
        if scheduled_time and scheduled_time > timezone.now():
            try:
                # Создаем запись в базе данных
                mailing = ScheduledMailing.objects.create(
                    message=message,
                    image=image,
                    scheduled_time=scheduled_time,
                    is_sent=False
                )

                # Просто запускаем задачу проверки расписания, которая потом разобьет на пакеты
                # Убираем передачу аргументов, так как мы сохранили рассылку в БД
                celery_app.send_task(
                    "api.mailing.process_scheduled",
                    eta=scheduled_time
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

        # Немедленная отправка - разбиваем на батчи
        batch_count = 0
        for i in range(0, total_users, self.BATCH_SIZE):
            batch = user_ids[i:i+self.BATCH_SIZE]
            celery_app.send_task(
                "api.mailing.process_batch",
                args=[batch, message, image_content]
            )
            batch_count += 1

        return Response({
            'status': 'success',
            'message': 'Рассылка запущена',
            'data': {
                'total_users': total_users,
                'batch_count': batch_count
            }
        })