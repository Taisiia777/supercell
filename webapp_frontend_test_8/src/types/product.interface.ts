export interface IProductItem<T> {
    item: T;
    count?: number;
    isLoading: boolean;
    counter: boolean;
    game: string;
}