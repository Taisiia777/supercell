export enum OrderStatus {
    "NEW" = "Ожидает оплаты",
    "PAID" = "Оплачен. Ожидает обработки",
    "PROCESSING" = "Оплачен. В процессе обработки",
    "DELIVERED" = "Завершен",
    "CANCELLED" = "Отменен"
}