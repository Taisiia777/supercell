
import { useState } from "react";
import style from "./OrdersPage.module.css";

import TablePage from "../../../components/TablePage/TablePage";
import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import { IParamsAPI } from "../../../store/api/DavdamerAPI";

import { statusOrder } from "../../../models/type";


function OrdersPage() {
    const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({

    });


    const { data, error, isLoading } = davDamerAPI.useFetchAllOrdersQuery(paramsAPI);

    const setParamsFilter = (key: string, value: string | number) => {
        setParamsAPI(() => {
            const obj = Object.assign({}, paramsAPI);

            if (key === "statusName") {
                if (value === "") {
                    delete obj["status"]
                } else {
                    const objStatus = Object.entries(statusOrder);
                    let status = "";
                    objStatus.forEach((item) => {
                        if (item[1] === value) {
                            status = item[0]
                            return
                        }
                    })
                    obj["status"] = status.toUpperCase();
                }



            } else obj[key] = value
            return obj
        });

    }



    if (isLoading) return (<p>Загрузка данных</p>)
    if (error) return (<p>Ошибка</p>)

    return (
        data && <TablePage setParamsFilter={setParamsFilter} style={style} nameTable="orders" orders={data} lengthRow={data.length}></TablePage>)
}

export default OrdersPage