//@ts-nocheck
import styles from "./input.module.scss"
import {forwardRef, useEffect, useRef, useState} from "react";
import Button3D from "@/components/ui/button-3d/button-3d";
import {setIn} from "immutable";

interface InputInterface {
    title?: string
    icon?: any
    value?: string | number
    placeholder?: string
    copy?: boolean
    name?: string
    required?: boolean
    productId?: number
    handleEnd?: (data: { productId: number | undefined; type: string | undefined; error: string; value: string }) => void
    type_action?: "request_code" | "default"
    error?: boolean
    rest?: any
    requestClick?: () => void
    edit?: boolean
    style?: any
    handleEdit?: (value: string | number, type: string | undefined, line_id: number | undefined) => void
    rotate?: boolean
    input_type?: "number" | "text"
    validation?: "code"
    background?: boolean
}

const Input = forwardRef((props: InputInterface, ref) => {

    const [inputValue, setInputValue] = useState(props.value ?? '');
    const [initialValue, setInitialValue] = useState(props.value ?? '');
    const inputRef = useRef(null); // Реф для поля ввода
    const [validationError, setValidationError] = useState(''); // Состояние для хранения сообщения об ошибке валидации
    const [shouldFocus, setShouldFocus] = useState(false);

    const handleChange = (e: any) => {
        const value = e.target.value;
        console.log(value)
        setInputValue(value)

        // Проверяем валидацию, если она указана и если значение изменилось
        if (props.validation && value !== initialValue) {
            validateInput(value);
        }
    }

    const validateInput = (value) => {
        // Проверяем валидацию для кода (6 цифр)
        if (props.validation === "code") {
            const codeRegex = /^\d{6}$/;
            if (!codeRegex.test(value)) {
                setValidationError('Введите 6 цифр');
            } else {
                setValidationError('');
            }
        }
    };

    const {...rest} = props

    const [editing, setEditing] = useState(false); // Состояние для отслеживания режима редактирования
    const [hasChanges, setHasChanges] = useState(false); // Состояние для отслеживания наличия изменений

    useEffect(() => {
        setInitialValue(props.value ?? '');
    }, [props.value]); // Обновляем исходное значение при изменении props.value

    useEffect(() => {
        // Проверяем, были ли внесены изменения при изменении значения в поле ввода
        if (inputValue !== initialValue) {
            setHasChanges(true);
        } else {
            setHasChanges(false);
        }
    }, [inputValue, initialValue]);

    const handleEditClick = () => {
        if (!editing) {
            // Если не в режиме редактирования, включаем его
            setEditing(true);
            setShouldFocus(true)
            // document.body.dispatchEvent(new Event('touchstart', { bubbles: true }));
            // inputRef.current.blur();
            // inputRef.current.focus();
        } else {
            // Если в режиме редактирования, сохраняем изменения, если они есть, и выключаем режим редактирования
            if (hasChanges) {

                if (validationError) {
                    // Если есть ошибка валидации, не сохраняем изменения
                    return;
                }

                if(props.handleEdit) {
                    props.handleEdit(inputValue, props.name, props.productId);
                    setHasChanges(false);
                }
            }
            setEditing(false);
        }
    };

    useEffect(() => {
        if (inputRef.current && shouldFocus) {
            setTimeout(() => {
                inputRef.current.blur();
                inputRef.current.focus();
                setShouldFocus(false);
            }, 150);
        }
    }, [shouldFocus]);

    const [buttonText, setButtonText] = useState("Отправить еще раз");

    const handleClickRequest = () => {
        if (props.type_action === "request_code") {
            setButtonText("Отправлено");
            setTimeout(() => {
                setButtonText("Отправить еще раз");
            }, 5000); // 5000 миллисекунд = 5 секунд
            props.requestClick && props.requestClick();
        }
    };

    return (
        <div className={styles.input_container}>
            <label className={styles.title} style={props.rotate ? {flexDirection: "row"} : {}}>
                {props.title && !props.rotate ? (
                    <div className={styles.title_container}>
                        <div className={styles.name}>
                            <span>{props.title}</span>
                            {props.icon && <>{props.icon}</>}
                        </div>
                        <div className={styles.request}>
                            {props.type_action === "request_code" && <span onClick={handleClickRequest}>{buttonText}</span>}
                        </div>
                    </div>
                ) : (
                    <div className={styles.title_container}>
                        <div className={styles.name}>
                            {props.icon && <>{props.icon}</>}
                        </div>
                    </div>
                )}
                <div className={styles.el}>
                    <div className={styles.input_content}>
                        {!props.copy && props.edit ? (
                            <>
                                <input
                                    ref={inputRef}
                                    type={props.input_type ?? "text"}
                                    placeholder={props.placeholder}
                                    className={styles.input}
                                    value={inputValue}
                                    onChange={(e) => handleChange(e)}
                                    readOnly={!editing}
                                    autoFocus={true}
                                    style={editing ? { boxShadow: "#191e29 4px 10px 30px 0 inset" } : {boxShadow: "none", border: "1px solid #191e29"}}
                                />
                                <div className={styles.edit} onClick={handleEditClick}>
                                    <div className={styles.btn}>
                                        <button type="button">{editing ? (hasChanges ? "Сохранить" : "Отмена") : "Изменить"}</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <input
                                type={props.input_type ?? "text"}
                                placeholder={props.placeholder}
                                className={styles.input}
                                ref={ref}
                                {...rest}
                                style={props.background ? {boxShadow: "none", border: "1px solid #191e29"} : {boxShadow: "#191e29 4px 10px 30px 0 inset"}}
                            />
                            )}
                    </div>

                    {props.copy && (
                        <div className={styles.copy} onClick={() => navigator.clipboard.writeText(String(props.value))}>
                            <svg width="31" height="28" viewBox="0 0 31 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.6666 9.66667V5.62251C10.6666 4.00457 10.6666 3.19501 11.0178 2.57704C11.3267 2.03346 11.8192 1.59183 12.4256 1.31487C13.1148 1 14.0178 1 15.8224 1H24.8445C26.6491 1 27.551 1 28.2402 1.31487C28.8465 1.59183 29.3399 2.03346 29.6488 2.57704C30 3.19501 30 4.00397 30 5.6219V13.7108C30 15.3287 30 16.1378 29.6488 16.7557C29.3399 17.2993 28.846 17.7418 28.2397 18.0187C27.5511 18.3333 26.6502 18.3333 24.8492 18.3333H20.3331M10.6666 9.66667H6.15582C4.35122 9.66667 3.44825 9.66667 2.75899 9.98154C2.15269 10.2585 1.66011 10.7001 1.3512 11.2437C1 11.8616 1 12.6713 1 14.2892V22.3781C1 23.996 1 24.8046 1.3512 25.4225C1.66011 25.9661 2.15269 26.4085 2.75899 26.6854C3.44757 27 4.34945 27 6.15052 27H15.1834C16.9845 27 17.8851 27 18.5736 26.6854C19.1799 26.4085 19.6734 25.9656 19.9822 25.4221C20.3331 24.8047 20.3331 23.997 20.3331 22.3823V18.3333M10.6666 9.66667H15.1779C16.9825 9.66667 17.8844 9.66667 18.5736 9.98154C19.1799 10.2585 19.6734 10.7001 19.9822 11.2437C20.3331 11.8611 20.3331 12.6697 20.3331 14.2844V18.3333" stroke="#999999" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}


                </div>
                {validationError && <p className={styles.error_code}>{validationError}</p>}
            </label>
        </div>
    )
})

export default Input
