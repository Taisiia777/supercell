/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { useNavigate } from "react-router-dom";

import "./Form.css"
import style from "./ProductForm.module.css"


import urlFileImg from "../../assets/images/default-create.png"
import urlIconGeneral from "../../assets/images/genetalIcon.svg"
import urlIconPhoto from "../../assets/images/photoIcon.svg"
import urlIconDesc from "../../assets/images/descIcon.svg"
import urlFileShowImg from "../../assets/images/default-show.png"
import { IProduct } from "../../models/type";

import { davDamerAPI } from "../../store/api/DavdamerAPI";
import Filter from "../Filter/Filter";

import ErrorPages from "../../pages/Error/ErrorPages";
import { useLanguage } from "../../context/LanguageContext";

interface IProps {
    edit: boolean,
    data?: IProduct
    id?: string | null,
    refBtn: any,
    funcRequest?: any,
    sendFormFilters: boolean
}



function ProductForm(props: IProps) {
    const { translations, language } = useLanguage();
    const t = translations.productForm; // для краткости
    const { edit, data, refBtn, funcRequest, sendFormFilters, id } = props;

    console.log(data);

    const [loginType, setLoginType] = useState(data?.login_type || 'LINK');

    const inputFiles = useRef<HTMLInputElement>(null);

    const [filesInfo, setFilesInfo] = useState<any[]>([]);

    const [uploadFiles, setUploadFiles] = useState<string[]>([]);
    const [errorFile, setErrorFile] = useState("");
    const [filtersType, setFiltersType] = useState(data?.filters_type || 'NEW_ACCOUNT');
    const [isPublic, setIsPublic] = useState(data?.is_public ?? false);




    useEffect(() => {
        if (data) {
          setLoginType(data.login_type);
        }
      }, [data]);
      useEffect(() => {
        if (data?.filters_type) {
            setFiltersType(data.filters_type);
        }
      }, [data]);
    const { register, handleSubmit, formState: { errors }, getValues, reset } = useForm<any>({
        defaultValues: {
            title: (data && data.title) ? data.title : edit ? "" : "Не заполнено",
            price: (data && data.price) ? data.price.old_price ? data.price.old_price : data.price.incl_tax : edit ? "" : "Не заполнено",
            old_price: (data && data.price.old_price) ? data.price.incl_tax : "",
            login_type: (data?.login_type === "EMAIL_CODE"),
            filters_type:(data?.filters_type === "NEW_ACCOUNT"),
            is_public: data?.is_public // Убираем значение по умолчанию здесь

        }
    })

    // Добавляем эффект для обновления значений формы при изменении data
    useEffect(() => {
        if (data) {
            reset({
                title: data.title,
                price: data.price.old_price ? data.price.old_price : data.price.incl_tax,
                old_price: data.price.old_price ? data.price.incl_tax : "",
                login_type: data.login_type,
                filters_type: data.filters_type,
                is_public: data.is_public // Здесь мы передаем значение напрямую, без значения по умолчанию
            });
            setLoginType(data.login_type);
            setFiltersType(data.filters_type);
            setIsPublic(data.is_public ?? false);
        }
    }, [data, reset]);


    const { data: categories, error: errorCategory, isLoading: isCategory } = davDamerAPI.useFetchGetCategoryQuery();

    const dataArea: any = {
        category: data ? data.sub_categories[0].full_name.toLocaleString() : "",
        price: (data?.price.incl_tax) ? data?.price.old_price ? data.price.old_price + " ₽" : data.price.incl_tax + " ₽" : "0,00 ₽",
        old_price: (data?.price.old_price) ? data.price.incl_tax + " ₽" : "0,00 ₽",
        desc: (data?.description) ? data.description : edit ? "" : "Не заполнено",
        measurement: (data?.price.measurement) ? data.price.measurement : edit ? "" : "Не заполнено",


    }

    const filterCategory = {
        title: dataArea.category ? dataArea.category : t.selectGame[language],
        nameFilter: "category",
        category: categories ? categories.map((item) => item.full_name) : [],
    }

    const filterMeasurement = {
        title: data?.price.measurement ? data.price.measurement : t.selectUnit[language],
        nameFilter: "measurement",
        measurement: ["1 шт."],
    }


    const [valuesFilter, setValuesFilter] = useState({
        category: dataArea.category ? dataArea.category : "",
        measurement: data?.price.measurement ? data.price.measurement : "",
    })



    const setParamsFilter = (key: string, value: string) => {
        const obj: any = Object.assign({}, valuesFilter)
        obj[key] = value ? value : dataArea[key];
        setValuesFilter(obj)
    }

    const [desc, setDesc] = useState((data && data.description) ? data.description.replace(/<\/?[a-zA-Z]+>/gi, '') : "");
    const changeDesc = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDesc(e.target.value);
    }



    const addFakeFiles = () => {
        if (!edit) return;
        if (inputFiles.current) inputFiles.current.click();
    }
    const filesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

        const target = e.target as HTMLInputElement;
        const files: FileList | null = (target.files);
        if (files) {
            if ((uploadFiles.length + files.length) > 4) {
                setErrorFile("Выберите не более 4х файлов");
                return
            }
            setErrorFile("");
            setFilesInfo([...filesInfo, ...files])
            const fileBase64Promises = Array.from(files).map((file) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                return new Promise((resolve, reject) => {
                    reader.onload = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = () => {
                        reject(reader.error);
                    };
                });
            });
            const fileBase64Arr: any[] = await Promise.all(fileBase64Promises);
            setUploadFiles([...uploadFiles, ...fileBase64Arr])

        }

    }
    const inputFile1 = useRef<HTMLInputElement>(null);
    const inputFile2 = useRef<HTMLInputElement>(null);
    const inputFile3 = useRef<HTMLInputElement>(null);
    const inputFile4 = useRef<HTMLInputElement>(null);
    const arrRefInput = [inputFile1, inputFile2, inputFile3, inputFile4]
    const addFakeFile = (index: number) => {
        if (!edit) return;
        const ref = arrRefInput[index]

        if (ref.current) ref.current.click();

    }
    const [arrIdImg, setArrIdImg] = useState<Set<number>>(new Set())
    const fileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const target = e.target as HTMLInputElement;
        const files = (target.files) ? target.files[0] : "";
        const idImg = target.getAttribute("data-id");
        if (files) {
            if (!/\.(jpe?g|png|gif)$/i.test(files.name)) {
                setErrorFile("Неверный формат");
                return
            }
            setErrorFile("");
            setFilesInfo(filesInfo.map((item, i) => {
                if (i === index) return files as any
                return item
            }))
            const reader = new FileReader();
            reader.addEventListener("load", function () {

                setUploadFiles(uploadFiles.map((item, i) => {
                    if (i === index) return this.result as any
                    return item
                }))
            });

            reader.readAsDataURL(files);
        }
        if (idImg) {
            setArrIdImg(arrIdImg.add(+idImg))
        }

    }
    const closeFile = (e: React.MouseEvent<HTMLSpanElement>, index: number) => {
        e.stopPropagation()
        const target = e.target as HTMLElement;
        const idImg = target.getAttribute("data-id");
        if (idImg) {
            setArrIdImg(arrIdImg.add(+idImg))
        }

        setUploadFiles(uploadFiles.filter((_, i) => i !== index))
        setFilesInfo(filesInfo.filter((_, i) => i !== index))

    }
    useEffect(() => {
        if (data && data.images.length !== 0) {
            setUploadFiles(data.images.map((item) => item.original))
            setFilesInfo(data.images.map(() => undefined))
        }
    }, [data])



    const navigate = useNavigate();


    const onSubmit: SubmitHandler<any> = async (dataParam) => {
        if (errorFile) return
        if (!valuesFilter.category || !valuesFilter.measurement) return
    
        const formData = new FormData();
    
        // Добавляем файлы если есть
        if (filesInfo) {
            filesInfo.filter((i) => i).forEach((item) => {
                formData.append("uploaded_images", item);
            })
        }
    
        // Добавляем описание если есть
        if (desc) formData.append("description", desc);
    
        // Добавляем все основные поля
        formData.append("title", dataParam.title);
        formData.append("price", dataParam.price);
        formData.append("login_type", loginType);
        formData.append("filters_type", filtersType);
        formData.append("is_public", isPublic.toString());

        // Добавляем old_price если есть
        if (dataParam.old_price) {
            formData.append("old_price", dataParam.old_price);
            
            // Меняем местами цены если нужно
            const price = formData.get("price");
            const newPrice = formData.get("old_price");
            formData.set("old_price", price as any);
            formData.set("price", newPrice as any);
        }
    
        // Добавляем категории и единицы измерения
        formData.append("categories", [`${valuesFilter.category}`] as any);
        formData.append("measurement", valuesFilter.measurement as any);
    
        // Обработка изображений при редактировании
        if (id) {
            const arrDeleImg = Array.from(arrIdImg);
            try {
                if (funcRequest && data) {
                    formData.append("deleted_images", JSON.stringify(arrDeleImg));
                    const dataRequest = await funcRequest({ id: data.id, body: formData });
                    if (dataRequest.error) return
                    navigate(`/products`);
                }
            } catch {
                navigate(`/404`);
            }
        } else {
            try {
                if (funcRequest) {
                    const data = await funcRequest({ body: formData });
                    if (data.error) return
                    navigate(`/products`);
                }
            } catch {
                navigate(`/404`);
            }
        }
    
        // Логируем содержимое FormData
        console.log("FormData entries:");
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
    }
   
    if (errorCategory) return <ErrorPages></ErrorPages>

    if (isCategory) return <h2>Загрузка данных</h2>

    return (
        <>
            <form className={'form ' + (edit ? "" : "show") + " " + style.form} encType="multipart/form-data" onSubmit={handleSubmit(onSubmit)}>
                <div className={"form__head " + style.form__head}>
                    {data && !edit && <div className="form__file">
                        <div className="form__addFile">
                            <img src={(data.images.length > 0 && data.images[0].original) ? data.images[0].original : urlFileShowImg} alt="addFile" />
                            {errorFile && <span className="form__error">{errorFile}</span>}
                        </div>

                    </div>
                    }

                <label className="form__name form__label">
                    {edit && <span>{t.name[language]}</span>}
                    <input 
                        placeholder={t.namePlaceholder[language]} 
                        type="text"  
                        {...register("title", { 
                            validate: (value) => ((value.length > 2) && (value.length < 30)), 
                            disabled: edit ? false : true 
                        })} 
                    />
                    {errors.title && <span className="form__error">{t.errors.titleLength[language]}</span>}
                </label>
                </div>
                <div className={style.form__general}>

                <h3 className="form__title">
                    <img src={urlIconGeneral} alt="desc" />
                    {t.general[language]}
                </h3>
                
                <div className={"form__label" + " " + (valuesFilter.category ? "value" : "")}>
                    <span>{t.gameName[language]}</span>
                    {!edit && data && <span className={style.spanName}>{dataArea.category}</span>}
                    {edit && <Filter data={filterCategory as any} setParamsFilter={setParamsFilter} />}
                    {sendFormFilters && edit && !valuesFilter.category && 
                        <span className="form__error">{t.errors.selectGameRequired[language]}</span>
                    }
                </div>

                    <div className={"form__label " + style.form__price}>
                        {/* <span>Стоимость</span> */}
                        <span>{t.price[language]}</span>

                        {!edit && data && <span className={style.spanName + " "}>{dataArea.price}</span>}
                        {edit && <input placeholder="0.00 ₽" type="number"  {...register("price", {
                            validate: (value) => ((value > 10) && ((value <= 100000))), disabled: edit ? false : true
                        }
                        )} />}
                        {errors.price && <span className="form__error">Введите стоимость от 10 ₽ до 100 000 ₽ </span>}
                    </div>
                    {(edit || (data?.price.old_price)) && <div className={"form__label " + style.form__price}>
                        {/* <span>Акционная цена</span> */}
                        <span>{t.promoPrice[language]}</span>

                        {!edit && data && <span className={style.spanName + " "}>{dataArea.old_price}</span>}
                        {edit && <input placeholder="0.00 ₽" type="number"  {...register("old_price", {

                            validate: { count: (value) => (!value || (value > 10) && ((value <= 100000))), checkPrice: (value) => (value < +getValues("price")) }, disabled: edit ? false : true
                        }
                        )} />}

                        {errors.old_price && errors.old_price.type === "count" && <span className="form__error">Акционная цена должна быть от 10 ₽ до 100 000 ₽ </span>}
                        {errors.old_price && errors.old_price.type === "checkPrice" && <span className="form__error">Акционная цена должна быть ниже стоимости товара </span>}
                    </div>}
                    <div className={"form__label" + " " + (valuesFilter.measurement ? "value" : "")}>
                        {/* <span>Единица измерения</span> */}
                        <span>{t.unit[language]}</span>

                        {!edit && data && <span className={style.spanName}>{dataArea.measurement}</span>}
                        {edit && <Filter data={filterMeasurement as any} setParamsFilter={setParamsFilter}></Filter>}

                        {sendFormFilters && edit && !valuesFilter.measurement && <span className="form__error">Выберите единицу измерения</span>}
                    </div>

                        <div className="form__label">
                        <span>Тип входа</span>
                        <div className={style.form__check}>
                            <label className="label__check">
                            <input 
                                type="radio" 
                                {...register("login_type")} 
                                value="LINK"
                                checked={loginType === "LINK"}
                                onChange={(e) => setLoginType(e.target.value)}
                                disabled={!edit}
                            />
                            <span>{t.withoutLogin[language]}</span>
                            </label>

                            <label className="label__check">
                            <input 
                                type="radio"
                                {...register("login_type")}
                                value="EMAIL_CODE" 
                                checked={loginType === "EMAIL_CODE"}
                                onChange={(e) => setLoginType(e.target.value)}
                                disabled={!edit}
                            />
                            <span>{t.withLogin[language]}</span>
                            </label>

                            <label className="label__check">
                            <input 
                                type="radio"
                                {...register("login_type")}
                                value="URL_EMAIL"
                                checked={loginType === "URL_EMAIL"}
                                onChange={(e) => setLoginType(e.target.value)}
                                disabled={!edit} 
                            />
                            <span>{t.withlinkLogin[language]}</span>
                            </label>
                        </div>
                        </div>
                        <div className="form__label">
                        <span>Фильтры</span>
                        <div className={style.form__check}>
                            <label className="label__check">
                                <input 
                                    type="radio"
                                    {...register("filters_type")} 
                                    value="PASS"
                                    checked={filtersType === "PASS"}
                                    onChange={(e) => setFiltersType(e.target.value)}
                                    disabled={!edit}
                                />
                                <span>Пропуски</span>
                            </label>

                            <label className="label__check">
                            <input 
                                type="radio"
                                {...register("filters_type")} 
                                value="PROMO"
                                checked={filtersType === "PROMO"}
                                onChange={(e) => setFiltersType(e.target.value)}
                                disabled={!edit}
                            />
                            <span>Промо</span>
                            </label>

                            <label className="label__check">
                            <input 
                                type="radio"
                                {...register("filters_type")} 
                                value="GEMS"
                                checked={filtersType === "GEMS"}
                                onChange={(e) => setFiltersType(e.target.value)}
                                disabled={!edit}
                            />
                            <span>Гемы</span>
                            </label>
                            <label className="label__check">
                            <input 
                                type="radio"
                                {...register("filters_type")} 
                                value="NEW_ACCOUNT"
                                checked={filtersType === "NEW_ACCOUNT"}
                                // onChange={(e) => setFiltersType(e.target.value)}
                                onChange={(e) => {
                                    console.log("Changed filters_type to:", e.target.value); // Добавляем лог
                                    setFiltersType(e.target.value);
                                }}
                                disabled={!edit}
                            />
                            <span>Новый аккаунт</span>
                            </label>
                        </div>
                        </div>
                        <div className="form__label">
                        <span>Видимость товара</span>
                        <div className={style.form__check}>
                            <label className="label__check">
                            <input 
                                type="checkbox"
                                {...register("is_public")}
                                checked={isPublic}
                                // onChange={(e) => setIsPublic(e.target.checked)}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    setIsPublic(newValue);
                                    console.log("is_public changed to:", newValue); // For debugging
                                }}
                                disabled={!edit}
                            />
                            <span>Показывать товар в каталоге</span>
                            </label>
                        </div>
                        </div>

                </div>


                <div className={style.form__files}>
                    <h3 className="form__title"> <img src={urlIconPhoto} alt="photoIcon" />
                    {t.photos[language]}

                    {/* Фото товара */}
                    </h3>
                    <div className={style.form__addFile}>
                        <div className={"form__file " + style.form__fileImg}>
                            {uploadFiles.map((item, index) => {
                                return <div key={index} onClick={() => addFakeFile(index)} className={"form__addFile " + style.file}>
                                    <div className={style.wrapImg}>
                                        <img src={item} alt="" />
                                    </div>

                                    {edit && <span className="file__close" data-id={data?.images[index] ? data.images[index].id : ""} onClick={(e) => closeFile(e, index)}>X</span>}
                                    <input accept="image/png, image/jpeg" type="file" id="file" data-id={data?.images[index] ? data.images[index].id : ""} ref={arrRefInput[index]} onChange={(e) => fileChange(e, index)} />
                                </div>
                            })}
                            {(uploadFiles.length < 4) && edit &&
                                <div onClick={addFakeFiles} className={"form__addFile " + style.file}>
                                    <div className={style.wrapImg}>
                                        <img src={urlFileImg} alt="addFile" /></div>
                                    {errorFile && <span className="form__error">{errorFile}</span>}
                                    <input accept="image/png, image/jpeg" type="file" multiple id="files" ref={inputFiles} onChange={filesChange} />
                                </div>



                            }
                        </div>
                        <input type="submit" value="Отправить" className="form__submit" ref={refBtn} />

                    </div>

                </div>
                <div className={"form__desc " + style.form__desc}>
                    <h3 className="form__title"> <img src={urlIconDesc} alt="desc" />
                    {t.description[language]}
                    </h3>
                    <div className="form__textarea">
                        <label className="form__label">
                            {/* <span>Общее описание товара</span> */}
                            <span>{t.productDescription[language]}</span>

                            {edit && <textarea name="description" onChange={changeDesc} id="" cols={30} rows={3} value={desc}></textarea>}
                            {!edit && <textarea disabled name="description" 
                            // value={desc ? desc : "Не заполнено"} 
                            value={desc ? desc : t.notFilled[language]} 
                            onChange={changeDesc} id="" cols={30} rows={3}></textarea>}
                        </label>
                    </div>

                </div>

            </form>
        </>
    )
}

export default ProductForm