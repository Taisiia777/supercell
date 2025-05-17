export enum OrderStatus {
    "NEW" = "Ожидает оплаты",
    "PAID" = "Оплачен. Ожидает обработки",
    "PROCESSING" = "Оплачен. В процессе обработки",
    "DELIVERED" = "Завершен",
    "CANCELLED" = "Отменен"
}

// Добавим вспомогательную функцию для безопасного получения статуса
export const getOrderStatusText = (status: string): string => {
    const statusKey = status as keyof typeof OrderStatus;
    return OrderStatus[statusKey] || "Неизвестный статус";
};