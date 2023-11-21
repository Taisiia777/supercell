from oscar.apps.order.processing import EventHandler as CoreEventHandler


class EventHandler(CoreEventHandler):
    def handle_order_status_change(self, order, new_status, note_msg=None):
        return super().handle_order_status_change(order, new_status, note_msg=note_msg)
