# import logging
# import pandas as pd
# from datetime import datetime
# from io import BytesIO
# from typing import Dict, Any, Tuple

# from django.http import HttpResponse
# from django.contrib.auth import get_user_model
# from django.db import transaction
# from rest_framework import status
# from rest_framework.parsers import MultiPartParser
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from drf_spectacular.utils import extend_schema

# from .serializers import (
#     ImportRequestSerializer, 
#     ImportResponseSerializer,
#     UserExportSerializer
# )

# logger = logging.getLogger(__name__)
# User = get_user_model()

# EXCEL_COLUMNS = {
#     'telegram_chat_id': 'telegram_chat_id',
#     'username': 'username', 
#     'first_name': 'first_name',
#     'last_name': 'last_name',
#     'email': 'email',
#     'receiver_name': 'receiver_name',
#     'receiver_phone': 'receiver_phone',
#     'delivery_country': 'delivery_country',
#     'delivery_city': 'delivery_city', 
#     'delivery_address': 'delivery_address',
#     'delivery_district': 'delivery_district',
#     'delivery_notes': 'delivery_notes',
#     'brawl_stars_email': 'brawl_stars_email',
#     'clash_of_clans_email': 'clash_of_clans_email',
#     'clash_royale_email': 'clash_royale_email',
#     'hay_day_email': 'hay_day_email'
# }


# class UserImportView(APIView):
#     parser_classes = [MultiPartParser]
    
#     @staticmethod
#     def process_user_row(row: Dict[str, Any]) -> Dict[str, Any]:
#         """Process a single row of user data"""
#         processed = {}
#         for excel_col, model_field in EXCEL_COLUMNS.items():
#             value = row.get(excel_col)
            
#             # Пропускаем пустые значения
#             if pd.isna(value) or value == '':
#                 continue
                
#             if isinstance(value, (int, float)):
#                 value = int(value)
#             else:
#                 value = str(value).strip()
                
#             processed[model_field] = value
            
#         return processed

#     def import_users_from_excel(self, file) -> Tuple[int, list[str]]:
#         """Import users from Excel file
        
#         Returns:
#             Tuple of (number of users processed, list of error messages)
#         """
#         errors = []
#         processed = 0
        
#         try:
#             df = pd.read_excel(
#                 file,
#                 dtype=str,  # Читаем все как строки
#                 keep_default_na=False  # Не конвертировать пустые значения в NaN
#             )
#         except Exception as e:
#             logger.exception("Error reading Excel file")
#             return 0, ["Error reading Excel file: " + str(e)]

#         # Validate columns
#         missing_cols = set(EXCEL_COLUMNS.keys()) - set(df.columns)
#         if missing_cols:
#             return 0, [f"Missing required columns: {', '.join(missing_cols)}"]

#         with transaction.atomic():
#             for _, row in df.iterrows():
#                 try:
#                     user_data = self.process_user_row(row.to_dict())
                    
#                     # Skip empty rows
#                     if not user_data:
#                         continue
                        
#                     # Get or create user based on telegram_chat_id
#                     chat_id = user_data.pop('telegram_chat_id', None)
#                     if not chat_id:
#                         errors.append(f"Missing telegram_chat_id in row {processed + 1}")
#                         continue
                        
#                     user, created = User.objects.get_or_create(
#                         telegram_chat_id=chat_id,
#                         defaults={'username': f'TG:{chat_id}'}
#                     )
                    
#                     # Update user fields
#                     for field, value in user_data.items():
#                         setattr(user, field, value)
                        
#                     user.save()
#                     processed += 1
                    
#                 except Exception as e:
#                     logger.exception(f"Error processing row {processed + 1}")
#                     errors.append(f"Error in row {processed + 1}: {str(e)}")

#         return processed, errors

#     @extend_schema(
#         request=ImportRequestSerializer,
#         responses=ImportResponseSerializer,
#     )
#     def post(self, request):
#         """Import users from Excel file"""
#         if 'file' not in request.FILES:
#             return Response(
#                 {'error': 'No file provided'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
            
#         file = request.FILES['file']
#         processed, errors = self.import_users_from_excel(file)
        
#         return Response({
#             'processed': processed,
#             'errors': errors
#         })


# class UserExportView(APIView):
#     def export_users_to_excel(self) -> bytes:
#         """Export all users to Excel file"""
#         users = User.objects.all()
#         serializer = UserExportSerializer(users, many=True)
#         df = pd.DataFrame(serializer.data)
        
#         # Convert to Excel bytes
#         buffer = BytesIO()
#         with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
#             df.to_excel(writer, index=False)
        
