//@ts-nocheck
import create, {useStore} from 'zustand'
import { persist } from 'zustand/middleware'
import {CartState, IOrderData} from "@/types/store.interface";

let timers = {}

export const useCart = create<CartState>(persist(

    (set, get) => ({
        items: [],

        addItem: (id, game) => {
            const state = get(); // Получаем текущее состояние

            const item = state.items.find((item) => item.id === id);
            if (item) {
                set((prevState) => ({ // Обновляем состояние с помощью переданной функции set
                    items: prevState.items.map((item) => item.id === id ? { ...item, count: item.count + 1 } : item)
                }));
            } else {
                set((prevState) => ({ // Обновляем состояние с помощью переданной функции set
                    items: [...prevState.items, { id, count: 1, account_id: '', code: null, link: '', game }]
                }));
            }
        },

        // updateCode: (updatedItems, email, totalPrice) => {
        //     const state = get()
        //     const newItems = state.items.map((item) => {
        //         if (updatedItems[item.id]) {
        //             return {
        //                 ...item,
        //                 code: updatedItems[item.id]
        //             };
        //         } else {
        //             return item;
        //         }
        //     });

        //     // Возвращаем обновленные items вместе с order
        //     return {
        //         items: newItems,
        //         order: {
        //             products: newItems.map(item => ({
        //                 product_id: item.id,
        //                 quantity: item.count,
        //                 code: item.code || null,
        //                 account_id: item.account_id || item.link
        //             })),
        //             email: email,
        //             total: totalPrice
        //         }
        //     };
        // },


        // addProductData: (formData) => set((state) => ({
        //     items: state.items.map((item) => {
        //         const matchingFormData = formData.find((data) => data.productId === String(item.id));
        //         if (matchingFormData) {
        //             if (matchingFormData.loginType === "EMAIL_CODE") {
        //                 return { 
        //                     ...item, 
        //                     account_id: matchingFormData.email, 
        //                     code: "", 
        //                     email: matchingFormData.email, 
        //                     type: "EMAIL_CODE",
        //                     game: matchingFormData.game // Сохраняем game
        //                 };
        //             } else if (matchingFormData.loginType === "LINK") {
        //                 return { 
        //                     ...item, 
        //                     account_id: matchingFormData.email, 
        //                     code: "", 
        //                     type: "LINK",
        //                     game: matchingFormData.game // Сохраняем game
        //                 };
        //             }
        //         }
        //         return item;
        //     })
        // })),
        updateCode: (updatedItems, email, totalPrice) => {
            const state = get();
            
            // Преобразуем items в массив отдельных продуктов
            const products = state.items.flatMap(item => {
                // Если у товара есть массив email-ов (для типа EMAIL_CODE)
                if (Array.isArray(item.account_id)) {
                    return item.account_id.map((email, index) => ({
                        product_id: item.id,
                        quantity: 1,
                        code: updatedItems[item.uniqueIds[index]] || null,
                        account_id: email
                    }));
                }
                
                // Для товаров типа LINK или без массива email-ов
                return [{
                    product_id: item.id,
                    quantity: 1,
                    code: updatedItems[item.id] || null,
                    account_id: item.account_id || item.link
                }];
            });
        
            return {
                items: state.items,
                order: {
                    products,
                    email,
                    total: totalPrice
                }
            };
        },
        addProductData: (formData) => set((state) => ({
            items: state.items.map((item) => {
                // Находим все данные для этого товара
                const itemDataArray = formData.filter((data) => 
                    data.productId === String(item.id)
                );
        
                if (itemDataArray.length > 0) {
                    if (itemDataArray[0].loginType === "EMAIL_CODE") {
                        return {
                            ...item,
                            account_id: itemDataArray.map(data => data.email), // Массив email
                            code: "",
                            email: itemDataArray[0].email,
                            type: "EMAIL_CODE",
                            game: itemDataArray[0].game,
                            uniqueIds: itemDataArray.map(data => data.uniqueId) // Сохраняем uniqueIds
                        };
                    } else if (itemDataArray[0].loginType === "LINK") {
                        return {
                            ...item,
                            account_id: itemDataArray[0].email,
                            code: "",
                            type: "LINK",
                            game: itemDataArray[0].game
                        };
                    }
                }
                return item;
            })
        })),

        removeItem: (id) => set((state) => ({
            items: state.items.filter((item) => item.id !== id || item.count > 1)
                .map((item) => item.id === id ? { ...item, count: item.count - 1 } : item)
        })),
        removeArchived: (id) => set((state) => ({
            items: state.items.filter((item) => item.id !== id)
        })),
        removeItemBack: (id) => set((state) => {
            const item = state.items.find((item) => item.id === id)
            if (item) {
                if (item.count > 1) {
                    return {
                        items: state.items.map((item) => item.id === id ? { ...item, count: item.count - 1 } : item)
                    }
                } else {
                    timers[id] = setTimeout(() => {
                        set(state => ({
                            items: state.items.filter(item => item.id !== id)
                        }));
                    }, 10000);
                    return {
                        items: state.items.map((item) => item.id === id ? { ...item, count: 0 } : item)
                    }
                }
            }
        }),
        getTotalCount: () => get().items.reduce((total, item) => total + item.count, 0),
        removeAll: () => set((state) => ({ items: [] })),
        isItemAddedToCart: (productId: number) => get().items.some(item => item.id === productId),
        getItemQuantity: (productId: number) => {
            const item = get().items.find(item => item.id === productId);
            return item ? item.count : 0;
        }
    }),
    {
        name: 'cart-supercell',
        getStorage: () => localStorage,
    }
))

export const useOrderData = create<IOrderData>(persist(
    (set, get) => ({
        email: '',
        setEmail: (email) => set(({email}))
    }), {name: 'orderdata-supercell', getStorage: () => localStorage}
))
