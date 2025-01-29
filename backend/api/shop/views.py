import logging

from django.db.models import Q
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema, OpenApiParameter
from oscar.apps.partner.strategy import Selector
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from oscarapi.views.checkout import CheckoutView as CoreCheckoutView
from oscarapi.views.product import ProductList as CoreProductList
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.reverse import reverse_lazy
from rest_framework.views import APIView

from api.davdamer.filtersets import PRODUCT_ORDERS_COUNT
from api.shop import serializers
from core.exceptions import InvalidProductError, AppError
from core.models import City, EmailCodeRequest
from celery_app import app as celery_app
import uuid

logger = logging.getLogger(__name__)

CoreProductDetail = get_api_class("views.product", "ProductDetail")
Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
Category = get_model("catalogue", "Category")
Order = get_model("order", "Order")
Option = get_model('catalogue', 'Option')


@method_decorator(cache_page(30), name="list")
class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerSerializer
    queryset = Seller.objects.filter(stockrecords__isnull=False).distinct()


@method_decorator(cache_page(30), name="list")
@extend_schema(deprecated=True)
class SellerProductCategoriesListView(generics.ListAPIView):
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        seller_id = self.kwargs["seller_id"]
        return Category.objects.filter(
            Q(product__stockrecords__partner_id=seller_id)
        ).distinct()


@method_decorator(cache_page(60), name="list")
class ProductCategoriesListView(generics.ListAPIView):
    serializer_class = serializers.ShopCategorySerializer
    queryset = Category.objects.browsable().filter(product__isnull=False).distinct()

    def get_queryset(self):
        qs = super().get_queryset()
        result = set()
        for category in qs:
            if category.depth > 1:
                result.add(category.get_parent())
            else:
                result.add(category)
        result = sorted(result, key=lambda x: x.path)
        return result


@method_decorator(cache_page(60), name="list")
class PopularCategoriesListView(ProductCategoriesListView):
    def get_queryset(self):
        qs = super().get_queryset()
        return qs[:3]


@extend_schema(
    parameters=[
        OpenApiParameter(name="category_id", type=int),
        OpenApiParameter(name="search", type=str),
    ]
)
class ProductListView(CoreProductList):
    serializer_class = serializers.ProductLinkSerializer
    queryset = (
        Product.objects.browsable()
        .select_related("seller", "product_class")
        .prefetch_related("images", "stockrecords", "categories")
        .distinct()
    )

    def get_queryset(self):
        qs = super().get_queryset()

        category_id = self.request.query_params.get("category_id", "")
        if category_id and category_id.isdigit():
            qs = qs.filter(categories__id=category_id)

        search = self.request.query_params.get("search", "")
        if search:
            qs = qs.filter(title__icontains=search)

        return qs


@extend_schema(
    deprecated=True, parameters=[OpenApiParameter(name="category_id", type=int)]
)
class SellerProductsListView(CoreProductList):
    serializer_class = serializers.ProductLinkSerializer
    queryset = (
        Product.objects.browsable()
        .select_related("product_class", "seller")
        .prefetch_related("images", "stockrecords", "categories")
    )

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(seller__id=self.kwargs["seller_id"]).distinct()

        category_id = self.request.query_params.get("category_id", "")
        if category_id and category_id.isdigit():
            qs = qs.filter(categories__id=category_id)

        return qs


@extend_schema(tags=["in-development"])
class PaymentView(APIView):
    @staticmethod
    def get(request, *args, **kwargs):
        return Response(
            {
                "payment_method_code": "enot",
                "url": "<payment provider url will be here>",
            },
            status=status.HTTP_418_IM_A_TEAPOT,
        )


# @method_decorator(cache_page(15), name="retrieve")
class ProductDetailView(generics.RetrieveAPIView):
    queryset = (
        Product.objects.browsable()
        .select_related("product_class", "seller")
        .prefetch_related("images", "stockrecords", "categories")
    )
    serializer_class = serializers.ProductSerializer


