# import logging
# from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
# from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
# import asyncio
# import random
# from datetime import datetime, time
# import json
# import os

# # Настройка логирования
# logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
# logger = logging.getLogger(__name__)

# # ID администратора (твой ID для получения уведомлений)
# ADMIN_ID = '677822370'  # Замени на свой Telegram ID

# # Милые котики для разных ситуаций
# CATS = {
#     'welcome': '🐱',
#     'happy': '😺',
#     'love': '😻',
#     'yum': '😸',
#     'hug': '🤗',
#     'kiss': '😘',
#     'paw': '🐾',
#     'sleepy': '😴',
#     'angel': '😇',
#     'heart': '💕',
#     'sparkles': '✨',
#     'flower': '🌸',
# }

# # Картинки котиков (URL) - расширенный список
# CAT_PICS = [
#     # Основные картинки
#     "https://i.pinimg.com/736x/17/2a/9b/172a9b55bf3e9f5c898cf7c4bbf640d5.jpg",
#     "https://i.pinimg.com/736x/10/bc/bd/10bcbdc51fdacda178fbf70267e19251.jpg",
#     "https://i.pinimg.com/736x/8c/4f/f4/8c4ff4d8cdfe75284c142e3d692637a7.jpg",
#     "https://i.pinimg.com/736x/60/8c/73/608c734c72422e72f68cd5d06be1b400.jpg",
#     "https://i.pinimg.com/736x/d6/f2/38/d6f238dcf1e585ef7bc421a18cc7538f.jpg",
#     "https://i.pinimg.com/736x/85/61/98/8561985bacec7121a94c572257b4b6ca.jpg",
#     "https://i.pinimg.com/736x/f8/37/13/f83713f01951d89720c5665c4a607ef4.jpg",
#     "https://i.pinimg.com/736x/73/fa/76/73fa76b27c9934abcefa64fec4d31200.jpg",
#     "https://i.pinimg.com/736x/28/8a/f4/288af49966e71c911210cbe91107695d.jpg"
# ]

# # Ежедневные котики - картинка и сообщение для каждого дня недели
# DAILY_CATS = {
#     0: {  # Понедельник
#         'pic': 'https://i.pinimg.com/736x/b1/d3/32/b1d3325adb7bc99ccf093b2a54386d29.jpg',
#         'message': f'{CATS["love"]} Доброе утро, солнышко! С новой неделькой! Пусть понедельник будет лёгким и уютным, как мурчание котика! {CATS["sparkles"]}'
#     },
#     1: {  # Вторник
#         'pic': 'https://i.pinimg.com/736x/b2/62/dc/b262dcd0d73f3ae36fbb9d7fd42f4279.jpg',
#         'message': f'{CATS["happy"]} Прекрасного вторника, милая! Котик передаёт тебе утренние обнимашки и желает удачного дня! {CATS["hug"]}'
#     },
#     2: {  # Среда
#         'pic': 'https://i.pinimg.com/736x/ea/ab/45/eaab4559698723097225953ce496f665.jpg',
#         'message': f'{CATS["yum"]} Серединка недели! Котик приготовил тебе виртуальный кофе с любовью. Ты справишься со всем! {CATS["kiss"]}'
#     },
#     3: {  # Четверг
#         'pic': 'https://i.pinimg.com/736x/39/83/9b/39839b8fe7218ada38d43cdd802a4cda.jpg',
#         'message': f'{CATS["angel"]} Счастливого четверга! Котик мурлычет и напоминает, что ты замечательная! {CATS["heart"]}'
#     },
#     4: {  # Пятница
#         'pic': 'https://i.pinimg.com/736x/0f/94/90/0f9490bd5c125b6f2236598002d2df4f.jpg',
#         'message': f'{CATS["sparkles"]} Ура, пятница! Котик танцует от радости и желает тебе чудесного окончания недели! {CATS["flower"]}'
#     },
#     5: {  # Суббота
#         'pic': 'https://i.pinimg.com/736x/69/ad/a6/69ada6196ac6d669180a412455198fdf.jpg',
#         'message': f'{CATS["sleepy"]} Субботнее утро! Котик предлагает провести день в уюте и радости. Ты заслужила отдых! {CATS["love"]}'
#     },
#     6: {  # Воскресенье
#         'pic': 'https://i.pinimg.com/736x/17/2a/9b/172a9b55bf3e9f5c898cf7c4bbf640d5.jpg',
#         'message': f'{CATS["hug"]} Нежного воскресенья! Котик шлёт тебе лучики любви и тёплые объятия! {CATS["paw"]}'
#     }
# }

# # Комплименты для девушки
# COMPLIMENTS = [
#     "Ты сегодня особенно прекрасна! 💕",
#     "Твоя улыбка освещает весь мир! ✨",
#     "Ты самая милая на свете! 🌸",
#     "Котики мурчат от твоей красоты! 😻",
#     "Ты как солнышко - яркая и тёплая! ☀️",
#     "Все котики мира хотят с тобой дружить! 🐱",
#     "Ты излучаешь доброту и позитив! 🌈",
#     "Твои глазки сияют как звёздочки! ⭐",
# ]

# # Милые факты о котиках
# CAT_FACTS = [
#     "Котики тратят 70% жизни на сон. Мечта! 😴",
#     "Когда котик трётся о тебя - он помечает тебя как свою семью! 💕",
#     "Котики мурчат на частоте, которая помогает заживлению костей! 🦴",
#     "У котиков есть специальный язык для общения с людьми! 🗣️",
#     "Котик приносит тебе 'добычу' потому что беспокоится, что ты не умеешь охотиться! 🐭",
#     "Медленное моргание котика - это поцелуй! 😘",
#     "Котики видят в 6 раз лучше человека в темноте! 👀",
#     "У каждого котика уникальный отпечаток носа, как у людей отпечатки пальцев! 👃",
# ]

# # Упрощенное меню напитков
# MENU = {
#     'tea': 'Чай',
#     'tea_milk': 'Чай с молоком',
#     'coffee': 'Кофе'
# }

# # Временное хранилище заказов
# current_orders = {}

# # Файл для сохранения пользователей
# USERS_FILE = 'users.json'

# # Загружаем пользователей из файла
# def load_users():
#     if os.path.exists(USERS_FILE):
#         with open(USERS_FILE, 'r') as f:
#             return json.load(f)
#     return {}

# # Сохраняем пользователей в файл
# def save_users(users):
#     with open(USERS_FILE, 'w') as f:
#         json.dump(users, f)

# # Словарь пользователей {user_id: chat_id}
# registered_users = load_users()

# async def send_daily_cat(context: ContextTypes.DEFAULT_TYPE):
#     """Отправка ежедневного котика в 9:00"""
#     current_day = datetime.now().weekday()
#     daily_cat = DAILY_CATS[current_day]
    
#     # Отправляем всем зарегистрированным пользователям
#     for user_id, chat_id in registered_users.items():
#         try:
#             await context.bot.send_photo(
#                 chat_id=chat_id,
#                 photo=daily_cat['pic'],
#                 caption=daily_cat['message']
#             )
#             logger.info(f"Отправлен ежедневный котик пользователю {user_id}")
#         except Exception as e:
#             logger.error(f"Ошибка при отправке котика пользователю {user_id}: {e}")
    
#     logger.info(f"Ежедневная рассылка котиков завершена")

# def setup_daily_cat_job(application):
#     """Настройка ежедневной отправки котика в 9:00"""
#     job_queue = application.job_queue
    
#     # Задаём время отправки - 9:00
#     send_time = time(hour=9, minute=0, second=0)
    
#     # Добавляем задачу в планировщик
#     job_queue.run_daily(
#         send_daily_cat,
#         time=send_time,
#         name='daily_cat'
#     )
    
#     logger.info("Настроена ежедневная отправка котиков в 9:00")

# async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Приветственное сообщение"""
#     # Проверяем, откуда пришёл вызов
#     if update.message:
#         # Обычная команда /start
#         user = update.effective_user
#         chat_id = update.effective_chat.id
#     else:
#         # Вызов из callback (кнопка "Назад")
#         query = update.callback_query
#         user = query.from_user
#         chat_id = query.message.chat_id
    
#     # Регистрируем пользователя для ежедневной рассылки
#     if str(user.id) not in registered_users:
#         registered_users[str(user.id)] = chat_id
#         save_users(registered_users)
#         logger.info(f"Новый пользователь зарегистрирован: {user.id}")
    
#     welcome_message = (
#         f"{CATS['welcome']} Мяу-мяу, {user.first_name}! {CATS['love']}\n\n"
#         f"Я твой личный котокофейный помощник! {CATS['happy']}\n\n"
#         f"У меня есть для тебя:\n"
#         f"☕ Волшебные напитки\n"
#         f"🐱 Милые котики\n"
#         f"💕 Комплименты и обнимашки\n\n"
#         f"Что желаешь, солнышко? {CATS['sparkles']}\n\n"
#         f"P.S. Каждое утро в 9:00 я буду присылать тебе котика дня! 🌅"
#     )
    
#     keyboard = [
#         [InlineKeyboardButton(f"☕ Заказать напиток", callback_data='drinks_menu')],
#         [InlineKeyboardButton(f"{CATS['love']} Получить комплимент", callback_data='compliment')],
#         [InlineKeyboardButton(f"{CATS['paw']} Погладить котика", callback_data='pet_cat')],
#         [InlineKeyboardButton(f"📸 Котик дня", callback_data='cat_pic')],
#         [InlineKeyboardButton(f"📚 Факт о котиках", callback_data='cat_fact')],
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
    
#     if update.message:
#         # Отправляем с картинкой котика
#         await update.message.reply_photo(
#             photo=random.choice(CAT_PICS),
#             caption=welcome_message,
#             reply_markup=reply_markup
#         )
#     else:
#         # Редактируем существующее сообщение
#         await query.edit_message_caption(
#             caption=welcome_message,
#             reply_markup=reply_markup
#         )

# async def show_drinks_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Показать меню напитков"""
#     query = update.callback_query
#     await query.answer()
    
#     message = f"{CATS['yum']} Что будем пить сегодня?\n\n"
    
#     keyboard = []
#     for drink_id, drink_name in MENU.items():
#         message += f"• {drink_name}\n"
#         keyboard.append([InlineKeyboardButton(
#             f"{CATS['yum']} {drink_name}", 
#             callback_data=f'drink_{drink_id}'
#         )])
    
#     keyboard.append([InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')])
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message + f"\n{CATS['paw']} Что выберешь?",
#         reply_markup=reply_markup
#     )

# async def customize_drink(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Настройка напитка - сахар и печеньки"""
#     query = update.callback_query
#     await query.answer()
    
#     drink_id = query.data.split('_')[1]
#     user_id = query.from_user.id
    
#     # Сохраняем выбор напитка
#     if user_id not in current_orders:
#         current_orders[user_id] = {}
#     current_orders[user_id]['drink'] = drink_id
    
#     message = (
#         f"{CATS['sparkles']} Отличный выбор - {MENU[drink_id]}!\n\n"
#         f"Теперь давай добавим детали:\n\n"
#         f"🍬 Добавить сахар?"
#     )
    
#     keyboard = [
#         [
#             InlineKeyboardButton("✅ Да, с сахаром", callback_data=f'sugar_yes_{drink_id}'),
#             InlineKeyboardButton("❌ Нет, без сахара", callback_data=f'sugar_no_{drink_id}')
#         ],
#         [InlineKeyboardButton(f"{CATS['welcome']} Назад", callback_data='drinks_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def ask_sugar_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Спросить количество ложек сахара"""
#     query = update.callback_query
#     await query.answer()
    
#     data = query.data.split('_')
#     drink_id = data[2]
#     user_id = query.from_user.id
    