#         return buffer.getvalue()

#     def get(self, request):
#         """API endpoint for exporting users to Excel"""
#         try:
#             file_data = self.export_users_to_excel()
            
#             filename = f'users_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            
#             response = HttpResponse(
#                 file_data,
#                 content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
#             )
#             response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
#             return response
            
#         except Exception as e:
#             logger.exception("Error exporting users to Excel")
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
import logging
import pandas as pd
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, Tuple

from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .serializers import (
    ImportRequestSerializer, 
    ImportResponseSerializer,
    UserExportSerializer
)

logger = logging.getLogger(__name__)
User = get_user_model()

# Определяем соответствие колонок Excel с полями модели
EXCEL_COLUMNS = {
    'first_name': 'first_name',
    'last_name': 'last_name',
    'userid': 'telegram_chat_id'
}

class UserImportView(APIView):
    parser_classes = [MultiPartParser]
    
    @staticmethod
    def process_user_row(row: Dict[str, Any]) -> Dict[str, Any]:
        """Обработка одной строки данных пользователя"""
        processed = {}
        for excel_col, model_field in EXCEL_COLUMNS.items():
            value = row.get(excel_col)
            
            # Пропускаем пустые значения
            if pd.isna(value) or value == '':
                continue
                
            if excel_col == 'userid' and isinstance(value, (int, float)):
                value = int(value)
            else:
                value = str(value).strip()
                
            processed[model_field] = value
            
        return processed

    def import_users_from_excel(self, file) -> Tuple[int, list[str]]:
        """Импорт пользователей из Excel файла
        
        Returns:
            Tuple из (количество обработанных пользователей, список ошибок)
        """
        errors = []
        processed = 0
        
        try:
            df = pd.read_excel(
                file,
                dtype=str,  # Читаем все как строки
                keep_default_na=False  # Не конвертировать пустые значения в NaN
            )
        except Exception as e:
            logger.exception("Ошибка чтения Excel файла")
            return 0, ["Ошибка чтения Excel файла: " + str(e)]

        # Проверяем наличие необходимых колонок
        missing_cols = set(EXCEL_COLUMNS.keys()) - set(df.columns)
        if missing_cols:
            return 0, [f"Отсутствуют обязательные колонки: {', '.join(missing_cols)}"]

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    user_data = self.process_user_row(row.to_dict())
                    
                    # Пропускаем пустые строки
                    if not user_data:
                        continue
                        
                    # Получаем или создаем пользователя по telegram_chat_id
                    chat_id = user_data.pop('telegram_chat_id', None)
                    
                    if not chat_id:
                        errors.append(f"Отсутствует userid в строке {index + 2}")  # +2 так как Excel начинается с 1 и есть заголовок
                        continue
                    
                    try:
                        chat_id = int(chat_id)
                    except ValueError:
                        errors.append(f"Некорректный userid в строке {index + 2}")
                        continue
                        
                    user, created = User.objects.get_or_create(
                        telegram_chat_id=chat_id,
                        defaults={
                            'username': f'TG:{chat_id}',
                            **user_data
                        }
                    )
                    
                    if not created:
                        # Обновляем имя и фамилию если они предоставлены
                        for field, value in user_data.items():
                            setattr(user, field, value)
                        user.save()
                        
                    processed += 1
                    
                except Exception as e:
                    logger.exception(f"Ошибка обработки строки {index + 2}")
                    errors.append(f"Ошибка в строке {index + 2}: {str(e)}")

        return processed, errors

    @extend_schema(
        request=ImportRequestSerializer,
        responses=ImportResponseSerializer,
    )
    def post(self, request):
        """Импорт пользователей из Excel файла"""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'Файл не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        file = request.FILES['file']
        processed, errors = self.import_users_from_excel(file)
        
        return Response({
            'processed': processed,
            'errors': errors
        })


class UserExportView(APIView):
    def export_users_to_excel(self) -> bytes:
        """Экспорт пользователей в Excel файл"""
        users = User.objects.all()
        serializer = UserExportSerializer(users, many=True)
        df = pd.DataFrame(serializer.data)
        
        # Сортируем колонки в нужном порядке
        df = df[['first_name', 'last_name', 'userid']]
        
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        
        return buffer.getvalue()

    def get(self, request):
        """Экспорт пользователей в Excel"""
        try:
            file_data = self.export_users_to_excel()
            
            filename = f'users_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            
            response = HttpResponse(
                file_data,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            logger.exception("Ошибка экспорта пользователей в Excel")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )