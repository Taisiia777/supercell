class AppError(Exception):
    pass


class NoSellerFoundError(AppError):
    pass


class InvalidProductError(AppError):
    pass


class DifferentSellersError(AppError):
    pass