#     # Сохраняем что сахар нужен
#     current_orders[user_id]['sugar'] = True
    
#     message = (
#         f"{CATS['sparkles']} С сахаром, отлично!\n\n"
#         f"🥄 Сколько ложечек положить?"
#     )
    
#     keyboard = [
#         [
#             InlineKeyboardButton("1 ложечка", callback_data=f'sugar_1_{drink_id}'),
#             InlineKeyboardButton("2 ложечки", callback_data=f'sugar_2_{drink_id}'),
#             InlineKeyboardButton("3 ложечки", callback_data=f'sugar_3_{drink_id}')
#         ],
#         [InlineKeyboardButton(f"{CATS['welcome']} Назад", callback_data='drinks_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def ask_cookies(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Спросить про печеньки"""
#     query = update.callback_query
#     await query.answer()
    
#     data = query.data.split('_')
    
#     # Если пришли от выбора сахара
#     if data[0] == 'sugar' and data[1] in ['1', '2', '3']:
#         sugar_amount = data[1]
#         drink_id = data[2]
#         user_id = query.from_user.id
        
#         # Сохраняем количество ложек
#         current_orders[user_id]['sugar_amount'] = int(sugar_amount)
#         message_start = f"{CATS['sparkles']} {sugar_amount} ложечка(и) сахара - записала!\n\n"
#     elif data[0] == 'sugar' and data[1] == 'no':
#         # Без сахара
#         drink_id = data[2]
#         user_id = query.from_user.id
#         current_orders[user_id]['sugar'] = False
#         current_orders[user_id]['sugar_amount'] = 0
#         message_start = f"{CATS['sparkles']} Без сахара - записала!\n\n"
#     else:
#         # Неожиданный случай
#         message_start = ""
#         drink_id = data[2] if len(data) > 2 else None
    
#     message = (
#         f"{message_start}"
#         f"🍪 А печеньки будешь?"
#     )
    
#     keyboard = [
#         [
#             InlineKeyboardButton("✅ Да, с печеньками", callback_data=f'cookies_yes_{drink_id}'),
#             InlineKeyboardButton("❌ Нет, без печенек", callback_data=f'cookies_no_{drink_id}')
#         ],
#         [InlineKeyboardButton(f"{CATS['welcome']} Назад", callback_data='drinks_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def process_order(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Обработка готового заказа"""
#     query = update.callback_query
#     await query.answer()
    
#     data = query.data.split('_')
#     cookies_choice = data[1]
#     drink_id = data[2]
#     user_id = query.from_user.id
#     user = query.from_user
    
#     # Сохраняем выбор печенек
#     current_orders[user_id]['cookies'] = (cookies_choice == 'yes')
    
#     # Формируем описание заказа
#     order = current_orders[user_id]
#     drink_name = MENU[order['drink']]
    
#     order_details = [drink_name]
#     if order.get('sugar'):
#         sugar_amount = order.get('sugar_amount', 1)
#         if sugar_amount == 1:
#             order_details.append("с 1 ложечкой сахара")
#         else:
#             order_details.append(f"с {sugar_amount} ложечками сахара")
#     else:
#         order_details.append("без сахара")
    
#     if order['cookies']:
#         order_details.append("с печеньками 🍪")
#     else:
#         order_details.append("без печенек")
    
#     order_description = ", ".join(order_details)
    
#     # Сообщение для пользователя
#     user_message = (
#         f"{CATS['love']} Ура! Заказ принят!\n\n"
#         f"Ты заказала: {order_description}\n\n"
#         f"{CATS['sparkles']} Начинаю готовить с любовью! {CATS['happy']}\n\n"
#         f"*Котик надевает фартук и берёт чашечку лапками*"
#     )
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['heart']} Получить напиток", callback_data=f'receive_order_{user_id}')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
    
#     # Отправляем гифку с готовкой
#     await query.message.delete()
#     await context.bot.send_photo(
#         chat_id=query.message.chat_id,
#         photo="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTdxZTUyd3V1aXVqcGNiajd5cmJuNTdkcWdzcnBuajZ0aHp1M2d6NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.gif",
#         caption=user_message,
#         reply_markup=reply_markup
#     )
    
#     # Уведомление администратору
#     admin_message = (
#         f"🔔 Новый заказ!\n\n"
#         f"От: {user.first_name} (@{user.username or 'без username'})\n"
#         f"Заказ: {order_description}\n"
#     )
    
#     try:
#         await context.bot.send_message(chat_id=ADMIN_ID, text=admin_message)
#     except Exception as e:
#         logger.error(f"Не удалось отправить уведомление админу: {e}")

# async def receive_order(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Получить готовый напиток"""
#     query = update.callback_query
#     await query.answer("Приятного аппетита! 💕")
    
#     user_id = int(query.data.split('_')[2])
#     order = current_orders.get(user_id, {})
    
#     success_message = (
#         f"{CATS['love']} Вжух! Готово!\n\n"
#         f"*Котик-бариста протягивает чашечку лапками*\n\n"
#         f"{CATS['sparkles']} Вот твой напиток, приготовленный с любовью!\n"
#         f"Приятного аппетита, солнышко! {CATS['yum']}\n\n"
#         f"*Котик мурчит и виляет хвостиком*"
#     )
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['sparkles']} Оставить отзыв", callback_data='leave_review')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
    
#     # Отправляем новое сообщение с готовым напитком
#     await query.message.delete()
#     await context.bot.send_photo(
#         chat_id=query.message.chat_id,
#         photo="https://i.pinimg.com/736x/17/2a/9b/172a9b55bf3e9f5c898cf7c4bbf640d5.jpg",
#         caption=success_message,
#         reply_markup=reply_markup
#     )
    
#     # Очищаем заказ
#     if user_id in current_orders:
#         del current_orders[user_id]

# async def give_compliment(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Дать комплимент"""
#     query = update.callback_query
#     await query.answer("💕")
    
#     compliment = random.choice(COMPLIMENTS)
#     user = query.from_user
    
