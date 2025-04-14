import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import ClampLines from 'react-clamp-lines';
import moment from "moment";
import styles from "./TablePage.module.css";

import { useMatchMedia } from "../../hooks/use-match-media";
import { IOrder, IProduct } from "../../models/type";
import Pages from "../PagesHead/PagesHead";

import { statusOrder } from "../../models/type";
import { statusOrderColor } from "../../models/type";
import Filter from "../Filter/Filter";
import TitleProduct from "../TitleProduct/TitleProduct";

import Modal from "../Modal/Modal";
import { disablePageScroll, enablePageScroll } from 'scroll-lock';
import { OrderSearch } from "../../pages/Orders/OrdersPageMain/OrdersPage"; 

import { davDamerAPI } from "../../store/api/DavdamerAPI";
import { useLanguage } from '../../context/LanguageContext';
import { saveLastViewedItem, getLastViewedItem, clearLastViewedItem } from '../../utils/localStorage';
import React from 'react';

type TSortingState = "asc" | "desc" | "none"
interface IColumns {
    nameColumn: string,
    stateSort: TSortingState,
    nameResponse: string
}

interface ITable {
    nameColumns: {
        nameColumn: string,
        nameResponse: string
    }[],
    countRow: number,
    title: string,
    filterParams: {
        title: string,
        filter: string,
        type?: "date",
        id?: boolean
    }[]
}

interface ITables {
    products: ITable,
    orders: ITable
}

export interface IDataFilter {
    [key: string]: any,
}

type TNameTable = "products" | "orders"
interface IStyle { [key: string]: string }
interface IProps {
    nameTable: TNameTable,
    orders?: IOrder[],
    products?: IProduct[],
    lengthRow: number,
    style: IStyle,
    setParamsFilter: (key: string, value: string | number) => void,
    onSearch?: (params: { type: 'number' | 'telegram_id', query: string }) => void,
    onOrderView?: (orderId: number) => void
}

