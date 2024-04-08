
import { useState } from "react";
import style from "./ProductsPage.module.css";

import TablePage from "../../../components/TablePage/TablePage";
import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import { IParamsAPI } from "../../../store/api/DavdamerAPI";



function ProductsPage() {
    const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({
        ordering: ""

    });



    const { data, error, isLoading } = davDamerAPI.useFetchAllProductsQuery(paramsAPI);

    const setParamsFilter = (key: string, value: string | number) => {
        setParamsAPI(() => {
            const obj = Object.assign({}, paramsAPI);
            if (key === "nameSeller") {
                obj["seller"] = value ? value : ""
            } else obj[key] = value

            return obj
        });

    }



    if (isLoading) return (<p>Загрузка данных</p>)
    if (error) return (<p>Ошибка</p>)

    return (
        data && <TablePage setParamsFilter={setParamsFilter} style={style} nameTable="products" products={data} lengthRow={data.length}></TablePage>)
}

export default ProductsPage