/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import moment from "moment"
import "./Filter.css"
import urlArrow from "../../assets/images/filter-arrow.svg"
import urlSearch from "../../assets/images/search.svg"
import { IDataFilter } from "../TablePage/TablePage"


import { DatePicker, } from 'react-date-picker';
type CloseReason = "select" | "buttonClick" | "escape" | "outsideAction"

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];


interface IProps {
    setParamsFilter: (key: string, value: string) => void | string,
    data: IDataFilter,
}

function Filter(props: IProps) {

    const { setParamsFilter, data } = props;


    const [isActive, setActive] = useState(false)
    const [isSearchImg, setSearchImg] = useState(true);
    const [titleValue, setTitleValue] = useState("");

    const [dataItem, setDataItem] = useState(data[(data["nameFilter"]) as any]);
    const [isID, setIsID] = useState(data["id"] as any);
    const [type, setType] = useState<string | undefined>(data["type"] as any);
    const [searchValue, setSearchValue] = useState("");

    const [isCancel, setIsCancel] = useState(false);


    useEffect(() => {
        setDataItem(data[(data["nameFilter"]) as any])
        setIsID(data["id"] as any)
        setType(data["type"] as any)
    }, [data])

    const [isSearch, setIsSearch] = useState(false);
    const inputSearch = (e: React.MouseEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        const value = target.value;
        setIsSearch(true);
        setSearchValue(value)
        if (value.length === 0) {
            setSearchImg(true);
            setDataItem(data[(data["nameFilter"]) as any]);
            return
        }
        setSearchImg(false);


        const result = data[(data["nameFilter"]) as any].filter((item: any) => item.toString().toLowerCase().indexOf(value.toLowerCase()) !== -1)

        setDataItem(result)


    }
    const clickListItem = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest(".filter__search") || target.matches("ul")) return;
        const value = target.textContent;
        const id = target.getAttribute("data-id");
        setActive(false)
        setIsSearch(false);
        if (value && (value !== "Сбросить")) {
            setDataItem(data[(data["nameFilter"]) as any]);
            setSearchImg(true);
            setTitleValue(value);
            const dateParam = id ? id : value;
            setParamsFilter(data["nameFilter"].toString(), dateParam)
            setIsCancel(true);
        } else {
            setTitleValue(data["title"])
            setParamsFilter(data["nameFilter"].toString(), "")
            setIsCancel(false);
        }


    }
    const clickHeadFilter = () => {
        if (type === 'date') setIsOpenCalendar(true);

        setActive(!isActive)
        setSearchValue("")
    }

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    };
    const closeCalendar = (props: {
        reason: CloseReason;
    }) => {
        if (props.reason === "select") onChange(valueDate);
        if (valueDate) setTitleValue(new Date(valueDate as Date).toLocaleString("ru", options))


        return false
    }

    const doubleClick = () => {
        if (!valueDate) return;
        setIsOpenCalendar(false);
        const date = valueDate as Date;
        setValueDateTitle(date);

        setParamsFilter(data["nameFilter"].toString(), moment(date).format("YYYY-MM-DD"))
        setActive(!isActive)
        setIsCancel(true);
    }



    const [valueDateTitle, setValueDateTitle] = useState<Date>();
    const [valueDate, onChange] = useState<Value>(data["dateValue"] ? data["dateValue"] : new Date());


    const [isOpenCalendar, setIsOpenCalendar] = useState(false);
    const closeCalendarClick = () => {

        setIsOpenCalendar(false);
        setActive(false)
        if (valueDateTitle) {
            onChange(valueDateTitle)
            setTitleValue(new Date(valueDateTitle as Date).toLocaleString("ru", options))
        } else {
            setTitleValue("")
        }
    }
    const clickCancelCalendar = () => {

        setParamsFilter(data["nameFilter"].toString(), "")
        closeCalendarClick()
        setTitleValue("")
        onChange(data["dateValue"] ? data["dateValue"] : new Date())
    }

    const onChangeValue = (e: any) => {
        onChange(e)
    }

    useEffect(() => {
        const calendar = document.querySelector(".react-date-picker__calendar--open") as HTMLElement;
        if (calendar) calendar.style.inset = "100% auto auto 0px";

    })

    return (
        <>
            <div className={"filter " + (((isActive)) ? "active" : "") + " " + ((type === "date") ? "date" : "")} >
                <div className="filter__head" onClick={clickHeadFilter}> <span>{titleValue ? titleValue : data["title"]}</span> <img src={urlArrow} alt="arrow" /> </div>
                {(type !== "date") && <ul className="filter__content scroll__elem" onClick={clickListItem}>
                    {(dataItem.length > 5 || isSearch) && <li className="filter__search">
                        <label htmlFor="search" className={isSearchImg ? "" : "disable"}>
                            <input name="search" type="search" placeholder="Поиск" onInput={inputSearch} value={searchValue} />
                            <img src={urlSearch} alt="search" className="searchImg" />

                        </label>
                    </li>}
                    {isCancel && <li className="cancel">Сбросить</li>}

                    {!isID && <>{dataItem.map((item: any, index: any) => {
                        return <li key={index}>{item.toString()}</li>
                    })}
                    </>
                    }
                    {isID && <>{dataItem.map((item: any, index: any) => {
                        return <li data-id={item["id"]} key={index}>{item["name"].toString()}</li>
                    })}
                    </>
                    }




                </ul>}
                {(type === "date") && (isOpenCalendar) &&
                    <>
                        <span className="filter__close" onClick={closeCalendarClick}>X</span>
                        {isCancel && <span className="calendar__cancel" onClick={clickCancelCalendar}>Сбросить</span>}
                        <div className="calendar" >
                            <DatePicker id="dateCalendar" onDoubleClick={doubleClick} shouldCloseCalendar={closeCalendar} maxDate={data["minNowDate"] ? new Date(new Date().setDate(new Date().getDate() + 366)) : new Date()} minDate={data["minNowDate"] ? new Date(new Date().setDate(new Date().getDate() - 30)) : new Date("12.12.2022")} isOpen={true} calendarClassName="test" className={"calendar"} onChange={onChangeValue} locale="ru-RU" value={valueDate} />
                        </div>
                    </>}
            </div>
        </>
    )
}

export default Filter