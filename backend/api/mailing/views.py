import logging
import asyncio
from typing import Optional

from aiogram import Bot, types
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from aiogram.types import InputFile
from django.core.files.uploadedfile import InMemoryUploadedFile

from .serializers import MassMailingSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


class MassMailingView(APIView):
    """View для массовой рассылки сообщений пользователям через Telegram"""
    permission_classes = [IsAdminUser]
    serializer_class = MassMailingSerializer

    async def send_message_to_user(
        self, 
        bot: Bot, 
        chat_id: int, 
        message: str, 
        image: Optional[InMemoryUploadedFile] = None
    ) -> bool:
        """Отправка сообщения конкретному пользователю"""
        try:
            keyboard = types.InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        types.InlineKeyboardButton(
                            text="В магазин",
                            web_app=types.WebAppInfo(url="https://shop.mamostore.ru")
                        )
                    ]
                ]
            )

            if image:
                # Сбрасываем указатель в начало файла
                image.seek(0)
                
                # Читаем содержимое файла
                image_content = image.read()
                
                if not image_content:
                    raise ValueError("Empty image file")
                    
                image_input = types.BufferedInputFile(
                    file=image_content,
                    filename=image.name
                )
                
                await bot.send_photo(
                    chat_id=chat_id,
                    photo=image_input,
                    caption=message,
                    reply_markup=keyboard
                )
            else:
                await bot.send_message(
                    chat_id=chat_id,
                    text=message,
                    reply_markup=keyboard
                )
            return True
        except Exception as e:
            logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {str(e)}")
            return False

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        image = serializer.validated_data.get('image')
        
        # Проверяем, что файл существует и не пустой
        if image and image.size == 0:
            return Response({
                'status': 'error',
                'message': 'Empty image file'
            }, status=400)

        users = User.objects.exclude(telegram_chat_id__isnull=True)
        success_count = 0
        failed_count = 0
        
        bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            for user in users:
                success = loop.run_until_complete(
                    self.send_message_to_user(
                        bot=bot,
                        chat_id=user.telegram_chat_id,
                        message=message,
                        image=image
                    )
                )
                if success:
                    success_count += 1
                else:
                    failed_count += 1
        finally:
            loop.close()
            bot.session.close()

        return Response({
            'status': 'success',
            'data': {
                'total_users': users.count(),
                'success_count': success_count,
                'failed_count': failed_count
            }
        })