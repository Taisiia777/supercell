CheckoutExample = {
    "products": [
        {
            "product_id": 3,
            "quantity": 1,
            "account_id": "email@example.com",
            "code": "649971",
        },
    ],
    "email": "customer@example.com",
    "total": 1500,
}

CreateProductExample = {
    "title": "Куртка",
    "description": "Описание",
    "price": 1500,
    "old_price": 1999,
    "measurement": "шт.",
    "is_public": True,
    "categories": ["Одежда"],
    "login_type": "EMAIL_CODE",
}

UpdateProductExample = {
    "title": "Куртка",
    "description": "Описание",
    "price": 1500,
    "old_price": 1999,
    "measurement": "шт.",
    "is_public": True,
    "categories": ["Одежда"],
    "uploaded_images": [],
    "deleted_images": [1],
    "login_type": "LINK",
}