#     message = (
#         f"{CATS['love']} {user.first_name}, {compliment}\n\n"
#         f"*Котик мурчит и трётся о ножки* {CATS['happy']}"
#     )
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['love']} Ещё комплимент", callback_data='compliment')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def show_cat_pic(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Показать картинку котика"""
#     query = update.callback_query
#     await query.answer("Мяу! 🐱")
    
#     captions = [
#         f"{CATS['love']} Котик дня для тебя!",
#         f"{CATS['happy']} Смотри какой милаш!",
#         f"{CATS['heart']} Этот котик передаёт тебе привет!",
#         f"{CATS['sparkles']} Специально для тебя!",
#     ]
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['paw']} Ещё котика!", callback_data='cat_pic')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
    
#     # Удаляем старое сообщение и отправляем новое с новой картинкой
#     await query.message.delete()
#     await context.bot.send_photo(
#         chat_id=query.message.chat_id,
#         photo=random.choice(CAT_PICS),
#         caption=random.choice(captions),
#         reply_markup=reply_markup
#     )

# async def show_cat_fact(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Показать факт о котиках"""
#     query = update.callback_query
#     await query.answer()
    
#     fact = random.choice(CAT_FACTS)
    
#     message = (
#         f"{CATS['sparkles']} Интересный факт о котиках:\n\n"
#         f"{fact}\n\n"
#         f"{CATS['paw']} Правда же удивительно?"
#     )
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['sparkles']} Ещё факт", callback_data='cat_fact')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def pet_cat(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Погладить котика"""
#     query = update.callback_query
#     await query.answer("Мур-мур-мур! 😸")
    
#     messages = [
#         f"{CATS['love']} *мурчит громко и довольно*\nТы лучшая хозяйка на свете!",
#         f"{CATS['happy']} *подставляет животик*\nПочеши пузико, пожалуйста!",
#         f"{CATS['yum']} *трётся о руку*\nОбожаю твои ласки!",
#         f"{CATS['angel']} *сворачивается клубочком*\nДавай обниматься!",
#         f"{CATS['sparkles']} *делает массаж лапками*\nЭто тебе за ласку!",
#         f"{CATS['heart']} *облизывает пальчик*\nТы пахнешь счастьем!",
#     ]
    
#     message = random.choice(messages)
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['love']} Ещё погладить", callback_data='pet_cat')],
#         [InlineKeyboardButton(f"{CATS['kiss']} Поцеловать котика", callback_data='kiss_cat')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def kiss_cat(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Поцеловать котика"""
#     query = update.callback_query
#     await query.answer("😘💕")
    
#     messages = [
#         f"{CATS['love']} *краснеет под шёрсткой*\nОй, как неожиданно и приятно!",
#         f"{CATS['kiss']} *целует в ответ*\nМур-мур, люблю тебя!",
#         f"{CATS['angel']} *прячет мордочку в лапки*\nТы самая милая!",
#         f"{CATS['heart']} *виляет хвостиком*\nЕщё, ещё, ещё!",
#     ]
    
#     message = f"{random.choice(messages)}\n\n✨ Котик счастлив!"
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['love']} Обнять котика", callback_data='hug_cat')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def hug_cat(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Обнять котика"""
#     query = update.callback_query
#     await query.answer("🤗💕")
    
#     messages = [
#         f"{CATS['hug']} *обнимает лапками*\nТёплые обнимашки - лучшее в мире!",
#         f"{CATS['love']} *прижимается всем тельцем*\nНикогда не отпускай!",
#         f"{CATS['happy']} *мурчит как моторчик*\nТвои объятия волшебные!",
#         f"{CATS['heart']} *засыпает в объятиях*\nТак уютно и безопасно...",
#     ]
    
