'use client'
import styles from "./checkout.module.scss"
import {useCart, useOrderData} from "@/components/store/store";
import Input from "@/components/ui/input/input";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import {useForm} from "react-hook-form";
import {useEffect, useState} from "react";
import {requestCode} from "@/actions/requestCode";
import {checkout} from "@/actions/checkout";
import {IProduct} from "@/types/products.interface";
import {useRouter} from "next/navigation";
import {useTelegram} from "@/app/useTg";
import {IOrders} from "@/types/orders.interface";


interface CartStateItem {
    id: number;
    account_id: string;
    game: string;
    type?: "EMAIL_CODE" | "LINK";
    email?: string;
    code?: string;
}


export default function CheckOut(props: {data : IProduct[]}) {

    const { user, webApp } = useTelegram();

    const router = useRouter()

    const {items, updateCode, removeAll} = useCart()
    const {email} = useOrderData()
    const [state, setState] = useState<any>([])

    useEffect(() => {
        setState(items)
    }, [items]);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

    const [getOrder, setOrder] = useState<any>()
    const [isCanPay, setCanPay] = useState(false)
    const onSubmit = (data: any) => {
        console.log(data)

        const totalPrice = items.reduce((total, item) => {
            // Находим соответствующий продукт из списка всех продуктов
            const product = props.data.find(product => product.id === item.id);
            if (product) {
                // Если продукт найден, учитываем его стоимость и количество в корзине
                return total + (Number(item.count) * Number(product.price.incl_tax));
            } else {
                return total;
            }
        }, 0);


        setCanPay(true)

        const update = updateCode(data, email, totalPrice);
        setOrder(update);

        // Получаем order из состояния
        if (update) {

        } else {
            setCanPay(false)
            console.log("Нет обновлений"); // Если updateCode не вернул никаких обновлений
        }
    };


    useEffect(() => {
        if(isCanPay) {
            const fetchData = async () => {
                const updatedItems = getOrder.items;
                const order = getOrder.order;
                console.log("@@@@@@@@@@@@@@@@@@")
                console.log(order)
                console.log("@@@@@@@@@@@@@@@@@@")

                const res = await checkout(order, webApp?.initData);
                console.log(res)
                if(res && res.payment_url) {
                    router.push(res.payment_url);
                    setCanPay(false)
                    removeAll()
                }
            };
            fetchData();
        }

    }, [isCanPay]);

    const emails = items.filter(items => items.account_id).map(item => item.account_id)

    const emailsWithGame = items
        .filter(item => item.account_id && item.game && item.type === "EMAIL_CODE")
        .map(item => ({ game: item.game, email: item.account_id }))

    useEffect(() => {
        const fetchEmail = async () => {
            console.log(items)

            const codes = await requestCode(emailsWithGame)
            console.log("REQUEST ALL")
            console.log(emailsWithGame)
        }
        fetchEmail()
    }, []);

    const handleRequest = async (email: string, game: string) => {
        console.log({email, game})
        await requestCode([{ email, game }])
    }

    // const handleRequest = async (email: number) => {
    //     console.log(email)
    //     await requestCode([email])
    // }

    return (
        <div className={styles.checkout}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                {/* {state && state.filter((item: { email: string, account_id: string, game: string }) => item.email).map((item: { id: number, account_id: string, game: string }, index: number) => {
                    const uid = item.id.toString();
                    return (
                        <div key={uid} className={styles.code}>
                            <Input title="Введите код"
                                   productId={item.id}
                                   {...register(uid, { required: true, minLength: 6, maxLength: 6, pattern: /^[0-9]*$/ })}
                                   name={uid}
                                // setValue={setValue}
                                   value={watch().uid}
                                   style={errors[uid] ? { boxShadow: "inset 4px 10px 30px 0 #f006" } : {}}
                                   type_action="request_code"
                                   requestClick={() => handleRequest(item.account_id, item.game)}
                            />
                            {errors[uid] ? <p className={styles.error}>Код должен содержать 6 цифр</p> : null}
                            <p>На вашу почту <span>{item.account_id}</span> пришел код для входа. Его нужно ввести в поле выше без пробелов для игр(ы)</p>
                        </div>
                    )
                })} */}
{state && state
    .filter((item: { email: string, account_id: string, game: string }) => item.email)
    .map((item: { id: number, account_id: string, game: string }, index: number) => {
        const uid = item.id.toString();
        return (
            <div key={uid} className={styles.code}>
                <Input 
                    title="Введите код"
                    productId={item.id}
                    {...register(uid, { 
                        required: true, 
                        minLength: 6, 
                        maxLength: 6, 
                        pattern: /^[0-9]*$/ 
                    })}
                    name={uid}
                    value={watch().uid}
                    style={errors[uid] ? { boxShadow: "inset 4px 10px 30px 0 #f006" } : {}}
                    type_action="request_code"
                    requestClick={() => handleRequest(item.account_id, item.game)}
                />
                {errors[uid] && <p className={styles.error}>Код должен содержать 6 цифр</p>}
                <p>На вашу почту <span>{item.account_id}</span> пришел код для входа. Его нужно ввести в поле выше без пробелов для игр(ы)</p>
            </div>
        )
    })}
                <PrimaryButton title="Оплатить" type="submit"/>
            </form>
        </div>
    )
}