import datetime

from pydantic import BaseModel


class SellerSchema(BaseModel):
    id: int
    name: str


class ProductSchema(BaseModel):
    id: int
    title: str


class OrderLineSchema(BaseModel):
    product: ProductSchema
    quantity: int


class OrderSchema(BaseModel):
    number: str
    seller: SellerSchema
    lines: list[OrderLineSchema]
    date_placed: datetime.datetime
