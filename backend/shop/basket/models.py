from oscar.apps.basket.abstract_models import AbstractBasket

from core.exceptions import DifferentSellersError


class Basket(AbstractBasket):
    def _get_product_seller(self, product, options):
        info = self.get_stock_info(product, options)
        return info.stockrecord.partner

    def _get_seller(self, options):
        for line in self.all_lines()[:1]:
            return self._get_product_seller(line.product, options)

    def add_product(self, product, quantity=1, options=None):
        product_seller = self._get_product_seller(product, options)
        basket_seller = self._get_seller(options)
        if basket_seller is not None and product_seller != basket_seller:
            raise DifferentSellersError("Product does not belong to this seller")

        return super().add_product(product, quantity, options)


from oscar.apps.basket.models import *  # noqa
