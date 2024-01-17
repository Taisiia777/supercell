import enum


class OrderAction(str, enum.Enum):
    READY = "ready"
    CANCEL = "cancel"
