
// 'use client'
// import styles from "./action-buttons.module.scss"
// import {useCart} from "@/components/store/store";
// import {IProductAdd} from "@/types/add-product.interface";

// function ActionButtons(props: IProductAdd) {
//     const { addItem, removeItem } = useCart();

//     // Обработчик для кнопки удаления
//     const handleRemove = (e: any) => {
//         // Запоминаем текущую позицию скролла
//         const scrollPosition = window.scrollY;
        
//         // Предотвращаем стандартное поведение и всплытие события
//         e.preventDefault();
//         e.stopPropagation();
        
//         // Удаляем товар из корзины
//         removeItem(props.id);
        
//         // Восстанавливаем позицию скролла
//         setTimeout(() => {
//             window.scrollTo({
//                 top: scrollPosition,
//                 behavior: 'instant'
//             });
//         }, 0);
//     };

//     // Обработчик для кнопки добавления
//     const handleAdd = (e: any) => {
//         // Запоминаем текущую позицию скролла
//         const scrollPosition = window.scrollY;
        
//         // Предотвращаем стандартное поведение и всплытие события
//         e.preventDefault();
//         e.stopPropagation();
        
//         // Добавляем товар в корзину
//         addItem(props.id, props.game);
        
//         // Восстанавливаем позицию скролла
//         setTimeout(() => {
//             window.scrollTo({
//                 top: scrollPosition,
//                 behavior: 'instant'
//             });
//         }, 0);
//     };

//     return (
//         <div className={styles.actions} style={{...props?.style, minHeight: props?.minHeightValue}}>
//             <button type="button" className={styles.remove} onClick={handleRemove}>
//                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect x="-0.0012207" width="24" height="24" rx="5" fill="#353F54"/>
//                     <rect x="0.248779" y="0.25" width="23.5" height="23.5" rx="4.75" stroke="url(#paint0_linear_3_330)" strokeOpacity="0.2" strokeWidth="0.5"/>
//                     <path d="M18.9988 11H4.99878C4.73356 11 4.47921 11.1054 4.29167 11.2929C4.10414 11.4804 3.99878 11.7348 3.99878 12C3.99878 12.2652 4.10414 12.5196 4.29167 12.7071C4.47921 12.8946 4.73356 13 4.99878 13H18.9988C19.264 13 19.5184 12.8946 19.7059 12.7071C19.8934 12.5196 19.9988 12.2652 19.9988 12C19.9988 11.7348 19.8934 11.4804 19.7059 11.2929C19.5184 11.1054 19.264 11 18.9988 11Z" fill="white" fillOpacity="0.6"/>
//                     <defs>
//                         <linearGradient id="paint0_linear_3_330" x1="1.49878" y1="1.5" x2="11.4824" y2="14.0833" gradientUnits="userSpaceOnUse">
//                             <stop stopColor="white"/>
//                             <stop offset="1"/>
//                         </linearGradient>
//                     </defs>
//                 </svg>
//             </button>
//             <span className={styles.count}>{props?.count}</span>
//             <button type="button" className={styles.add} onClick={handleAdd}>
//                 <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect x="0.0012207" y="0.752441" width="24" height="24" rx="5" fill="url(#paint0_linear_31_1351)"/>
//                     <rect x="0.251221" y="1.00244" width="23.5" height="23.5" rx="4.75" stroke="url(#paint1_linear_31_1351)" strokeOpacity="0.6" strokeWidth="0.5" style={{mixBlendMode: "overlay"}}/>
//                     <path d="M18.9988 12.2476H12.9988V6.24756C12.9988 5.98234 12.8934 5.72799 12.7059 5.54045C12.5183 5.35292 12.264 5.24756 11.9988 5.24756C11.7336 5.24756 11.4792 5.35292 11.2917 5.54045C11.1041 5.72799 10.9988 5.98234 10.9988 6.24756V12.2476H4.99878C4.73356 12.2476 4.47921 12.3529 4.29167 12.5405C4.10414 12.728 3.99878 12.9823 3.99878 13.2476C3.99878 13.5128 4.10414 13.7671 4.29167 13.9547C4.47921 14.1422 4.73356 14.2476 4.99878 14.2476H10.9988V20.2476C10.9988 20.5128 11.1041 20.7671 11.2917 20.9547C11.4792 21.1422 11.7336 21.2476 11.9988 21.2476C12.264 21.2476 12.5183 21.1422 12.7059 20.9547C12.8934 20.7671 12.9988 20.5128 12.9988 20.2476V14.2476H18.9988C19.264 14.2476 19.5184 14.1422 19.7059 13.9547C19.8934 13.7671 19.9988 13.5128 19.9988 13.2476C19.9988 12.9823 19.8934 12.728 19.7059 12.5405C19.5184 12.3529 19.264 12.2476 18.9988 12.2476Z" fill="white"/>
//                     <defs>
//                         <linearGradient id="paint0_linear_31_1351" x1="1.20122" y1="0.752441" x2="17.9174" y2="33.1696" gradientUnits="userSpaceOnUse">
//                             <stop stopColor="#2A3B67"/>
//                             <stop offset="0.635" stopColor="#4578EE"/>
//                             <stop offset="1" stopColor="#2A3B67"/>
//                         </linearGradient>
//                         <linearGradient id="paint1_linear_31_1351" x1="0.0012207" y1="0.752441" x2="13.6313" y2="29.6445" gradientUnits="userSpaceOnUse">
//                             <stop stopColor="white"/>
//                             <stop offset="1"/>
//                         </linearGradient>
//                     </defs>
//                 </svg>
//             </button>
//         </div>
//     );
// }