@extend_schema(
    request=serializers.APICheckoutSerializer,
    responses=serializers.OrderSerializer,
)
class CheckoutAPIView(CoreCheckoutView):
    permission_classes = [IsAuthenticated]
    products_serializer_class = serializers.APICheckoutSerializer
    order_serializer_class = serializers.OrderSerializer
    serializer_class = serializers.CheckoutSerializer
    serializer = None

    default_country = reverse_lazy("country-detail", kwargs={"pk": "RU"})

    def _fill_basket(self):
        for product_data in self.serializer.validated_data["products"]:
            try:
                product = Product.objects.public().get(id=product_data["product_id"])
                qnt = product_data["quantity"]
                self.request.basket.add_product(product, qnt)
            except (Product.DoesNotExist, ValueError) as err:
                raise InvalidProductError(str(err)) from err
            except Exception as err:
                logger.exception(err)
                raise AppError(str(err)) from err

    # def _fill_basket(self):
    #     for index, product_data in enumerate(self.serializer.validated_data["products"], start=1):
    #         try:
    #             # Получаем продукт
    #             product = Product.objects.public().get(id=product_data["product_id"])
    #             qnt = product_data["quantity"]

    #             # Получаем стратегию ценообразования
    #             strategy = Selector().strategy()
    #             purchase_info = strategy.fetch_for_product(product)

    #             # Проверяем доступность продукта
    #             if not purchase_info.availability.is_purchase_permitted(qnt):
    #                 raise ValidationError(f"Недостаточно товара {product.title} на складе")

    #             # Получаем stockrecord
    #             stockrecord = product.stockrecords.first()
    #             if not stockrecord:
    #                 raise ValidationError(f"Нет доступных записей о складе для товара {product.title}")

    #             # Создаем уникальный line_reference 
    #             line_reference = f"{product.id}_{index}_{uuid.uuid4().hex}"

    #             # Создаем новую линию в корзине с уникальным reference
    #             line = self.request.basket.lines.create(
    #                 basket=self.request.basket, 
    #                 product=product, 
    #                 stockrecord=stockrecord,
    #                 quantity=qnt,
    #                 price_currency=purchase_info.price.currency,
    #                 price_excl_tax=purchase_info.price.excl_tax,
    #                 price_incl_tax=purchase_info.price.incl_tax,
    #                 line_reference=line_reference  # Добавляем уникальный line_reference
    #             )

    #             # Дополнительная обработка (если необходимо)
    #             line.save()

    #         except Product.DoesNotExist:
    #             raise InvalidProductError(f"Продукт с ID {product_data['product_id']} не найден")
    #         except ValidationError as err:
    #             raise InvalidProductError(str(err))
    #         except Exception as err:
    #             logger.exception(f"Ошибка при добавлении продукта в корзину: {err}")
    #             raise AppError(f"Не удалось добавить продукт {product.title} в корзину") from err
    # def _fill_basket(self):
    #     product_data_dict = {
    #         product_data["product_id"]: {
    #             "email": product_data.get("email", ""),
    #             "code": product_data.get("code", ""),
    #             "quantity": product_data["quantity"]
    #         }
    #         for product_data in self.serializer.validated_data["products"]
    #     }

    #     for index, product_data in enumerate(self.serializer.validated_data["products"], start=1):
    #         try:
    #             # Получаем продукт
    #             product = Product.objects.public().get(id=product_data["product_id"])
                
    #             # Получаем стратегию ценообразования
    #             strategy = Selector().strategy()
    #             purchase_info = strategy.fetch_for_product(product)
                
    #             # Проверяем доступность продукта
    #             if not purchase_info.availability.is_purchase_permitted(product_data_dict[product.id]["quantity"]):
    #                 raise ValidationError(f"Недостаточно товара {product.title} на складе")
                
    #             # Получаем stockrecord
    #             stockrecord = product.stockrecords.first()
    #             if not stockrecord:
    #                 raise ValidationError(f"Нет доступных записей о складе для товара {product.title}")
                
    #             # Создаем уникальный line_reference
    #             line_reference = f"{product.id}_{index}_{uuid.uuid4().hex}"
                
    #             # Создаем новую линию в корзине с уникальным reference
    #             line = self.request.basket.lines.create(
    #                 basket=self.request.basket,
    #                 product=product,
    #                 stockrecord=stockrecord,
    #                 quantity=product_data_dict[product.id]["quantity"],
    #                 price_currency=purchase_info.price.currency,
    #                 price_excl_tax=purchase_info.price.excl_tax,
    #                 price_incl_tax=purchase_info.price.incl_tax,
    #                 line_reference=line_reference
    #             )
                
    #             # Сохраняем уникальные данные для каждого товара
    #             line.email = product_data_dict[product.id]["email"]
    #             line.code = product_data_dict[product.id]["code"]
    #             line.save()
                
    #         except Product.DoesNotExist:
    #             raise InvalidProductError(f"Продукт с ID {product_data['product_id']} не найден")
    #         except ValidationError as err:
    #             raise InvalidProductError(str(err))
    #         except Exception as err:
    #             logger.exception(f"Ошибка при добавлении продукта в корзину: {err}")
    #             raise AppError(f"Не удалось добавить продукт {product.title} в корзину") from err
    


    def _parse_products_and_fill_basket(self):
        serializer = self.products_serializer_class(data=self.request.data)
        serializer.is_valid(raise_exception=True)

        self.serializer = serializer
        self.request.basket.flush()
        self._fill_basket()

        basket_url = self.request.build_absolute_uri(
            reverse("basket-detail", kwargs={"pk": self.request.basket.pk})
        )
        self.request.data["basket"] = basket_url

    def post(self, request, *args, **kwargs):
        try:
            self._parse_products_and_fill_basket()
        except ValidationError:
            raise
        except AppError as err:
            return Response({"success": False, "message": str(err)}, status=400)
        except Exception as err:
            logger.exception(f"Uncaught checkout error: {err}")
            return Response({"success": False, "message": "Server error"}, status=500)

        # refresh order's updated fields (like payment_link)
        response = super().post(request, *args, **kwargs)
        if response.status_code != status.HTTP_200_OK:
            return response

        order = Order.objects.get(number=response.data["number"])
        context = {"request": request}
        response = Response(self.order_serializer_class(order, context=context).data)
        return response


