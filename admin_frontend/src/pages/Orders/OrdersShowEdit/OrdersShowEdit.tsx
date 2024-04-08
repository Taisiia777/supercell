import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom'

import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import ErrorPages from '../../Error/ErrorPages';

import CreateHead from '../../../components/CreateHead/CreateHead';
import OrderForm from '../../../components/OrderForm/OrderForm';

interface IProps {
    edit: boolean;
    nameFunc: string;
}
function ProductsShowEdit(props: IProps) {
    const { id } = useParams();

    const { edit, nameFunc } = props;
    const { data, error, isLoading } = davDamerAPI.useFetchGetOrderQuery(id ? id : "-2");


    const [editOrder, { isError: editError }] = davDamerAPI.useFetchEditOrderMutation();

    const btnSubmitRef = useRef<HTMLInputElement>(null)
    const [sendFormFilters, setSendFormFilters] = useState(false);
    const clickSave = () => {
        if (btnSubmitRef.current) { btnSubmitRef.current.click() }
        setSendFormFilters(true)
    }
    if (isLoading) return (<h2>Загрузка данных</h2>)
    if (error || editError || !data) return (<ErrorPages></ErrorPages>)

    return (
        <>
            <CreateHead title="Карточка заказа" redirect={false} nameFunc={nameFunc} saveFunc={clickSave} namePage="orders" />
            <OrderForm sendFormFilters={sendFormFilters} funcRequest={editOrder} data={data} edit={edit} refBtn={btnSubmitRef} id={id} ></OrderForm>
        </>
    )
}

export default ProductsShowEdit