import logging

from oscar.apps.basket.abstract_models import AbstractBasket

from core import exceptions as exc

import uuid

from oscar.apps.partner.strategy import Selector

logger = logging.getLogger(__name__)


class Basket(AbstractBasket):
    def _get_product_seller(self, product, options):
        try:
            info = self.get_stock_info(product, options)
            return info.stockrecord.partner
        except Exception:
            logger.warning("No seller for product %s", product.pk)
            raise exc.NoSellerFoundError(
                f"Не найден поставщик продукта {product.title}"
            )

    def _get_seller(self, options):
        for line in self.all_lines()[:1]:
            return self._get_product_seller(line.product, options)

    def add_product(self, product, quantity=1, options=None):
        product_seller = self._get_product_seller(product, options)
        basket_seller = self._get_seller(options)
        if basket_seller is not None and product_seller != basket_seller:
            raise exc.DifferentSellersError("Product does not belong to this seller")

        return super().add_product(product, quantity, options)

    def add_product(self, product, quantity=1, options=None):
        if options is None:
            options = {}
        
        # Генерируем уникальный line_reference с помощью UUID
        line_reference = str(uuid.uuid4())
            
        # Проверяем продавца
        product_seller = self._get_product_seller(product, options)
        basket_seller = self._get_seller(options)
        if basket_seller is not None and product_seller != basket_seller:
            raise exc.DifferentSellersError("Product does not belong to this seller")

        # Получаем stockrecord для создания line
        info = self.get_stock_info(product, options)

        # Получаем стратегию ценообразования
        strategy = Selector().strategy()
        purchase_info = strategy.fetch_for_product(product)

        # Создаем новую линию для каждого добавления
        line = self.lines.create(
            line_reference=line_reference,
            product=product,
            quantity=quantity,
            stockrecord=info.stockrecord,
            price_currency=purchase_info.price.currency,
            price_excl_tax=purchase_info.price.excl_tax,
            price_incl_tax=purchase_info.price.incl_tax
        )
        
        self.reset_offer_applications()
        return line
  

from oscar.apps.basket.models import *  # noqa
