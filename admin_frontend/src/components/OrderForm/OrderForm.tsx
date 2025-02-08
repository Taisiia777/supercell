/* eslint-disable @typescript-eslint/no-explicit-any */
import moment from "moment";
import { useEffect, useRef, useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { useNavigate } from "react-router-dom";

import style from "./OrderForm.module.css"

import urlIconClient from "../../assets/images/clientIcon.svg"
import urlIconCart from "../../assets/images/cartIcon.svg"
import urlIconPay from "../../assets/images/payIcon.svg"
import { IOrderInfo } from "../../models/type";

import TitleProduct from "../TitleProduct/TitleProduct";
import Filter from "../Filter/Filter";

import { statusOrder } from "../../models/type";

import { davDamerAPI } from "../../store/api/DavdamerAPI";
import Modal from "../Modal/Modal";
import urlCopy from "../../assets/images/copy.svg"
import { useLanguage } from "../../context/LanguageContext";


interface IProps {
    edit: boolean,
    data: IOrderInfo
    id?: string | null,
    refBtn: any,
    funcRequest?: any,
    sendFormFilters: boolean
}



function OrderForm(props: IProps) {
    const { translations, language } = useLanguage();
    const t = translations.orderReader;
    const { edit, data, id, refBtn, funcRequest } = props;
    console.log(data);

    // const { register, handleSubmit, formState: { errors } } = useForm<any>({
    //     defaultValues: {
    //         line1: data.shipping_address.line1 ? data.shipping_address.line1 : "Не заполнено",

    //     }
    // })
    const { handleSubmit } = useForm<any>()
    const navigate = useNavigate();
    const onSubmit: SubmitHandler<any> = async () => {
        const formData = new FormData();
        formData.append("status", valueFilter);
        try {
            if (funcRequest) {
                const data = await funcRequest({ id: id, body: formData })
                if (data) navigate(`/orders`)
            }
        } catch (err) {
            navigate(`/404`)

        }

    }

    function declOfNum(number: number) {
        const titles = ["товар", "товара", "товаров"]
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }


    const refHead = useRef<HTMLDivElement>(null);
    const refClient = useRef<HTMLDivElement>(null);
    const refDelivery = useRef<HTMLDivElement>(null);
    const refPay = useRef<HTMLDivElement>(null);
    const refOrder = useRef<HTMLDivElement>(null);
    const [isScroll, setIsScroll] = useState(false);
    useEffect(() => {
        let height = 0;
        if (refHead.current) {
            height += refHead.current.clientHeight
        }
        if (refClient.current) height += refClient.current.clientHeight
        if (refDelivery.current) height += refDelivery.current.clientHeight
        if (refPay.current) height += refPay.current.clientHeight
        if (refOrder.current && (refOrder.current.clientHeight > height)) {

            refOrder.current.style.height = height + "px"; setIsScroll(true)
        }


    }, [])


    const [valueFilter, setValueFilter] = useState(data.status);
    const setParamsFilter = (_: string, value: string) => {
        setValueFilter(value ? value : data.status)


    }
    const [statusFilter, setStatusFilter] = useState<any[]>([]);
    const filterStatus = {
        title: data.statusName ? data.statusName : "",
        nameFilter: "status",
        status: statusFilter,
        id: true
    }
    useEffect(() => {
        const arr = [];
        for (const key in statusOrder) {
            const newObj = {
                name: statusOrder[key],
                id: key
            }
            arr.push(newObj);

        }
        setStatusFilter(arr)
    }, [])



    const [isModalCode, sendIsModal] = useState(false);
    const [code, { isLoading: isLoadingCode }] = davDamerAPI.useFetchSendCodeMutation();
    const clickSendCode = async (lineID: number) => {
        try {
            if (id) {
                const data = await code({ id: id, line_id: lineID })
                if (data) sendIsModal(true)

            }


        } catch (err) {
            navigate(`/404`)

        }


    }

    const clickCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    }

    if (isLoadingCode) return <p>Загрузка данных</p>



    return (
        <>
            {isModalCode && <Modal text="Код отправлен" closeModal={() => sendIsModal(false)} />}
            <form className={'form ' + (edit ? "" : "show") + " " + style.form} encType="multipart/form-data" onSubmit={handleSubmit(onSubmit)}>
                <div className={"form__head" + " " + style.form__head} ref={refHead}>
                    <div className={"form__name " + style.form__name}>
                        <div className={style.form__orderTitle}>
                            <p>
                                {/* Номер заказа:  */}
                                {t.orderNumber[language]}
                                </p>
                            <p>{data.number}</p>

                        </div>
                        {data && data.date_placed && <span>{t.orderDate[language]}: {moment(data.date_placed).format("DD.MM.YYYY")}</span>}
                        {data && data.updated_dt && <span> {t.updateDate[language]}: {moment(data.updated_dt).format("DD.MM.YYYY")}</span>}
                    </div>
                    {!edit && <div className={style.status}>
                        {data.statusName}
                    </div>}
                    {edit && <Filter data={filterStatus as any} setParamsFilter={setParamsFilter}></Filter>}
                </div>
                <div className={style.form__client} ref={refClient}>
                    <h3 className="form__title"><img src={urlIconClient} alt="desc" />
                    {t.paymentInfo[language]}

                    {/* О платеже */}
                    </h3>
                    <label className="form__label">
                        <span>
                            {/* Код платежа */}
                            {t.paymentCode[language]}
                            </span>
                        <input defaultValue={data.payment_id} type="text" disabled />
                    </label>


                </div>
                <div className={style.form__pay} ref={refPay}>
                    <h3 className="form__title"><img src={urlIconPay} alt="pay" />
                    {/* Оплата */}
                    {t.payment[language]}
                    </h3>
                    <label className="form__label">
                        <span>{data.total_incl_tax} ₽</span>
                        <input defaultValue={`${data.lines.length} ${declOfNum(data.lines.length)}`} type="text" disabled />
                    </label>
                    <label className="form__label">
                        <span>
                            {/* Способ оплаты */}
                            {t.paymentMethod[language]}
                            </span>
                        <input defaultValue={"Кредитная карта"} type="text" disabled />
                    </label>
                </div>
                <div className={style.form__cart + " "}>
                    <h3 className="form__title"><img src={urlIconCart} alt="cart" />
                    {/* Детали заказа */}
                    {t.orderDetails[language]}

                    </h3>
                    <div className={style.order + " " + (isScroll ? "scroll__elem" : "")} ref={refOrder}>

                        {data.lines.map((item, index) => <div key={index} className={style.infoOrder}>

                            <TitleProduct active={true} categories={item.product.categories} images={item.product.images} title={item.product.title} ></TitleProduct>
                            <p className={style.infoPace}> {item.product.login_type === "EMAIL_CODE" ? t.withLogin[language] : t.withoutLogin[language]}</p>


                            <div className={style.infoCount}>
                                <span>x {item.quantity} </span>
                                <span>{item.unit_price_incl_tax} ₽ / {item.measurement ? item.measurement : "шт."}</span>
                            </div>
                            <div className={style.formInfoProduct}>
                                <label className="form__label">
                                    <span>
                                        {/* {item.product.login_type === "EMAIL_CODE" ? "Аккаунт" : "Пригласительная ссылка"} */}
                                        {item.product.login_type === "EMAIL_CODE" ? 
                                            t.account[language] : 
                                            t.inviteLink[language]
                                        }
                                        </span>
                                    <div className={style.code}>
                                        <input className={style.input} defaultValue={item.login_data.account_id} type="text" readOnly onClick={() => clickCopyCode(item.login_data.account_id)} />
                                        <img src={urlCopy} alt="copy" />
                                    </div>
                                </label>
                                {item.product.login_type === "EMAIL_CODE" && <label className="form__label">
                                    <span>
                                        {/* Код */}
                                        {t.code[language]}

                                        </span>
                                    <div className={style.formCode}>
                                        <div className={style.code}>
                                            <input className={style.input} defaultValue={item.login_data.code} type="text" readOnly onClick={() => clickCopyCode(item.login_data.code)} />
                                            <img src={urlCopy} alt="copy" />
                                        </div>

                                        <div className={"btn btn__table " + style.btn} onClick={() => clickSendCode(item.id)}>
                                            {/* Отправить новый код */}
                                            {t.newCode[language]}

                                            </div>
                                    </div>
                                </label>}</div>

                        </div>
                        )}

                    </div>

                </div>
                <input type="submit" value="Отправить" className="form__submit" ref={refBtn} />

            </form >
        </>
    )
    
}

export default OrderForm