function TablePage(props: IProps) {
    const { 
        nameTable, orders, style, lengthRow, products, 
        setParamsFilter, onSearch, onOrderView 
    } = props;
    
    // Получаем переводы
    const { language, translations: t } = useLanguage();
    
    // Row active state
    const [arrRowActive, setArrRowActive] = useState<boolean[]>(Array(lengthRow).fill(false));
    
    // Columns state
    const [nameColumns, setNameColumns] = useState<IColumns[]>([]);

    // Filter data state
    const [dataFilters, setDataFilters] = useState<IDataFilter[]>();
    
    // Products list for toggling visibility
    const [productsList, setProductsList] = useState<IProduct[]>([]);
    
    // Force update helper
    const [, updateState] = useState({});
    const forceUpdate = useCallback(() => updateState({}), []);
    
    // Table wrapper ref for scrolling to items
    const tableWrapperRef = useRef<HTMLDivElement>(null);
    const hasScrolledRef = useRef(false);

    // Определяем таблицы с переводами
    const dataTables: ITables = {
        products: {
            title: t.table.products.title[language],
            nameColumns: [
                { nameColumn: t.table.products.columns.name[language], nameResponse: "title" }, 
                { nameColumn: t.table.products.columns.description[language], nameResponse: "description" }, 
                { nameColumn: t.table.products.columns.price[language], nameResponse: "price" }
            ],
            countRow: 4,
            filterParams: [{ title: t.table.products.filters.game[language], filter: "category" }]
        },
        orders: {
            title: t.table.orders.title[language],
            nameColumns: [
                { nameColumn: t.table.orders.columns.orderNumber[language], nameResponse: "number" }, 
                { nameColumn: t.table.orders.columns.dateTime[language], nameResponse: "date_placed" }, 
                { nameColumn: t.table.orders.columns.status[language], nameResponse: "status" }, 
                { nameColumn: t.table.orders.columns.clientId[language], nameResponse: "user" }, 
                { nameColumn: t.table.orders.columns.sum[language], nameResponse: "total" }
            ],
            countRow: 4,
            filterParams: [
                { title: t.table.orders.filters.status[language], filter: "statusName" }, 
                { title: t.table.orders.filters.orderDate[language], filter: "date", type: "date" }
            ]
        },
    };
    
    // Helper to get filter array elements
    // const getElemArrFilters = (data: any, item: any) => {
    //     const arr: any[] = [];
        
    //     if (item.filter === "statusName") {
    //         // For statuses return all possible values from statusOrder
    //         return Object.values(statusOrder);
    //     }
        
    //     if (item["id"]) {
    //         data.map((i: any) => {
    //             if (item.type === "date") return i;
    //             const elem = i[item.filter];
    //             const indexArr = arr.findIndex((el) => el["id"] === elem["id"]);
    //             if (indexArr !== -1) return i;
    //             arr.push(i[item.filter]);
    //             return i;
    //         });
    //     } else {
    //         data.map((i: any) => {
    //             if (item.type === "date") return i;
    //             const elem = i[item.filter].toLocaleString();
    //             if (arr.indexOf(elem) === -1) arr.push(elem);
    //             return i;
    //         });
    //     }
        
    //     return arr;
    // };
    const getElemArrFilters = (data: any, item: any) => {
        const arr: any[] = [];
        
        if (item.filter === "statusName") {
            // For statuses return all possible values from statusOrder
            return Object.values(statusOrder);
        }
        
        if (item["id"]) {
            data.forEach((i: any) => {
                if (item.type === "date") return;
                
                const elem = i[item.filter];
                // Проверяем, что elem существует
                if (!elem) return;
                
                const indexArr = arr.findIndex((el) => el && el["id"] === elem["id"]);
                if (indexArr !== -1) return;
                arr.push(i[item.filter]);
            });
        } else {
            data.forEach((i: any) => {
                if (item.type === "date") return;
                
                // Проверяем, что i[item.filter] существует перед использованием
                const fieldValue = i[item.filter];
                if (fieldValue === undefined || fieldValue === null) return;
                
                const elem = fieldValue.toLocaleString();
                if (arr.indexOf(elem) === -1) arr.push(elem);
            });
        }
        
        return arr;
    };
    // Set up initial data
    useEffect(() => {
        setArrRowActive(Array(lengthRow).fill(false));
        
        setNameColumns(dataTables[nameTable].nameColumns.map((item) => {
            return {
                nameColumn: item.nameColumn,
                nameResponse: item.nameResponse,
                stateSort: "none"
            };
        }));
        
        setDataFilters(dataTables[nameTable].filterParams.map((item) => {
            const title = item.title;
            const keyFilter = item.filter;
            let arr: any[] = [];
            
            if (products) arr = getElemArrFilters(products, item);
            if (orders) arr = getElemArrFilters(orders, item);
            
            const type = item.type ? item.type : "";
            
            // For status filter, set default title as paid
            if (keyFilter === "statusName") {
                return Object.assign(
                    { type: type }, 
                    { title: statusOrder["PAID"] }, 
                    { nameFilter: keyFilter }, 
                    { [keyFilter]: [...arr] }, 
                    { id: item.id }
                );
            }
    
            return Object.assign(
                { type: type }, 
                { title: title }, 
                { nameFilter: keyFilter }, 
                { [keyFilter]: [...arr] }, 
                { id: item.id }
            );
        }));
        
        if (products) {
            setProductsList([...products]);
        }
    }, [lengthRow, products, orders, language]);
    useEffect(() => {
        // If already scrolled or no data, exit
        if (hasScrolledRef.current || (!products && !orders)) {
            return;
        }
        
        // Get the last viewed item ID
        const lastItemId = getLastViewedItem(nameTable === 'products' ? 'product' : 'order');
        if (!lastItemId) {
            return;
        }
        
        // Get the items array
        const items = nameTable === 'products' ? products : orders;
        if (!items) {
            return;
        }
        
        // Find the item index
        const itemIndex = items.findIndex(item => item.id === lastItemId);
        if (itemIndex === -1) {
            return;
        }
        
        // Set a timeout to allow DOM to render
        setTimeout(() => {
            // Find the row element by ID
            const rowElement = document.getElementById(`${nameTable === 'products' ? 'product' : 'order'}-${lastItemId}`);
            
            if (rowElement && tableWrapperRef.current) {
                // Scroll to the element
                rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Highlight the row
                setArrRowActive(prev => {
                    const newState = [...prev].fill(false);
                    newState[itemIndex] = true;
                    return newState;
                });
                
                // Mark as scrolled
                hasScrolledRef.current = true;
                
                // Clear the last viewed item
                clearLastViewedItem(nameTable === 'products' ? 'product' : 'order');
            }
        }, 300);
    }, [products, orders, nameTable]);
    
    // Responsive check
    const { isMobile } = useMatchMedia();
    const hasScroll = !isMobile && lengthRow > dataTables[nameTable].countRow;

    // Handle row click to activate it
    const clickRow = (id: number, item?: IOrder | IProduct) => {
      if (arrRowActive) {
        setArrRowActive(arrRowActive.map((_, index) => {
          if (index === id) return true;
          return false;
        }));
      }
      
      // Если это заказ и у нас есть onOrderView callback
      if (nameTable === 'orders' && item && onOrderView) {
        onOrderView((item as IOrder).id);
      }
    };
    
    // Handle click on table (outside rows) to deactivate all rows
    const clickTable = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest(".row") && (!target.closest(".row__title"))) return;
        setArrRowActive(arrRowActive.map(() => false));
    };

    // Handle column click for sorting
    const clickColumn = (i: number) => {
        const newArr = nameColumns.map((item, index) => {
            if (i === index) {
                item.stateSort = (item.stateSort === "none") ? "desc" : (item.stateSort === "desc") ? "asc" : "none";
                const str = (item.stateSort === "asc") ? item.nameResponse : (item.stateSort === "desc") ? `-${item.nameResponse}` : "";
                setParamsFilter("ordering", str);
            } else {
                item.stateSort = "none";
            }
            return item;
        });
        
        setNameColumns(newArr);
    };

    // Function to toggle product visibility
    const toggleVisibility = async (e: React.MouseEvent<HTMLElement>, product: IProduct) => {
        // Prevent event bubbling
        e.preventDefault();
        e.stopPropagation();
        
        // New visibility value
        const newVisibility = !product.is_public;
        
        try {
            // Update state before API call for immediate feedback
            const updatedList = productsList.map(p => 
                p.id === product.id ? { ...p, is_public: newVisibility } : p
            );
            setProductsList(updatedList);
            
            // Force update
            forceUpdate();
            
            // Call API to toggle visibility
            const response = await fetch(`https://api.mamostore.ru/api/davdamer/product/${product.id}/toggle_visibility/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to update product visibility');
            }
            
            // Get updated data from response
            const updatedProduct = await response.json();
            
            // If server response differs from our expectation, update UI
            if (updatedProduct && typeof updatedProduct.is_public !== 'undefined') {
                const finalList = productsList.map(p => 
                    p.id === product.id ? { ...p, is_public: updatedProduct.is_public } : p
                );
                setProductsList(finalList);
                forceUpdate();
            }
        } catch (error) {
            console.error("Error toggling product visibility:", error);
            
            // Revert to previous state on error
            const revertList = productsList.map(p => 
                p.id === product.id ? { ...p, is_public: product.is_public } : p
            );
            setProductsList(revertList);
            forceUpdate();
            
            // Alert user
            alert(t.table.products.tableInterface.messages.error[language]);
        }
    };

    // Product deletion
    const [deleteProduct] = davDamerAPI.useFetchDelProductMutation();
    const [idDelProduct, setIdDelProduct] = useState<number>();
    
    const clickDel = (id: number) => {
        setIdDelProduct(id);
        disablePageScroll();
    };

    const closeModal = () => {
        setIdDelProduct(undefined);
        enablePageScroll();
    };

    // Save item ID before navigating to detail view
    const handleItemClick = (id: number, type: 'product' | 'order') => {
        saveLastViewedItem(type, id);
    };

    // Определение статусов заказов с переводами
    const translatedStatusOrder: Record<string, string> = {};
    Object.keys(statusOrder).forEach(key => {
        translatedStatusOrder[key] = t.table.products.orderStatuses[key as keyof typeof t.table.products.orderStatuses]?.[language] || statusOrder[key];
    });

    return (
        <div onClick={clickTable} className={styles.table}>
            {idDelProduct && (
                <Modal 
                    text={t.table.products.actions.deleteConfirm[language]} 
                    funcRequest={deleteProduct} 
                    id={idDelProduct} 
                    closeModal={closeModal}
                />
            )}
            
            <Pages title={dataTables[nameTable].title} />
            <div className={styles.head__table}>
                {/* Search component for orders */}
                {onSearch && nameTable === 'orders' && <OrderSearch onSearch={onSearch} />}

                <div>
                    {(products) && <Link to={`/${nameTable}/create`} className={"btn__head btn__active " + styles.btn}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M19 12.998H13V18.998H11V12.998H5V10.998H11V4.99805H13V10.998H19V12.998Z" fill="white" />
                        </svg>
                        <span>{t.table.products.actions.add[language]}</span>
                    </Link>}
                </div>
                <div className={styles.head__filters}>
                    {dataFilters && dataFilters.map((item, index) => 
                        <Filter setParamsFilter={setParamsFilter} key={index} data={item} />
                    )}
                </div>
            </div>

            <div className="page__tables">
                <div className="page__panel">
                    <div className="filters"></div>
                </div>

                <div className="tables">
                    {/* Table header */}
                    <div className={"row row__title " + style.row}>
                        {nameColumns && nameColumns.map((item, index) => (
                            <div 
                                className={"col__title " + (item.stateSort === "asc" ? "desc" : "") + " " + (item.stateSort === "none" ? "" : "active")} 
                                key={index} 
                                onClick={() => clickColumn(index)}
                            >
                                {item.nameColumn}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M2 12V10.6667H6V12H2ZM2 8.66667V7.33333H10V8.66667H2ZM2 5.33333V4H14V5.33333H2Z" />
                                </svg>
                            </div>
                        ))}
                        <div className="col__title"></div>
                    </div>
                    
                    {/* Table content with scrolling */}
                    <div 
                        ref={tableWrapperRef} 
                        style={{ height: hasScroll ? '60vh' : 'auto', minHeight: '80%', paddingRight: "20px" }} 
                        className="tables__wrapper scroll__elem"
                    >
                        {/* Products list */}
                        {productsList && productsList.length > 0 && productsList.map((item, index) => (
                            <div 
                                className={"row " + style.row} 
                                onClick={() => clickRow(index, item)} 
                                key={item.id}
                                id={`product-${item.id}`}
                            >
                                <div className={"row__bg " + ((arrRowActive && arrRowActive[index]) ? "active" : "")}></div>
                                <TitleProduct 
                                    active={arrRowActive[index]} 
                                    categories={item.categories} 
                                    images={item.images} 
                                    title={item.title} 
                                />
                                <div className={"col " + style.col + " " + style.col__desc}>
                                    <ClampLines 
                                        text={item.description ? item.description.replace(/<\/?[a-zA-Z]+>/gi, '') : t.table.common.empty[language]} 
                                        lines={3} 
                                        ellipsis="" 
                                        id={"desc-" + item.id} 
                                        buttons={false} 
                                    />
                                </div>
                                <div className={"col " + style.col + " " + style.col__count}>
                                    {(+item.price.incl_tax).toFixed(2).toLocaleString() + " ₽"}
                                </div>
                                <div className={"col " + style.col}>
                                    <Link 
                                        to={`/products/${item.id}`} 
                                        className="btn btn__table"
                                        onClick={() => handleItemClick(item.id, 'product')}
                                    >
                                        {t.table.products.actions.goto[language]}
                                    </Link>
                                    <button 
                                        onClick={() => clickDel(item.id)} 
                                        className="btn btn__table btn__error"
                                    >
                                        {t.table.products.actions.delete[language]}
                                    </button>
                                </div>
                                <div className={"col " + style.col} >
                                    <button 
                                        onClick={(e) => toggleVisibility(e, item)}
                                        style={{
                                            backgroundColor: item.is_public ? '#4CAF50' : '#F44336',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            minWidth: '80px',
                                            transition: 'background-color 0.3s'
                                        }}
                                    >
                                        {item.is_public 
                                            ? t.table.products.productStates.visibility.active[language] 
                                            : t.table.products.productStates.visibility.hidden[language]}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Orders list */}
                        {orders && orders.length > 0 && orders.map((item, index) => (
                            <div 
                                className={"row " + style.row + (item.has_changed_login_data ? " " + style.changedDataRow : "")} 
                                onClick={() => clickRow(index, item)} 
                                key={item.id}
                            >
                                <div className={"row__bg " + ((arrRowActive && arrRowActive[index]) ? "active" : "")}></div>
                                <div className={"col " + style.col}>{item.number}</div>
                                <div className={"col " + style.col}>
                                    <span>{moment(item.date_placed).format("DD.MM.YYYY")}</span>
                                    <span>{moment(item.date_placed).format("HH:mm")}</span>
                                </div>
                                <div 
                                    className={"col " + style.col} 
                                    style={{ background: statusOrderColor[item.status.toUpperCase()] }}
                                >
                                    {translatedStatusOrder[item.status.toUpperCase()]}
                                </div>
                                <div className={"col " + style.col}>
                                    {item.user?.username || t.table.orders.notSpecified[language] || ""}
                                </div>
                                <div className={"col " + style.col}>{item.total_incl_tax + " ₽"}</div>
                                <div className={"col " + style.col}>
                                    <Link 
                                        to={`/orders/${item.id}`} 
                                        className="btn btn__table"
                                        onClick={() => handleItemClick(item.id, 'order')}
                                    >
                                        {t.table.products.actions.goto[language]}
                                    </Link>
                                </div>
                            </div>
                        ))}
                        
                        {/* Empty state message */}
                        {((products && products.length === 0) || (orders && orders.length === 0)) && (
                            <div className={styles.emptyState}>
                                {t.table.products.tableInterface.messages.noData[language]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// export default TablePage;
export default React.memo(TablePage);
