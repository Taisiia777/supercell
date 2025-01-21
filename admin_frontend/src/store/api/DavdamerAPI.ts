

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IProduct, IOrder, ICategoryAPI, IProductClassesAPI, IOrderInfo, IAttrAPI, IGkAPI } from '../../models/type'
import { statusOrder } from '../../models/type';

export interface IParamsAPI {
    [key: string]: number | string;
}


interface IProductAnswer {
    results: IProduct[]
}
interface IOrderAnswer {
    results: IOrder[]
}

interface IParamsMutation {
    [key: string]: number | string | File;
}
interface IParamDeleteImg {
    productID: number,
    imageID: number
}

export const davDamerAPI = createApi({
    reducerPath: 'davDamerAPI',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://api.mamostore.ru/api' }),
    tagTypes: ['Products', 'Orders'],
    endpoints: (build) => ({
        fetchAllProducts: build.query<IProduct[], IParamsAPI>({
            query:
                (args) => ({
                    url: `/davdamer/product/`,
                    params: { ...args }
                }),
            transformResponse: ((res: IProductAnswer) => {
                const newArr = res.results.map((item) => {
                    item["category"] = [...item.categories];
                    return item
                })
                return newArr
            }),

            providesTags: ['Products']
        }),
        fetchAllOrders: build.query<IOrder[], IParamsAPI>({
            query:
                (args) => ({

                    url: `/davdamer/order/`,
                    params: { ...args }

                }),
            transformResponse: ((res: IOrderAnswer) => {


                const arr = res.results.map((item) => {
                    const status = item.status.toUpperCase()

                    item.statusName = statusOrder[status];
                    return item
                })

                return arr
            }),

            providesTags: ['Orders']
        }),

        fetchGetCategory: build.query<ICategoryAPI[], void>({
            query:
                () => ({ url: `/davdamer/enums/category/` })

        }),
        fetchGetProductClass: build.query<IProductClassesAPI[], void>({
            query:
                () => ({ url: `/davdamer/productclasses/` })

        }),
        fetchCreateProduct: build.mutation<IParamsMutation, IParamsMutation>({
            query: (body) => {
                return ({
                    url: `/davdamer/seller/1/add_product/`,
                    method: 'POST',
                    body: body.body
                })
            },
            invalidatesTags: ['Products']
        }),
        fetchGetProduct: build.query<IProduct, string | undefined>({
            query:
                (id) => {
                    if (!id) return ({ url: `/davdamer/product/` })
                    return (
                        {
                            url: `/davdamer/product/${id}/`,

                        })
                },

            providesTags: ['Products']
        }),
        deleteImgProduct: build.mutation<void, IParamDeleteImg>({
            query: (body) => {
                return ({
                    url: `/davdamer/product/${body.productID}/image/${body.imageID}/`,
                    method: 'DELETE',
                })
            },
            invalidatesTags: ['Products']
        }),
        fetchEditProduct: build.mutation<IParamsMutation, IParamsMutation>({
            query: (body) => {
                return ({
                    url: `/davdamer/product/${body.id}/`,
                    method: 'PATCH',
                    body: body.body
                })
            },
            invalidatesTags: ['Products']
        }),
        fetchGetOrder: build.query<IOrderInfo, string | undefined>({
            query:
                (id) => {
                    if (!id) return ({ url: `/davdamer/order/` })
                    return (
                        {
                            url: `/davdamer/order/${id}/`,

                        })
                },
            transformResponse: ((res: IOrderInfo) => {
                res.statusName = statusOrder[res.status];
                return res
            }),
            providesTags: ['Orders']
        }),
        fetchEditOrder: build.mutation<IParamsMutation, IParamsMutation>({
            query: (body) => {
                return ({
                    url: `/davdamer/order/${body.id}/`,
                    method: 'PATCH',
                    body: body.body
                })
            },
            invalidatesTags: ['Orders']
        }),
        fetchGetAttr: build.query<IAttrAPI[], void>({
            query:
                () => ({ url: `/davdamer/enums/attribute/` })

        }),
        fetchGetGK: build.query<IGkAPI[], void>({
            query:
                () => ({ url: `/shop/districts/` })

        }),

        fetchDelProduct: build.mutation<IParamsMutation, IParamsMutation>({
            query: (body) => {
                return ({
                    url: `/davdamer/product/${body.id}/`,
                    method: 'DELETE',
                })
            },
            invalidatesTags: ['Products']
        }),
        fetchSendCode: build.mutation<IParamsMutation, IParamsMutation>({
            query: (body) => {
                return ({
                    url: `/davdamer/order/${body.id}/request_code/${body.line_id}/`,
                    method: 'POST',
                })
            },
            invalidatesTags: ['Orders']
        }),

    })
})
