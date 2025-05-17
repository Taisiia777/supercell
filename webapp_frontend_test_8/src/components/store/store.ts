//@ts-nocheck
import create, {useStore} from 'zustand'
import { persist } from 'zustand/middleware'
import {CartState, IOrderData} from "@/types/store.interface";
import toast from 'react-hot-toast'; // Добавьте этот импорт

let timers = {}
const LOGIN_TYPES = {
    WITH_LOGIN: ["EMAIL_CODE", "URL_EMAIL"],
    WITHOUT_LOGIN: ["LINK", "URL_LINK"]
  };
  
  const getProductGroup = (loginType) => {
    if (LOGIN_TYPES.WITH_LOGIN.includes(loginType)) return "WITH_LOGIN";
    if (LOGIN_TYPES.WITHOUT_LOGIN.includes(loginType)) return "WITHOUT_LOGIN";
    return "UNKNOWN";
  };
export const useCart = create<CartState>(persist(

    (set, get) => ({
        items: [],

        // addItem: (id, game) => {
        //     const state = get(); // Получаем текущее состояние

        //     const item = state.items.find((item) => item.id === id);
        //     if (item) {
        //         set((prevState) => ({ // Обновляем состояние с помощью переданной функции set
        //             items: prevState.items.map((item) => item.id === id ? { ...item, count: item.count + 1 } : item)
        //         }));
        //     } else {
        //         set((prevState) => ({ // Обновляем состояние с помощью переданной функции set
        //             items: [...prevState.items, { id, count: 1, account_id: '', code: null, link: '', game }]
        //         }));
        //     }
        // },
// Модифицируйте функцию addItem, чтобы она принимала loginType и проверяла совместимость
addItem: (id, game, loginType) => {
    const state = get();
    
    // Проверяем совместимость с существующими товарами
    if (state.items.length > 0) {
      // Определяем группу добавляемого товара
      const newItemGroup = getProductGroup(loginType);
      
      // Находим тип первого товара в корзине
      const firstItem = state.items[0];
      const existingItemType = firstItem.type || loginType;
      const existingItemGroup = getProductGroup(existingItemType);
      
      // Если группы разные, показываем ошибку
      if (newItemGroup !== existingItemGroup && newItemGroup !== "UNKNOWN" && existingItemGroup !== "UNKNOWN") {
        // Формируем понятное сообщение об ошибке
        let errorMessage;
        
        if (existingItemGroup === "WITH_LOGIN") {
          errorMessage = "В корзине уже есть товары с входом. Нельзя добавить товар без входа.";
        } else {
          errorMessage = "В корзине уже есть товары без входа. Нельзя добавить товар с входом.";
        }
        
        toast.error(errorMessage);
        return false;
      }
    }
    
    // Если проверка пройдена или корзина пуста, добавляем товар
    const item = state.items.find((item) => item.id === id);
    if (item) {
      set((prevState) => ({ 
        items: prevState.items.map((item) => item.id === id ? { ...item, count: item.count + 1 } : item)
      }));
    } else {
      set((prevState) => ({ 
        items: [...prevState.items, { id, count: 1, account_id: '', code: null, link: '', game, type: loginType }]
      }));
    }
    
    return true;
  },
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
        addProductData: (formData) => set((state) => {
            // Создаем новый массив элементов
            const newItems = formData.map(formItem => {
                // Находим соответствующий товар в текущем состоянии корзины
                const originalItem = state.items.find(item => item.id === parseInt(formItem.productId));
                
                if (originalItem) {
                    // Создаем новый объект товара с теми же свойствами оригинального товара
                    const newItem = {...originalItem};
                    
                    // Обновляем специфические поля в зависимости от типа
                    if (formItem.loginType === "EMAIL_CODE") {
                        newItem.account_id = formItem.email;
                        newItem.code = "";
                        newItem.email = formItem.email;
                        newItem.type = "EMAIL_CODE";
                        newItem.count = 1; // Устанавливаем количество 1
                    } else if (formItem.loginType === "LINK") {
                        newItem.account_id = formItem.email;
                        newItem.code = "";
                        newItem.type = "LINK";
                        newItem.count = 1; // Устанавливаем количество 1
                    } else if (formItem.loginType === "URL_EMAIL") {
                        newItem.account_id = formItem.email;
                        newItem.code = "";
                        newItem.email = formItem.email;
                        newItem.type = "URL_EMAIL";
                        newItem.friendUrl = formItem.friendUrl || "";
                        newItem.count = 1; // Устанавливаем количество 1
                    } else if (formItem.loginType === "URL_LINK") {
                        newItem.account_id = formItem.email;
                        newItem.code = "";
                        newItem.email = formItem.email;
                        newItem.type = "URL_LINK";
                        newItem.friendUrl = formItem.friendUrl || "";
                        newItem.count = 1; // Устанавливаем количество 1
                    }
                    
                    return newItem;
                }
                
                return null;
            }).filter(item => item !== null);
        
            // Возвращаем новый массив элементов
            return {
                items: newItems
            };
        }),
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
