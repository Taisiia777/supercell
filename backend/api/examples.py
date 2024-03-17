CheckoutExample = {
    "products": [
        {"product_id": 3, "quantity": 1, "account_id": "email@example.com"},
    ],
    "total": 1500.99,
}

CreateProductExample = {
    "title": "Куртка",
    "description": "Описание",
    "price": 1500.99,
    "old_price": 1999,
    "measurement": "шт.",
    "is_public": True,
    "categories": ["Одежда"],
    "login_type": "EMAIL_CODE",
}

UpdateProductExample = {
    "title": "Куртка",
    "description": "Описание",
    "price": 1500.99,
    "old_price": 1999,
    "measurement": "шт.",
    "is_public": True,
    "categories": ["Одежда"],
    "uploaded_images": [],
    "deleted_images": [1],
    "login_type": "LINK",
}