#     message = f"{random.choice(messages)}\n\n✨ Котик в восторге!"
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['love']} Ещё обняться", callback_data='hug_cat')],
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def leave_review(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Оставить отзыв"""
#     query = update.callback_query
#     await query.answer("Спасибо за отзыв! 💕")
    
#     reviews = [
#         "⭐⭐⭐⭐⭐ Лучший котокофе в мире!",
#         "⭐⭐⭐⭐⭐ Котик-бариста - настоящий профессионал!",
#         "⭐⭐⭐⭐⭐ Обнимашки включены в каждый заказ!",
#         "⭐⭐⭐⭐⭐ Мурчание лечит душу!",
#     ]
    
#     message = (
#         f"{CATS['love']} Твой отзыв:\n\n"
#         f"{random.choice(reviews)}\n\n"
#         f"Спасибо, что ты с нами! {CATS['heart']}"
#     )
    
#     keyboard = [
#         [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
#     ]
    
#     reply_markup = InlineKeyboardMarkup(keyboard)
#     await query.edit_message_caption(
#         caption=message,
#         reply_markup=reply_markup
#     )

# async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     """Обработчик всех callback-кнопок"""
#     query = update.callback_query
    
#     handlers = {
#         'main_menu': start,
#         'drinks_menu': show_drinks_menu,
#         'compliment': give_compliment,
#         'pet_cat': pet_cat,
#         'kiss_cat': kiss_cat,
#         'hug_cat': hug_cat,
#         'cat_pic': show_cat_pic,
#         'cat_fact': show_cat_fact,
#         'leave_review': leave_review,
#     }
    
#     # Проверяем простые обработчики
#     if query.data in handlers:
#         await handlers[query.data](update, context)
#     # Проверяем составные обработчики
#     elif query.data.startswith('drink_'):
#         await customize_drink(update, context)
#     elif query.data.startswith('sugar_yes_'):
#         await ask_sugar_amount(update, context)
#     elif query.data.startswith('sugar_no_'):
#         await ask_cookies(update, context)
#     elif query.data.startswith('sugar_') and query.data.split('_')[1] in ['1', '2', '3']:
#         await ask_cookies(update, context)
#     elif query.data.startswith('cookies_'):
#         await process_order(update, context)
#     elif query.data.startswith('receive_order_'):
#         await receive_order(update, context)

# def main():
#     """Запуск бота"""
#     # Вставь сюда токен своего бота
#     TOKEN = '7568374565:AAHl9zcfkai7Y7RBSL44ZNpD3TL24ZnZ8Fg'
    
#     # Создаем приложение
#     application = Application.builder().token(TOKEN).build()
    
#     # Добавляем обработчики
#     application.add_handler(CommandHandler("start", start))
#     application.add_handler(CallbackQueryHandler(callback_handler))
    
#     # Настраиваем ежедневную отправку котиков
#     setup_daily_cat_job(application)
    
#     # Запускаем бота
#     print(f"{CATS['welcome']} Милейший котокофейный бот запущен! Мяу!")
#     print(f"Ежедневная отправка котиков настроена на 9:00")
#     application.run_polling(allowed_updates=Update.ALL_TYPES)

# if __name__ == '__main__':
#     main()


import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import asyncio
import random
from datetime import datetime, time
import json
import os

# Настройка логирования
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# ID администратора (твой ID для получения уведомлений)
ADMIN_ID = '677822370'  # Замени на свой Telegram ID

# Милые котики для разных ситуаций
CATS = {
    'welcome': '🐱',
    'happy': '😺',
    'love': '😻',
    'yum': '😸',
    'hug': '🤗',
    'kiss': '😘',
    'paw': '🐾',
    'sleepy': '😴',
    'angel': '😇',
    'heart': '💕',
    'sparkles': '✨',
    'flower': '🌸',
}

# Картинки котиков (URL) - расширенный список
CAT_PICS = [
    # Основные картинки
    "https://i.pinimg.com/736x/17/2a/9b/172a9b55bf3e9f5c898cf7c4bbf640d5.jpg",
    "https://i.pinimg.com/736x/10/bc/bd/10bcbdc51fdacda178fbf70267e19251.jpg",
    "https://i.pinimg.com/736x/8c/4f/f4/8c4ff4d8cdfe75284c142e3d692637a7.jpg",
    "https://i.pinimg.com/736x/60/8c/73/608c734c72422e72f68cd5d06be1b400.jpg",
    "https://i.pinimg.com/736x/d6/f2/38/d6f238dcf1e585ef7bc421a18cc7538f.jpg",
    "https://i.pinimg.com/736x/85/61/98/8561985bacec7121a94c572257b4b6ca.jpg",
    "https://i.pinimg.com/736x/f8/37/13/f83713f01951d89720c5665c4a607ef4.jpg",
    "https://i.pinimg.com/736x/73/fa/76/73fa76b27c9934abcefa64fec4d31200.jpg",
    "https://i.pinimg.com/736x/28/8a/f4/288af49966e71c911210cbe91107695d.jpg"
]

# Ежедневные котики - картинка и сообщение для каждого дня недели
DAILY_CATS = {
    0: {  # Понедельник
        'pic': 'https://i.pinimg.com/736x/b1/d3/32/b1d3325adb7bc99ccf093b2a54386d29.jpg',
        'message': f'{CATS["love"]} Доброе утро, солнышко! С новой неделькой! Пусть понедельник будет лёгким и уютным, как мурчание котика! {CATS["sparkles"]}'
    },
    1: {  # Вторник
        'pic': 'https://i.pinimg.com/736x/b2/62/dc/b262dcd0d73f3ae36fbb9d7fd42f4279.jpg',
        'message': f'{CATS["happy"]} Прекрасного вторника, милая! Котик передаёт тебе утренние обнимашки и желает удачного дня! {CATS["hug"]}'
    },
    2: {  # Среда
        'pic': 'https://i.pinimg.com/736x/ea/ab/45/eaab4559698723097225953ce496f665.jpg',
        'message': f'{CATS["yum"]} Серединка недели! Котик приготовил тебе виртуальный кофе с любовью. Ты справишься со всем! {CATS["kiss"]}'
    },
    3: {  # Четверг
        'pic': 'https://i.pinimg.com/736x/39/83/9b/39839b8fe7218ada38d43cdd802a4cda.jpg',
        'message': f'{CATS["angel"]} Счастливого четверга! Котик мурлычет и напоминает, что ты замечательная! {CATS["heart"]}'
    },
    4: {  # Пятница
        'pic': 'https://i.pinimg.com/736x/0f/94/90/0f9490bd5c125b6f2236598002d2df4f.jpg',
        'message': f'{CATS["sparkles"]} Ура, пятница! Котик танцует от радости и желает тебе чудесного окончания недели! {CATS["flower"]}'
    },
    5: {  # Суббота
        'pic': 'https://i.pinimg.com/736x/69/ad/a6/69ada6196ac6d669180a412455198fdf.jpg',
        'message': f'{CATS["sleepy"]} Субботнее утро! Котик предлагает провести день в уюте и радости. Ты заслужила отдых! {CATS["love"]}'
    },
    6: {  # Воскресенье
        'pic': 'https://i.pinimg.com/736x/17/2a/9b/172a9b55bf3e9f5c898cf7c4bbf640d5.jpg',
        'message': f'{CATS["hug"]} Нежного воскресенья! Котик шлёт тебе лучики любви и тёплые объятия! {CATS["paw"]}'
    }
}

# Комплименты для девушки
COMPLIMENTS = [
    "Ты сегодня особенно прекрасна! 💕",
    "Твоя улыбка освещает весь мир! ✨",
    "Ты самая милая на свете! 🌸",
    "Котики мурчат от твоей красоты! 😻",
    "Ты как солнышко - яркая и тёплая! ☀️",
    "Все котики мира хотят с тобой дружить! 🐱",
    "Ты излучаешь доброту и позитив! 🌈",
    "Твои глазки сияют как звёздочки! ⭐",
]

# Милые факты о котиках
CAT_FACTS = [
    "Котики тратят 70% жизни на сон. Мечта! 😴",
    "Когда котик трётся о тебя - он помечает тебя как свою семью! 💕",
    "Котики мурчат на частоте, которая помогает заживлению костей! 🦴",
    "У котиков есть специальный язык для общения с людьми! 🗣️",
    "Котик приносит тебе 'добычу' потому что беспокоится, что ты не умеешь охотиться! 🐭",
    "Медленное моргание котика - это поцелуй! 😘",
    "Котики видят в 6 раз лучше человека в темноте! 👀",
    "У каждого котика уникальный отпечаток носа, как у людей отпечатки пальцев! 👃",
]

# Упрощенное меню напитков
MENU = {
    'tea': 'Чай',
    'tea_milk': 'Чай с молоком',
    'coffee': 'Кофе'
}

# Временное хранилище заказов
current_orders = {}

# Файл для сохранения пользователей
USERS_FILE = 'users.json'

# Загружаем пользователей из файла
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

# Сохраняем пользователей в файл
def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# Словарь пользователей {user_id: chat_id}
registered_users = load_users()

async def send_daily_cat(context: ContextTypes.DEFAULT_TYPE):
    """Отправка ежедневного котика в 9:00"""
    current_day = datetime.now().weekday()
    daily_cat = DAILY_CATS[current_day]
    
    # Отправляем всем зарегистрированным пользователям
    for user_id, chat_id in registered_users.items():
        try:
            await context.bot.send_photo(
                chat_id=chat_id,
                photo=daily_cat['pic'],
                caption=daily_cat['message']
            )
            logger.info(f"Отправлен ежедневный котик пользователю {user_id}")
        except Exception as e:
            logger.error(f"Ошибка при отправке котика пользователю {user_id}: {e}")
    
    logger.info(f"Ежедневная рассылка котиков завершена")

def setup_daily_cat_job(application):
    """Настройка ежедневной отправки котика в 9:00"""
    job_queue = application.job_queue
    
    # Задаём время отправки - 9:00
    send_time = time(hour=9, minute=0, second=0)
    
    # Добавляем задачу в планировщик
    job_queue.run_daily(
        send_daily_cat,
        time=send_time,
        name='daily_cat'
    )
    
    logger.info("Настроена ежедневная отправка котиков в 9:00")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Приветственное сообщение"""
    # Проверяем, откуда пришёл вызов
    if update.message:
        # Обычная команда /start
        user = update.effective_user
        chat_id = update.effective_chat.id
    else:
        # Вызов из callback (кнопка "Назад")
        query = update.callback_query
        user = query.from_user
        chat_id = query.message.chat_id
    
    # Регистрируем пользователя для ежедневной рассылки
    if str(user.id) not in registered_users:
        registered_users[str(user.id)] = chat_id
        save_users(registered_users)
        logger.info(f"Новый пользователь зарегистрирован: {user.id}")
    
    welcome_message = (
        f"{CATS['welcome']} Мяу-мяу, {user.first_name}! {CATS['love']}\n\n"
        f"Я твой личный котокофейный помощник! {CATS['happy']}\n\n"
        f"У меня есть для тебя:\n"
        f"☕ Волшебные напитки\n"
        f"🐱 Милые котики\n"
        f"💕 Комплименты и обнимашки\n\n"
        f"Что желаешь, солнышко? {CATS['sparkles']}\n\n"
        f"P.S. Каждое утро в 9:00 я буду присылать тебе котика дня! 🌅"
    )
    
    keyboard = [
        [InlineKeyboardButton(f"☕ Заказать напиток", callback_data='drinks_menu')],
        [InlineKeyboardButton(f"{CATS['love']} Получить комплимент", callback_data='compliment')],
        [InlineKeyboardButton(f"{CATS['paw']} Погладить котика", callback_data='pet_cat')],
        [InlineKeyboardButton(f"📸 Котик дня", callback_data='cat_pic')],
        [InlineKeyboardButton(f"📚 Факт о котиках", callback_data='cat_fact')],
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        # Отправляем с рандомной картинкой котика
        await update.message.reply_photo(
            photo=random.choice(CAT_PICS),
            caption=welcome_message,
            reply_markup=reply_markup
        )
    else:
        # Редактируем существующее сообщение
        await query.edit_message_caption(
            caption=welcome_message,
            reply_markup=reply_markup
        )

async def show_drinks_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать меню напитков"""
    query = update.callback_query
    await query.answer()
    
    message = f"{CATS['yum']} Что будем пить сегодня?\n\n"
    
    keyboard = []
    for drink_id, drink_name in MENU.items():
        message += f"• {drink_name}\n"
        keyboard.append([InlineKeyboardButton(
            f"{CATS['yum']} {drink_name}", 
            callback_data=f'drink_{drink_id}'
        )])
    
    keyboard.append([InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message + f"\n{CATS['paw']} Что выберешь?",
        reply_markup=reply_markup
    )

async def customize_drink(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Настройка напитка - сахар и печеньки"""
    query = update.callback_query
    await query.answer()
    
    drink_id = query.data.split('_')[1]
    user_id = query.from_user.id
    
    # Сохраняем выбор напитка
    if user_id not in current_orders:
        current_orders[user_id] = {}
    current_orders[user_id]['drink'] = drink_id
    
    message = (
        f"{CATS['sparkles']} Отличный выбор - {MENU[drink_id]}!\n\n"
        f"Теперь давай добавим детали:\n\n"
        f"🍬 Добавить сахар?"
    )
    
    keyboard = [
        [
            InlineKeyboardButton("✅ Да, с сахаром", callback_data=f'sugar_yes_{drink_id}'),
            InlineKeyboardButton("❌ Нет, без сахара", callback_data=f'sugar_no_{drink_id}')
        ],
        [InlineKeyboardButton(f"{CATS['welcome']} Назад", callback_data='drinks_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def ask_sugar_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Спросить количество ложек сахара"""
    query = update.callback_query
    await query.answer()
    
    data = query.data.split('_')
    drink_id = data[2]
    user_id = query.from_user.id
    
    # Сохраняем что сахар нужен
    current_orders[user_id]['sugar'] = True
    
    message = (
        f"{CATS['sparkles']} С сахаром, отлично!\n\n"
        f"🥄 Сколько ложечек положить?"
    )
    
    keyboard = [
        [
            InlineKeyboardButton("1 ложечка", callback_data=f'sugar_1_{drink_id}'),
            InlineKeyboardButton("2 ложечки", callback_data=f'sugar_2_{drink_id}'),
            InlineKeyboardButton("3 ложечки", callback_data=f'sugar_3_{drink_id}')
        ],
        [InlineKeyboardButton(f"{CATS['welcome']} Назад", callback_data='drinks_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def ask_cookies(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Спросить про печеньки"""
    query = update.callback_query
    await query.answer()
    
    data = query.data.split('_')
    
    # Если пришли от выбора сахара
    if data[0] == 'sugar' and data[1] in ['1', '2', '3']:
        sugar_amount = data[1]
        drink_id = data[2]
        user_id = query.from_user.id
        
        # Сохраняем количество ложек
        current_orders[user_id]['sugar_amount'] = int(sugar_amount)
        message_start = f"{CATS['sparkles']} {sugar_amount} ложечка(и) сахара - записала!\n\n"
    elif data[0] == 'sugar' and data[1] == 'no':
        # Без сахара
        drink_id = data[2]
        user_id = query.from_user.id
        current_orders[user_id]['sugar'] = False
        current_orders[user_id]['sugar_amount'] = 0
        message_start = f"{CATS['sparkles']} Без сахара - записала!\n\n"
    else:
        # Неожиданный случай
        message_start = ""
        drink_id = data[2] if len(data) > 2 else None
    
    message = (
        f"{message_start}"
        f"🍪 А печеньки будешь?"
    )
    
    keyboard = [
        [
            InlineKeyboardButton("✅ Да, с печеньками", callback_data=f'cookies_yes_{drink_id}'),
            InlineKeyboardButton("❌ Нет, без печенек", callback_data=f'cookies_no_{drink_id}')
        ],
        [InlineKeyboardButton(f"{CATS['welcome']} Назад", callback_data='drinks_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def process_order(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка готового заказа"""
    query = update.callback_query
    await query.answer()
    
    data = query.data.split('_')
    cookies_choice = data[1]
    drink_id = data[2]
    user_id = query.from_user.id
    user = query.from_user
    
    # Сохраняем выбор печенек
    current_orders[user_id]['cookies'] = (cookies_choice == 'yes')
    
    # Формируем описание заказа
    order = current_orders[user_id]
    drink_name = MENU[order['drink']]
    
    order_details = [drink_name]
    if order.get('sugar'):
        sugar_amount = order.get('sugar_amount', 1)
        if sugar_amount == 1:
            order_details.append("с 1 ложечкой сахара")
        else:
            order_details.append(f"с {sugar_amount} ложечками сахара")
    else:
        order_details.append("без сахара")
    
    if order['cookies']:
        order_details.append("с печеньками 🍪")
    else:
        order_details.append("без печенек")
    
    order_description = ", ".join(order_details)
    
    # Сообщение для пользователя
    user_message = (
        f"{CATS['love']} Ура! Заказ принят!\n\n"
        f"Ты заказала: {order_description}\n\n"
        f"{CATS['sparkles']} Начинаю готовить с любовью! {CATS['happy']}\n\n"
        f"*Котик надевает фартук и берёт чашечку лапками*"
    )
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['heart']} Получить напиток", callback_data=f'receive_order_{user_id}')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Отправляем гифку с готовкой
    await query.message.delete()
    await context.bot.send_photo(
        chat_id=query.message.chat_id,
        photo="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTdxZTUyd3V1aXVqcGNiajd5cmJuNTdkcWdzcnBuajZ0aHp1M2d6NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.gif",
        caption=user_message,
        reply_markup=reply_markup
    )
    
    # Уведомление администратору
    admin_message = (
        f"🔔 Новый заказ!\n\n"
        f"От: {user.first_name} (@{user.username or 'без username'})\n"
        f"Заказ: {order_description}\n"
    )
    
    try:
        await context.bot.send_message(chat_id=ADMIN_ID, text=admin_message)
    except Exception as e:
        logger.error(f"Не удалось отправить уведомление админу: {e}")

async def receive_order(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Получить готовый напиток"""
    query = update.callback_query
    await query.answer("Приятного аппетита! 💕")
    
    user_id = int(query.data.split('_')[2])
    order = current_orders.get(user_id, {})
    
    success_message = (
        f"{CATS['love']} Вжух! Готово!\n\n"
        f"*Котик-бариста протягивает чашечку лапками*\n\n"
        f"{CATS['sparkles']} Вот твой напиток, приготовленный с любовью!\n"
        f"Приятного аппетита, солнышко! {CATS['yum']}\n\n"
        f"*Котик мурчит и виляет хвостиком*"
    )
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['sparkles']} Оставить отзыв", callback_data='leave_review')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Отправляем новое сообщение с готовым напитком и рандомной картинкой
    await query.message.delete()
    await context.bot.send_photo(
        chat_id=query.message.chat_id,
        photo=random.choice(CAT_PICS),  # Теперь здесь рандомная картинка
        caption=success_message,
        reply_markup=reply_markup
    )
    
    # Очищаем заказ
    if user_id in current_orders:
        del current_orders[user_id]

async def give_compliment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Дать комплимент"""
    query = update.callback_query
    await query.answer("💕")
    
    compliment = random.choice(COMPLIMENTS)
    user = query.from_user
    
    message = (
        f"{CATS['love']} {user.first_name}, {compliment}\n\n"
        f"*Котик мурчит и трётся о ножки* {CATS['happy']}"
    )
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['love']} Ещё комплимент", callback_data='compliment')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def show_cat_pic(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать картинку котика"""
    query = update.callback_query
    await query.answer("Мяу! 🐱")
    
    captions = [
        f"{CATS['love']} Котик дня для тебя!",
        f"{CATS['happy']} Смотри какой милаш!",
        f"{CATS['heart']} Этот котик передаёт тебе привет!",
        f"{CATS['sparkles']} Специально для тебя!",
    ]
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['paw']} Ещё котика!", callback_data='cat_pic')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Удаляем старое сообщение и отправляем новое с новой рандомной картинкой
    await query.message.delete()
    await context.bot.send_photo(
        chat_id=query.message.chat_id,
        photo=random.choice(CAT_PICS),  # Рандомная картинка
        caption=random.choice(captions),
        reply_markup=reply_markup
    )

async def show_cat_fact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать факт о котиках"""
    query = update.callback_query
    await query.answer()
    
    fact = random.choice(CAT_FACTS)
    
    message = (
        f"{CATS['sparkles']} Интересный факт о котиках:\n\n"
        f"{fact}\n\n"
        f"{CATS['paw']} Правда же удивительно?"
    )
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['sparkles']} Ещё факт", callback_data='cat_fact')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def pet_cat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Погладить котика"""
    query = update.callback_query
    await query.answer("Мур-мур-мур! 😸")
    
    messages = [
        f"{CATS['love']} *мурчит громко и довольно*\nТы лучшая хозяйка на свете!",
        f"{CATS['happy']} *подставляет животик*\nПочеши пузико, пожалуйста!",
        f"{CATS['yum']} *трётся о руку*\nОбожаю твои ласки!",
        f"{CATS['angel']} *сворачивается клубочком*\nДавай обниматься!",
        f"{CATS['sparkles']} *делает массаж лапками*\nЭто тебе за ласку!",
        f"{CATS['heart']} *облизывает пальчик*\nТы пахнешь счастьем!",
    ]
    
    message = random.choice(messages)
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['love']} Ещё погладить", callback_data='pet_cat')],
        [InlineKeyboardButton(f"{CATS['kiss']} Поцеловать котика", callback_data='kiss_cat')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def kiss_cat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Поцеловать котика"""
    query = update.callback_query
    await query.answer("😘💕")
    
    messages = [
        f"{CATS['love']} *краснеет под шёрсткой*\nОй, как неожиданно и приятно!",
        f"{CATS['kiss']} *целует в ответ*\nМур-мур, люблю тебя!",
        f"{CATS['angel']} *прячет мордочку в лапки*\nТы самая милая!",
        f"{CATS['heart']} *виляет хвостиком*\nЕщё, ещё, ещё!",
    ]
    
    message = f"{random.choice(messages)}\n\n✨ Котик счастлив!"
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['love']} Обнять котика", callback_data='hug_cat')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def hug_cat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обнять котика"""
    query = update.callback_query
    await query.answer("🤗💕")
    
    messages = [
        f"{CATS['hug']} *обнимает лапками*\nТёплые обнимашки - лучшее в мире!",
        f"{CATS['love']} *прижимается всем тельцем*\nНикогда не отпускай!",
        f"{CATS['happy']} *мурчит как моторчик*\nТвои объятия волшебные!",
        f"{CATS['heart']} *засыпает в объятиях*\nТак уютно и безопасно...",
    ]
    
    message = f"{random.choice(messages)}\n\n✨ Котик в восторге!"
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['love']} Ещё обняться", callback_data='hug_cat')],
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def leave_review(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Оставить отзыв"""
    query = update.callback_query
    await query.answer("Спасибо за отзыв! 💕")
    
    reviews = [
        "⭐⭐⭐⭐⭐ Лучший котокофе в мире!",
        "⭐⭐⭐⭐⭐ Котик-бариста - настоящий профессионал!",
        "⭐⭐⭐⭐⭐ Обнимашки включены в каждый заказ!",
        "⭐⭐⭐⭐⭐ Мурчание лечит душу!",
    ]
    
    message = (
        f"{CATS['love']} Твой отзыв:\n\n"
        f"{random.choice(reviews)}\n\n"
        f"Спасибо, что ты с нами! {CATS['heart']}"
    )
    
    keyboard = [
        [InlineKeyboardButton(f"{CATS['welcome']} Главное меню", callback_data='main_menu')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_caption(
        caption=message,
        reply_markup=reply_markup
    )

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик всех callback-кнопок"""
    query = update.callback_query
    
    handlers = {
        'main_menu': start,
        'drinks_menu': show_drinks_menu,
        'compliment': give_compliment,
        'pet_cat': pet_cat,
        'kiss_cat': kiss_cat,
        'hug_cat': hug_cat,
        'cat_pic': show_cat_pic,
        'cat_fact': show_cat_fact,
        'leave_review': leave_review,
    }
    
    # Проверяем простые обработчики
    if query.data in handlers:
        await handlers[query.data](update, context)
    # Проверяем составные обработчики
    elif query.data.startswith('drink_'):
        await customize_drink(update, context)
    elif query.data.startswith('sugar_yes_'):
        await ask_sugar_amount(update, context)
    elif query.data.startswith('sugar_no_'):
        await ask_cookies(update, context)
    elif query.data.startswith('sugar_') and query.data.split('_')[1] in ['1', '2', '3']:
        await ask_cookies(update, context)
    elif query.data.startswith('cookies_'):
        await process_order(update, context)
    elif query.data.startswith('receive_order_'):
        await receive_order(update, context)

def main():
    """Запуск бота"""
    # Вставь сюда токен своего бота
    TOKEN = '7568374565:AAHl9zcfkai7Y7RBSL44ZNpD3TL24ZnZ8Fg'
    
    # Создаем приложение
    application = Application.builder().token(TOKEN).build()
    
    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(callback_handler))
    
    # Настраиваем ежедневную отправку котиков
    setup_daily_cat_job(application)
    
    # Запускаем бота
    print(f"{CATS['welcome']} Милейший котокофейный бот запущен! Мяу!")
    print(f"Ежедневная отправка котиков настроена на 9:00")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()