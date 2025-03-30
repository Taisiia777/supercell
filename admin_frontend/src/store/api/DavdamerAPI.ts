

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IProduct, IOrder, ICategoryAPI, IProductClassesAPI, IOrderInfo, IAttrAPI, IGkAPI } from '../../models/type'
import { statusOrder } from '../../models/type';



interface IReferralStats {
    active_referrals: number;
    total_earnings: number;
    pending_payouts: number;
    conversion_rate: number;
    registered_users: number;
    purchased_users: number;
    recent_earnings: number[];
    top_referrers: {
        id: number;
        name: string;
        earnings: number;
        referrals: number;
    }[];
}

interface IReferralUser {
    id: number;
    name: string;
    email: string;
    registration_date: string;
    total_spent: number;
    orders_count: number;
    status: 'active' | 'inactive';
    referrer_earnings: number;
    paid_amount: number;
    ref_link: string;
}

interface IReferralUsersResponse {
    users: IReferralUser[];
    summary: {
        total_users: number;
        active_users: number;
        total_earnings: number;
        total_pending: number;
    };
}

interface IReferralPayment {
    userId: number;
    amount: number;
    bank?: string;
    phone?: string;
    comment?: string;
}


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
    [key: string]: number | string | File | boolean;
}
interface IParamDeleteImg {
    productID: number,
    imageID: number
}


interface OrderHistory {
    order_number: string;
    date: string;
    amount: number;
    commission: number;
    status: string;
  }
  
  interface PaymentHistory {
    date: string;
    amount: number;
    comment: string;
  }
  
// Нужно обновить в API файле:
interface IReferralUserDetails extends IReferralUser {
    orders: OrderHistory[];
    payments: PaymentHistory[];
    referrals: IReferralUser[];
    social_media?: {
        tiktok: string | null;
        instagram: string | null;
        youtube: string | null;
        vk: string | null;
        telegram: string | null;
    };
    bank_details?: {
        bank: string | null;
        phone: string | null;
    };
}
export const davDamerAPI = createApi({
    reducerPath: 'davDamerAPI',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://api.mamostore.ru/api' }),
    tagTypes: ['Products', 'Orders', 'Referrals'],
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

        fetchReferralStats: build.query<IReferralStats, { period?: string }>({
            query: (params) => ({
                url: '/customer/referral/stats/',
                params: params
            }),
            providesTags: ['Referrals']
        }),

        fetchReferralUsers: build.query<IReferralUsersResponse, void>({
            query: () => ({
              url: '/customer/referral/users/'
            }),
            transformResponse: (response: any) => {
              // Трансформируем полученные данные в формат, который ожидает компонент
              const transformedUsers = response.users.map((user: any) => ({
                id: user.id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.username || 'Нет email',
                registration_date: user.registration_date || 'Неизвестно',
                total_spent: user.total_spent || 0,
                orders_count: user.orders_count || 0,
                status: user.status || 'inactive',
                referrer_earnings: user.referrer_earnings || 0,
                paid_amount: user.paid_amount || 0,
                ref_link: user.ref_link || `https://mamostore.ru/ref/${user.id}`
              }));
              
              return {
                users: transformedUsers,
                summary: response.summary
              };
            },
            providesTags: ['Referrals']
          }),
        makeReferralPayment: build.mutation<{ status: boolean }, IReferralPayment>({
            query: (payment) => ({
                url: '/customer/referral/payment/',
                method: 'POST',
                body: payment
            }),
            invalidatesTags: ['Referrals']
        }),

        getReferralLink: build.query<{ referral_link: string }, { telegram_id: number }>({
            query: (params) => ({
                url: '/customer/referral/link/',
                params: params
            })
        }),

        processReferral: build.mutation<{ status: boolean }, { 
            telegram_id: number; 
            username?: string; 
            full_name?: string; 
            referral_code: string; 
        }>({
            query: (data) => ({
                url: '/customer/referral/process/',
                method: 'POST',
                body: data
            })
        }),

        registerUser: build.mutation<{ status: boolean }, { 
            telegram_id: number; 
            username?: string; 
            full_name?: string;
        }>({
            query: (data) => ({
                url: '/customer/referral/register/',
                method: 'POST',
                body: data
            })
        }),
        fetchSendCode: build.mutation<IParamsMutation, IParamsMutation>({
            query: (body) => {
                let url = `/davdamer/order/${body.id}/request_code/${body.line_id}/`;
                
                // Если body.send_code существует и равно false, добавляем параметр запроса
                if (body.send_code === false) {
                    url += '?send_code=false';
                }
                
                return ({
                    url: url,
                    method: 'POST',
                })
            },
            invalidatesTags: ['Orders']
        }),
        fetchReferralUserDetails: build.query<IReferralUserDetails, number>({
            query: (userId) => ({
              url: `/customer/referral/users/${userId}/details`
            }),
            providesTags: ['Referrals']
          }),
        
    }),
})
