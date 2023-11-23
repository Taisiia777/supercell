class AppError(Exception):
    pass


class InvalidProductError(AppError):
    pass


class DifferentSellersError(AppError):
    pass
