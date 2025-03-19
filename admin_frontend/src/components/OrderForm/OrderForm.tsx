/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import moment from "moment";

import style from "./OrderForm.module.css";

import urlIconClient from "../../assets/images/clientIcon.svg";
import urlIconCart from "../../assets/images/cartIcon.svg";
import urlIconPay from "../../assets/images/payIcon.svg";
import { IOrderInfo } from "../../models/type";

import TitleProduct from "../TitleProduct/TitleProduct";
import Filter from "../Filter/Filter";

import { statusOrder } from "../../models/type";
import { saveChangedOrderId } from "../../utils/localStorage";

import { davDamerAPI } from "../../store/api/DavdamerAPI";
import Modal from "../Modal/Modal";
import urlCopy from "../../assets/images/copy.svg";
import { useLanguage } from '../../context/LanguageContext';

interface IProps {
    edit: boolean;
    data: IOrderInfo;
    id?: string | null;
    refBtn: any;
    funcRequest?: any;
    sendFormFilters: boolean;
}

function OrderForm(props: IProps) {
    const { edit, data, id, refBtn, funcRequest } = props;
    const { language, translations } = useLanguage();
    const t = translations.orderReader;
    // Use react-hook-form with custom field
    const { register, handleSubmit } = useForm<any>({
        defaultValues: {
            custom_field: data.custom_field || ''
        }
    });
    
    const navigate = useNavigate();
    
    // Enhanced submit handler to include custom fields
    const onSubmit: SubmitHandler<any> = async (formValues) => {
        const formData = new FormData();
        formData.append("status", valueFilter);
        
        // Add custom fields to the request
        if (formValues.custom_field !== undefined) {
            formData.append("custom_field", formValues.custom_field);
        }
        
        try {
            if (funcRequest) {
                const response = await funcRequest({ id: id, body: formData });
                if (response) {
                    // Mark this order as having changes in localStorage
                    if (id) saveChangedOrderId(parseInt(id));
                    navigate(`/orders`);
                }
            }
        } catch (err) {
            navigate(`/404`);
        }
    };

    // function declOfNum(number: number) {
    //     const titles = ["товар", "товара", "товаров"]
    //     const cases = [2, 0, 1, 1, 1, 2];
    //     return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    // }
    function declOfNum(number: number) {
        if (language === "zh") {
            return t.itemCountDeclensions.many[language]; // В китайском нет склонений
        }
        
        // Для русского языка:
        const cases = [2, 0, 1, 1, 1, 2];
        const form = (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5];
        
        if (form === 0) return t.itemCountDeclensions.one[language]; // 1 товар
        if (form === 1) return t.itemCountDeclensions.few[language]; // 2-4 товара
        return t.itemCountDeclensions.many[language]; // 5+ товаров
    }

    // Refs for layout management
    const refHead = useRef<HTMLDivElement>(null);
    const refClient = useRef<HTMLDivElement>(null);
    const refDelivery = useRef<HTMLDivElement>(null);
    const refPay = useRef<HTMLDivElement>(null);
    const refOrder = useRef<HTMLDivElement>(null);
    const refNotes = useRef<HTMLDivElement>(null);
    const [isScroll, setIsScroll] = useState(false);
    
    // Calculate layout heights
    useEffect(() => {
        let height = 0;
        if (refHead.current) {
            height += refHead.current.clientHeight;
        }
        if (refClient.current) height += refClient.current.clientHeight;
        if (refDelivery.current) height += refDelivery.current.clientHeight;
        if (refPay.current) height += refPay.current.clientHeight;
        if (refNotes.current) height += refNotes.current.clientHeight;
        
        if (refOrder.current && (refOrder.current.clientHeight > height)) {
            refOrder.current.style.height = height + "px"; 
            setIsScroll(true);
        }
    }, []);

    // Status filter state management
    const [valueFilter, setValueFilter] = useState(data.status);
    const setParamsFilter = (_: string, value: string) => {
        setValueFilter(value ? value : data.status);
    };
    
    const [statusFilter, setStatusFilter] = useState<any[]>([]);
    const filterStatus = {
        title: data.statusName ? data.statusName : "",
        nameFilter: "status",
        status: statusFilter,
        id: true
    };
    
    useEffect(() => {
        const arr = [];
        for (const key in statusOrder) {
            const newObj = {
                name: statusOrder[key],
                id: key
            };
            arr.push(newObj);
        }
        setStatusFilter(arr);
    }, []);

    // Modal for code sending confirmation
    const [isModalCode, sendIsModal] = useState(false);
    const [code, { isLoading: isLoadingCode }] = davDamerAPI.useFetchSendCodeMutation();
    
    // Enhanced function to send new codes with loginType check
    const clickSendCode = async (lineID: number, loginType: string) => {
        try {
            if (id) {
                // Determine if code needs to be sent based on login type
                const needSendCode = loginType === "EMAIL_CODE" || loginType === "URL_EMAIL";
                
                const data = await code({ 
                    id: id, 
                    line_id: lineID,
                    send_code: needSendCode // true for EMAIL_CODE and URL_EMAIL, false for LINK and URL_LINK
                });
                
                if (data) {
                    sendIsModal(true);
                    // Mark order as changed
                    if (id) saveChangedOrderId(parseInt(id));
                }
            }
        } catch (err) {
            navigate(`/404`);
        }
    };

    const clickCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    // if (isLoadingCode) return <p>Загрузка данных</p>;
    if (isLoadingCode) return <p>{t.loading[language]}</p>;

    // Helper function to determine login type text
    // const getLoginTypeText = (type: string) => {
    //     switch(type) {
    //         case "EMAIL_CODE":
    //             return "С входом";
    //         case "LINK":
    //             return "Без входа";
    //         case "URL_EMAIL":
    //             return "С входом + ссылка";
    //         case "URL_LINK":
    //             return "Без входа + ссылка";
    //         default:
    //             return "Неизвестный тип";
    //     }
    // };
    const getLoginTypeText = (type: string) => {
        switch(type) {
            case "EMAIL_CODE":
                return t.withLogin[language];
            case "LINK":
                return t.withoutLogin[language];
            case "URL_EMAIL":
                return t.withLoginAndLink[language];
            case "URL_LINK":
                return t.withoutLoginAndLink[language];
            default:
                return t.unknownType[language];
        }
    };

    return (
        <>
            {/* {isModalCode && <Modal text="Код отправлен" closeModal={() => sendIsModal(false)} />} */}
            {isModalCode && <Modal text={t.codeSent[language]} closeModal={() => sendIsModal(false)} />}
            <form className={'form ' + (edit ? "" : "show") + " " + style.form} encType="multipart/form-data" onSubmit={handleSubmit(onSubmit)}>
                <div className={"form__head" + " " + style.form__head} ref={refHead}>
                    <div className={"form__name " + style.form__name}>
                        <div className={style.form__orderTitle}>
                            <p>{t.orderNumber[language]}: </p>
                            <p>{data.number}</p>
                        </div>
                        <span>{t.orderDate[language]}: {moment(data.date_placed).format("DD.MM.YYYY")}</span>
                        {data && data.updated_dt && <span>{t.updateDate[language]}: {moment(data.updated_dt).format("DD.MM.YYYY")}</span>}
                    </div>
                    {!edit && <div className={style.status}>
                        {data.statusName}
                    </div>}
                    {edit && <Filter data={filterStatus as any} setParamsFilter={setParamsFilter}></Filter>}
                </div>
                
                <div className={style.form__client} ref={refClient}>
                    {/* <h3 className="form__title"><img src={urlIconClient} alt="desc" />О платеже</h3> */}
                    <h3 className="form__title"><img src={urlIconClient} alt="desc" />{t.paymentSection[language]}</h3>
                    <label className="form__label">
                        <span>{t.paymentCode[language]}</span>
                        {/* <span>Код платежа</span> */}
                        <input defaultValue={data.payment_id} type="text" disabled />
                    </label>
                </div>
                
                <div className={style.form__pay} ref={refPay}>
                    {/* <h3 className="form__title"><img src={urlIconPay} alt="pay" />Оплата</h3> */}
                    <h3 className="form__title"><img src={urlIconPay} alt="pay" />{t.payment[language]}</h3>
                    <label className="form__label">
                        <span>{data.total_incl_tax} ₽</span>
                        <input defaultValue={`${data.lines.length} ${declOfNum(data.lines.length)}`} type="text" disabled />
                    </label>
                    <label className="form__label">
                        {/* <span>Способ оплаты</span> */}
                        <span>{t.paymentMethod[language]}</span>
                        {/* <input defaultValue={"Кредитная карта"} type="text" disabled /> */}
                        <input defaultValue={t.creditCard[language]} type="text" disabled />
                    </label>
                </div>

                {/* New notes section */}
                <div className={style.form__notes} ref={refNotes}>
                    {/* <h3 className="form__title">Заметки к заказу</h3> */}
                    <h3 className="form__title">{t.notesSection[language]}</h3>
                    <label className="form__label">
                        {/* <span>Заметки</span> */}
                        <span>{t.notes[language]}</span>
                        {/* <textarea 
                            className={style.notesTextarea}
                            disabled={!edit}
                            {...register("custom_field")}
                            placeholder={edit ? "Введите заметки к заказу..." : "Нет заметок"}
                        /> */}
                        <textarea 
                            className={style.notesTextarea}
                            disabled={!edit}
                            {...register("custom_field")}
                            placeholder={edit ? t.notesPlaceholder[language] : t.noNotes[language]}
                        />
                    </label>
                </div>

                <div className={style.form__cart + " "}>
                    {/* <h3 className="form__title"><img src={urlIconCart} alt="cart" />Детали заказа</h3> */}
                    <h3 className="form__title"><img src={urlIconCart} alt="cart" />{t.orderDetails[language]}</h3>
                    <div className={style.order + " " + (isScroll ? "scroll__elem" : "")} ref={refOrder}>
                        {data.lines.map((item, index) => {
                            const loginType = item.product.login_type;
                            
                            return (
                                <div key={index} className={style.infoOrder}>
                                    <TitleProduct 
                                        active={true} 
                                        categories={item.product.categories} 
                                        images={item.product.images} 
                                        title={item.product.title} 
                                    />
                                    <p className={style.infoPace}>{getLoginTypeText(item.product.login_type)}</p>

                                    <div className={style.infoCount}>
                                        <span>x {item.quantity} </span>
                                        <span>{item.unit_price_incl_tax} ₽ / {item.measurement ? item.measurement : "шт."}</span>
                                    </div>
                                    <div className={style.formInfoProduct}>
                                        {/* Display appropriate fields based on login type */}
                                        {loginType === "EMAIL_CODE" && (
                                            <label className="form__label">
                                                {/* <span>Аккаунт</span> */}
                                                <span>{t.account[language]}</span>

                                                <div className={style.code}>
                                                    <input 
                                                        className={`${style.input} ${item.login_data.email_changed ? style.changed : ''}`} 
                                                        defaultValue={item.login_data.account_id} 
                                                        type="text" 
                                                        readOnly 
                                                        onClick={() => clickCopyCode(item.login_data.account_id)} 
                                                    />
                                                    <img src={urlCopy} alt="copy" />
                                                    {item.login_data.email_changed && (
                                                        // <span className={style.warningIcon} title="Email был изменен">❗</span>
                                                        <span className={style.warningIcon} title={t.changes.emailChanged[language]}>❗</span>
                                                    )}
                                                </div>
                                            </label>
                                        )}

                                        {loginType === "LINK" && (
                                            <label className="form__label">
                                                {/* <span>Пригласительная ссылка</span> */}
                                                <span>{t.inviteLink[language]}</span>

                                                <div className={style.code}>
                                                    <input 
                                                        className={`${style.input} ${item.login_data.email_changed ? style.changed : ''}`} 
                                                        defaultValue={item.login_data.account_id} 
                                                        type="text" 
                                                        readOnly 
                                                        onClick={() => clickCopyCode(item.login_data.account_id)} 
                                                    />
                                                    <img src={urlCopy} alt="copy" />
                                                    {item.login_data.email_changed && (
                                                        // <span className={style.warningIcon} title="Ссылка была изменена">❗</span>
                                                        <span className={style.warningIcon} title={t.changes.linkChanged[language]}>❗</span>

                                                    )}
                                                </div>
                                            </label>
                                        )}
                                   
                                        {loginType === "URL_EMAIL" && (
                                            <>
                                                <label className="form__label">
                                                    {/* <span>Почта</span> */}
                                                    <span>{t.email[language]}</span>

                                                    <div className={style.code}>
                                                        <input 
                                                            className={style.input} 
                                                            defaultValue={
                                                                item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[0] 
                                                                    : item.login_data?.account_id || ''
                                                            } 
                                                            type="text" 
                                                            readOnly 
                                                            onClick={() => {
                                                                const email = item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[0] 
                                                                    : item.login_data?.account_id || '';
                                                                clickCopyCode(email);
                                                            }} 
                                                        />
                                                        <img src={urlCopy} alt="copy" />
                                                    </div>
                                                </label>
                                                
                                                <label className="form__label">
                                                    {/* <span>Ссылка в друзья</span> */}
                                                    <span>{t.friendLink[language]}</span>

                                                    <div className={style.code}>
                                                        <input 
                                                            className={style.input} 
                                                            defaultValue={
                                                                item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[1] 
                                                                    : item.login_data?.code || ''
                                                            } 
                                                            type="text" 
                                                            readOnly 
                                                            onClick={() => {
                                                                const link = item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[1] 
                                                                    : item.login_data?.code || '';
                                                                clickCopyCode(link);
                                                            }} 
                                                        />
                                                        <img src={urlCopy} alt="copy" />
                                                    </div>
                                                </label>
                                            </>
                                        )}

                                        {loginType === "URL_LINK" && (
                                            <>
                                                <label className="form__label">
                                                    {/* <span>Почта</span> */}
                                                    <span>{t.email[language]}</span>

                                                    <div className={style.code}>
                                                        <input 
                                                            className={style.input} 
                                                            defaultValue={
                                                                item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[0] 
                                                                    : item.login_data?.account_id || ''
                                                            } 
                                                            type="text" 
                                                            readOnly 
                                                            onClick={() => {
                                                                const email = item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[0] 
                                                                    : item.login_data?.account_id || '';
                                                                clickCopyCode(email);
                                                            }} 
                                                        />
                                                        <img src={urlCopy} alt="copy" />
                                                    </div>
                                                </label>
                                                <label className="form__label">
                                                    {/* <span>Ссылка в друзья</span> */}
                                                    <span>{t.inviteLink[language]}</span>

                                                    <div className={style.code}>
                                                        <input 
                                                            className={style.input} 
                                                            defaultValue={
                                                                item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[1] 
                                                                    : item.login_data?.account_id || ''
                                                            } 
                                                            type="text" 
                                                            readOnly 
                                                            onClick={() => {
                                                                const link = item.login_data?.account_id?.includes('|') 
                                                                    ? item.login_data.account_id.split('|')[1] 
                                                                    : item.login_data?.account_id || '';
                                                                clickCopyCode(link);
                                                            }} 
                                                        />
                                                        <img src={urlCopy} alt="copy" />
                                                    </div>
                                                </label>
                                            </>                                            
                                        )}

                                        {/* Code field for all login types */}
                                        <label className="form__label">
                                            {/* <span>Код</span> */}
                                            <span>{t.code[language]}</span>

                                            <div className={style.formCode}>
                                                <div className={style.code}>
                                                    <input 
                                                        className={`${style.input} ${item.login_data.code_changed ? style.changed : ''}`} 
                                                        defaultValue={item.login_data.code} 
                                                        type="text" 
                                                        readOnly 
                                                        onClick={() => clickCopyCode(item.login_data.code)} 
                                                    />
                                                    <img src={urlCopy} alt="copy" />
                                                    {item.login_data.code_changed && (
                                                        // <span className={style.warningIcon} title="Код был изменен">❗</span>
                                                        <span className={style.warningIcon} title={t.changes.codeChanged[language]}>❗</span>

                                                    )}
                                                </div>
                                                {/* <div className={"btn btn__table " + style.btn} onClick={() => clickSendCode(item.id, item.product.login_type)}>
                                                    Отправить новый код
                                                </div> */}
                                                <div className={"btn btn__table " + style.btn} onClick={() => clickSendCode(item.id, item.product.login_type)}>
                                                    {t.sendNewCode[language]}
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* <input type="submit" value="Отправить" className="form__submit" ref={refBtn} /> */}
                <input type="submit" value={t.submit[language]} className="form__submit" ref={refBtn} />

            </form>
        </>
    )
}

export default OrderForm;