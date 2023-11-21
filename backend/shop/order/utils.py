from oscar.apps.order.utils import OrderNumberGenerator as CoreOrderNumberGenerator
import uuid


class OrderNumberGenerator(CoreOrderNumberGenerator):
    def order_number(self, basket=None):
        num = uuid.uuid4().hex[:6].upper()
        return num
