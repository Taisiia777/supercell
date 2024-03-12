CheckoutExample = {
    "products": [
        {"product_id": 3, "quantity": 1},
    ],
    "total": 1500.99,
    "shipping_address": {
        "first_name": "Иван",
        "last_name": "Иванов",
        "line1": "ул. Пушкина, д. 1",
        "state": "Москва",
        "district": "ЖК «Скандинавия»",
        "phone_number": "+7 (999) 999-99-99",
        "notes": "Доставить вечером",
        "date": "2024-03-17",
        "time": "08:00-20:00",
    },
}

CreateProductExample = {
    "title": "Куртка",
    "description": "Описание",
    "price": 1500.99,
    "old_price": 1999,
    "measurement": "шт.",
    "is_public": True,
    "country": "Россия",
    "is_vegan": True,
    "is_sugar_free": False,
    "is_gluten_free": False,
    "is_dietary": False,
    "categories": ["Одежда"],
    "attributes": [{"code": "size", "value": "XS"}],
    "login_type": "NEED_LOGIN",
}

UpdateProductExample = {
    "title": "Куртка",
    "description": "Описание",
    "price": 1500.99,
    "old_price": 1999,
    "measurement": "шт.",
    "is_public": True,
    "country": "Россия",
    "is_vegan": True,
    "is_sugar_free": False,
    "is_gluten_free": False,
    "is_dietary": False,
    "categories": ["Одежда"],
    "attributes": [{"code": "size", "value": "XXL"}],
    "uploaded_images": [],
    "deleted_images": [1],
    "new_seller_id": 1,
    "login_type": "WITHOUT_LOGIN",
}
