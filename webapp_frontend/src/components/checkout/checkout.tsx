
'use client'
import styles from "./checkout.module.scss"
import {useCart, useOrderData} from "@/components/store/store";
import Input from "@/components/ui/input/input";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import {useForm, SubmitHandler} from "react-hook-form";
import {useEffect, useState} from "react";
import {requestCode} from "@/actions/requestCode";
import {checkout} from "@/actions/checkout";
import {IProduct} from "@/types/products.interface";
import {useRouter} from "next/navigation";
import {useTelegram} from "@/app/useTg";

interface FormValues {
    [key: string]: string;
}

interface ExpandedItem {
    id: number;
    uniqueId: string;
    account_id: string;
    game: string;
    type: string;
    count: number;
}

export default function CheckOut(props: {data : IProduct[]}) {
    const { user, webApp } = useTelegram();
    const router = useRouter();
    const {items, updateCode, removeAll} = useCart();
    const {email} = useOrderData();
    const [state, setState] = useState<ExpandedItem[]>([]);

    useEffect(() => {
        const expandedItems = items.flatMap(item => {
            const emails = Array.isArray(item.account_id) ? 
                item.account_id : 
                (item.account_id ? [item.account_id] : []);
            
            return emails.map((email, index) => ({
                ...item,
                uniqueId: `${item.id}_${index}`,
                account_id: email,
            })) as ExpandedItem[];
        });
        setState(expandedItems);

        const sendCodeRequests = async () => {
            const emailGroups = items
                .filter(item => Array.isArray(item.account_id))
                .flatMap(item => 
                    (Array.isArray(item.account_id) ? item.account_id : [])
                        .map(email => ({
                            game: item.game,
                            email: email
                        }))
                );

            for (const emailGroup of emailGroups) {
                await requestCode([emailGroup]);
            }
        };

        sendCodeRequests();
    }, [items]);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>();

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        console.log("Raw form data:", data);
        
        const products = state.map(item => ({
            product_id: item.id,
            quantity: 1,
            code: data[item.uniqueId] || null,
            account_id: item.account_id
        }));

        const totalPrice = items.reduce((total, item) => {
            const product = props.data.find(product => product.id === item.id);
            if (product) {
                return total + (Number(item.count) * Number(product.price.incl_tax));
            }
            return total;
        }, 0);

        const orderData = {
            products,
            email,
            total: totalPrice
        };

        setCanPay(true);
        setOrder({ items: state, order: orderData });
    };

    const [isCanPay, setCanPay] = useState(false);
    const [getOrder, setOrder] = useState<any>();

    useEffect(() => {
        if(isCanPay && getOrder) {
            const processCheckout = async () => {
                try {
                    const res = await checkout(getOrder.order, webApp?.initData);
                    if(res && res.payment_url) {
                        router.push(res.payment_url);
                        setCanPay(false);
                        removeAll();
                    }
                } catch (error) {
                    console.error("Checkout error:", error);
                    setCanPay(false);
                }
            };
            processCheckout();
        }
    }, [isCanPay, getOrder]);

    const handleRequest = async (email: string, game: string) => {
        await requestCode([{ email, game }]);
    };

    return (
        <div className={styles.checkout}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                {state
                    .filter((item) => item.type === "EMAIL_CODE")
                    .map((item) => (
                        <div key={item.uniqueId} className={styles.code}>
                            <Input 
                                title="Введите код"
                                productId={item.id}
                                {...register(item.uniqueId, { 
                                    required: true, 
                                    minLength: 6, 
                                    maxLength: 6, 
                                    pattern: /^[0-9]*$/ 
                                })}
                                name={item.uniqueId}
                                value={watch()[item.uniqueId]}
                                style={errors[item.uniqueId] ? { 
                                    boxShadow: "inset 4px 10px 30px 0 #f006" 
                                } : {}}
                                type_action="request_code"
                                validation="code"
                                requestClick={() => handleRequest(item.account_id, item.game)}
                            />
                            {errors[item.uniqueId] && (
                                <p className={styles.error}>
                                    Код должен содержать 6 цифр
                                </p>
                            )}
                            <p>
                                На вашу почту <span>{item.account_id}</span> пришел код для входа. 
                                Его нужно ввести в поле выше без пробелов для игр(ы)
                            </p>
                        </div>
                    ))}
                <PrimaryButton title="Оплатить" type="submit"/>
            </form>
        </div>
    );
}