@extend_schema(tags=["in-development"])
class ProductAllocationTestView(APIView):
    serializer_class = serializers.BasketProductSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": serializer.errors}, status=400
            )

        try:
            product_id = serializer.validated_data["product_id"]
            qnt = serializer.validated_data["quantity"]
            product = Product.objects.get(id=product_id)
        except (Product.DoesNotExist, ValueError) as err:
            return Response({"success": False, "message": str(err)}, status=400)

        strategy = Selector().strategy()
        info = strategy.fetch_for_product(product)
        result = info.availability.is_purchase_permitted(qnt)
        return Response({"success": True, "message": result})


@method_decorator(cache_page(15), name="list")
class CityListView(generics.ListAPIView):
    serializer_class = serializers.CitySerializer
    queryset = (
        City.objects.filter(sellers__stockrecords__isnull=False)
        .distinct()
        .order_by("name")
    )


class PopularProductsListView(generics.ListAPIView):
    serializer_class = serializers.ProductLinkSerializer
    queryset = (
        Product.objects.browsable()
        .annotate(
            orders_count=PRODUCT_ORDERS_COUNT,
        )
        .select_related("seller", "product_class")
        .prefetch_related("images", "stockrecords", "categories")
        .order_by("-orders_count")
        .distinct()
    )[:5]


class DistrictListView(generics.ListAPIView):
    serializer_class = serializers.DistrictSerializer

    def get_queryset(self):
        return [
            {"id": 1, "name": "ЖК «Скандинавия»"},
            {"id": 2, "name": "ЖК «Испанские кварталы»"},
            {"id": 3, "name": "ЖК «Филатов луг»"},
            {"id": 4, "name": "ЖК «Саларьево парк»"},
            {"id": 5, "name": "ЖК «Румянцево парк»"},
        ]


class RequestCodeAPIView(APIView):
    @staticmethod
    def save_code_requests(requests: list[serializers.CodeRequestSerializer]):
        for request in requests:
            code_request = EmailCodeRequest.objects.create(
                email=request["email"], game=request["game"]
            )
            celery_app.send_task("api.shop.request_code", args=[code_request.pk])

    @extend_schema(
        request=serializers.EmailCodeRequestSerializer,
        responses=serializers.ResponseStatusSerializer,
    )
    def post(self, request, *args, **kwargs):
        serializer = serializers.EmailCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.save_code_requests(serializer.validated_data["emails"])

        return Response({"status": True})
