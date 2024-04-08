import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom'

import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import ErrorPages from '../../Error/ErrorPages';

import CreateHead from '../../../components/CreateHead/CreateHead';
import ProductForm from '../../../components/ProductForm/ProductForm';

interface IProps {
    edit: boolean;
    nameFunc: string;
}
function ProductsShowEdit(props: IProps) {
    const { id } = useParams();
    const { edit, nameFunc } = props;
    const { data, error, isLoading } = davDamerAPI.useFetchGetProductQuery(id ? id : "-2");
    const [editSeller, { isError: editError }] = davDamerAPI.useFetchEditProductMutation();

    console.log(data);


    const btnSubmitRef = useRef<HTMLInputElement>(null)
    const [sendFormFilters, setSendFormFilters] = useState(false);

    const clickSave = () => {
        if (btnSubmitRef.current) { btnSubmitRef.current.click() }
        setSendFormFilters(true)
    }
    if (isLoading) return (<h2>Загрузка данных</h2>)
    if (error || editError) return (<ErrorPages></ErrorPages>)


    return (
        <>
            <CreateHead title="Карточка товара" redirect={false} nameFunc={nameFunc} saveFunc={clickSave} namePage="products" />
            <ProductForm sendFormFilters={sendFormFilters} funcRequest={editSeller} data={data} edit={edit} refBtn={btnSubmitRef} id={id} ></ProductForm>
        </>
    )
}

export default ProductsShowEdit