// export default ActionButtons

'use client'
import styles from "./action-buttons.module.scss"
import {useCart} from "@/components/store/store";
import {IProductAdd} from "@/types/add-product.interface";
import toast from "react-hot-toast"; // Добавьте этот импорт

function ActionButtons(props: IProductAdd) {
    const { addItem, removeItem } = useCart();

    // Обработчик для кнопки удаления
    const handleRemove = (e: any) => {
        // Запоминаем текущую позицию скролла
        const scrollPosition = window.scrollY;
        
        // Предотвращаем стандартное поведение и всплытие события
        e.preventDefault();
        e.stopPropagation();
        
        // Удаляем товар из корзины
        removeItem(props.id);
        
        // Восстанавливаем позицию скролла
        setTimeout(() => {
            window.scrollTo({
                top: scrollPosition,
                behavior: 'instant'
            });
        }, 0);
    };

    // Обработчик для кнопки добавления
    const handleAdd = (e: any) => {
        // Запоминаем текущую позицию скролла
        const scrollPosition = window.scrollY;
        
        // Предотвращаем стандартное поведение и всплытие события
        e.preventDefault();
        e.stopPropagation();
        
        // Получаем тип товара из props или используем значение по умолчанию
        const loginType = props.loginType || "EMAIL_CODE";
        
        // Добавляем товар в корзину с учетом типа входа
        const success = addItem(props.id, props.game, loginType);
        
        // Если добавление было успешным, можно показать уведомление
        if (success) {
            toast.success("Товар добавлен в корзину");
        }
        // В случае неудачи toast.error выводится внутри функции addItem
        
        // Восстанавливаем позицию скролла
        setTimeout(() => {
            window.scrollTo({
                top: scrollPosition,
                behavior: 'instant'
            });
        }, 0);
    };

    return (
        <div className={styles.actions} style={{...props?.style, minHeight: props?.minHeightValue}}>
            <button type="button" className={styles.remove} onClick={handleRemove}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="-0.0012207" width="24" height="24" rx="5" fill="#353F54"/>
                    <rect x="0.248779" y="0.25" width="23.5" height="23.5" rx="4.75" stroke="url(#paint0_linear_3_330)" strokeOpacity="0.2" strokeWidth="0.5"/>
                    <path d="M18.9988 11H4.99878C4.73356 11 4.47921 11.1054 4.29167 11.2929C4.10414 11.4804 3.99878 11.7348 3.99878 12C3.99878 12.2652 4.10414 12.5196 4.29167 12.7071C4.47921 12.8946 4.73356 13 4.99878 13H18.9988C19.264 13 19.5184 12.8946 19.7059 12.7071C19.8934 12.5196 19.9988 12.2652 19.9988 12C19.9988 11.7348 19.8934 11.4804 19.7059 11.2929C19.5184 11.1054 19.264 11 18.9988 11Z" fill="white" fillOpacity="0.6"/>
                    <defs>
                        <linearGradient id="paint0_linear_3_330" x1="1.49878" y1="1.5" x2="11.4824" y2="14.0833" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white"/>
                            <stop offset="1"/>
                        </linearGradient>
                    </defs>
                </svg>
            </button>
            <span className={styles.count}>{props?.count}</span>
            <button type="button" className={styles.add} onClick={handleAdd}>
                <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.0012207" y="0.752441" width="24" height="24" rx="5" fill="url(#paint0_linear_31_1351)"/>
                    <rect x="0.251221" y="1.00244" width="23.5" height="23.5" rx="4.75" stroke="url(#paint1_linear_31_1351)" strokeOpacity="0.6" strokeWidth="0.5" style={{mixBlendMode: "overlay"}}/>
                    <path d="M18.9988 12.2476H12.9988V6.24756C12.9988 5.98234 12.8934 5.72799 12.7059 5.54045C12.5183 5.35292 12.264 5.24756 11.9988 5.24756C11.7336 5.24756 11.4792 5.35292 11.2917 5.54045C11.1041 5.72799 10.9988 5.98234 10.9988 6.24756V12.2476H4.99878C4.73356 12.2476 4.47921 12.3529 4.29167 12.5405C4.10414 12.728 3.99878 12.9823 3.99878 13.2476C3.99878 13.5128 4.10414 13.7671 4.29167 13.9547C4.47921 14.1422 4.73356 14.2476 4.99878 14.2476H10.9988V20.2476C10.9988 20.5128 11.1041 20.7671 11.2917 20.9547C11.4792 21.1422 11.7336 21.2476 11.9988 21.2476C12.264 21.2476 12.5183 21.1422 12.7059 20.9547C12.8934 20.7671 12.9988 20.5128 12.9988 20.2476V14.2476H18.9988C19.264 14.2476 19.5184 14.1422 19.7059 13.9547C19.8934 13.7671 19.9988 13.5128 19.9988 13.2476C19.9988 12.9823 19.8934 12.728 19.7059 12.5405C19.5184 12.3529 19.264 12.2476 18.9988 12.2476Z" fill="white"/>
                    <defs>
                        <linearGradient id="paint0_linear_31_1351" x1="1.20122" y1="0.752441" x2="17.9174" y2="33.1696" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#2A3B67"/>
                            <stop offset="0.635" stopColor="#4578EE"/>
                            <stop offset="1" stopColor="#2A3B67"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_31_1351" x1="0.0012207" y1="0.752441" x2="13.6313" y2="29.6445" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white"/>
                            <stop offset="1"/>
                        </linearGradient>
                    </defs>
                </svg>
            </button>
        </div>
    );
}

export default ActionButtons