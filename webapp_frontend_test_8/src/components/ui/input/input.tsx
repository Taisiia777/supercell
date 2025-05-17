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
    // validation?: "code"
    background?: boolean
    editable?: boolean;
    clearable?: boolean;
    onClear?: () => void;
    onUpdate?: (value: string) => void;
    validation?: "email" | "code";

}


const Input = forwardRef((props: InputInterface, ref) => {
    const [inputValue, setInputValue] = useState(props.value ?? '');
    const [initialValue, setInitialValue] = useState(props.value ?? '');
    const inputRef = useRef(null);
    const [validationError, setValidationError] = useState('');
    const [shouldFocus, setShouldFocus] = useState(false);
    const [editing, setEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [buttonText, setButtonText] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setInputValue(props.value ?? '');
        setInitialValue(props.value ?? '');
    }, [props.value]);

    // const validateInput = (value) => {
    //     if (props.validation === "email") {
    //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //         if (!emailRegex.test(value) && value) {
    //             setValidationError('Введите корректный email');
    //             return false;
    //         }
    //     } else if (props.validation === "code") {
    //         const codeRegex = /^\d{6}$/;
    //         if (!codeRegex.test(value)) {
    //             setValidationError('Введите 6 цифр');
    //             return false;
    //         }
    //     }
    //     setValidationError('');
    //     return true;
    // };
    const validateInput = (value) => {
        if (props.validation === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value) && value) {
                setValidationError('Введите корректный email');
                return false;
            }
        } else if (props.validation === "code") {
            const codeRegex = /^\d{6}$/;
            if (!codeRegex.test(value)) {
                setValidationError('Введите 6 цифр');
                return false;
            }
        } else if (props.validation === "friendUrl") {
                // Валидация ссылки в друзья 
                const url = value.toLowerCase();
                const friendUrlRegex = /^https:\/\/link\.(clashroyale|brawlstars|clashofclans)\.com\/.*((supercell_id)|(action=OpenSCID))/;

                if (!friendUrlRegex.test(url)) {
                    setValidationError('Некорректная ссылка для добавления в друзья');
                    return false;
                }

                // Дополнительная проверка наличия уникального идентификатора
                const uniqueIdRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
                if (!uniqueIdRegex.test(url)) {
                    setValidationError('Ссылка должна содержать уникальный идентификатор');
                    return false;
                }
        }
        setValidationError('');
        return true;
    };
    const handleChange = (e: any) => {
        const value = e.target.value;
        setInputValue(value);

        // Валидация
        if (props.validation) {
            validateInput(value);
        }

        // Важно: передаем событие в React Hook Form
        if (props.onChange) {
            props.onChange(e);
        }

        setHasChanges(value !== initialValue);
    };


    const handleCopy = async () => {
        if (props.value) {
          try {
            await navigator.clipboard.writeText(String(props.value));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          } catch (err) {
            console.error('Не удалось скопировать текст:', err);
          }
        }
      };


    const handleEditClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!editing) {
            setEditing(true);
            setShouldFocus(true);
        } else {
            if (hasChanges && !validationError && !props.error) {
                if (props.onUpdate) {
                    const success = await props.onUpdate(inputValue);
                    if (success) {
                        setInitialValue(inputValue);
                        setHasChanges(false);
                    }
                }
                if (props.handleEdit) {
                    props.handleEdit(inputValue, props.name, props.productId);
                }
            }
            setEditing(false);
        }
    };

    const handleClickRequest = () => {
        // if (props.type_action === "request_code") {
        //     setButtonText("Отправлено");
        //     setTimeout(() => {
        //         setButtonText("Отправить еще раз");
        //     }, 5000);
        //     props.requestClick && props.requestClick();
        // }
    };

    const isReadOnly = props.editable ? !editing : false;

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
                            {props.type_action === "request_code" && 
                                <span onClick={handleClickRequest}>{buttonText}</span>
                            }
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
                        <input
                            {...props.rest}
                            ref={ref}
                            type={props.input_type ?? "text"}
                            placeholder={props.placeholder}
                            className={styles.input}
                            name={props.name}
                            value={props.editable ? inputValue : props.value}
                            onChange={handleChange}
                            readOnly={isReadOnly}
                            style={{
                                boxShadow: props.error || validationError ? 
                                    "inset 4px 10px 30px 0 rgba(255, 0, 0, 0.3)" : 
                                    (editing ? "#191e29 4px 10px 30px 0 inset" : 
                                    (props.background ? "none" : "#191e29 4px 10px 30px 0 inset")),
                                border: !editing && props.background ? "1px solid #191e29" : "none",
                                ...props.style
                            }}
                        />
                        {(props.error || validationError) && (
                            <p className={styles.error_message}>
                                {props.error || validationError}
                            </p>
                        )}

                        <div className={styles.buttons}>
                            {props.editable && (
                                <button 
                                    className={`${styles.edit} ${editing ? styles.save : ''}`}
                                    onClick={handleEditClick}
                                    disabled={validationError}
                                    style={validationError ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                    {editing ? (
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 14L8.23309 16.4248C8.66178 16.7463 9.26772 16.6728 9.60705 16.2581L18 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    ) : (
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z" fill="#fff"/>
                                        </svg>
                                    )}
                                </button>
                            )}
                            {props.clearable && inputValue && (
                                <button 
                                    className={styles.clear}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (props.onClear) {
                                            props.onClear();
                                        }
                                    }}
                                >
                                    <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* {props.copy && (
                        <div className={styles.copy} onClick={() => navigator.clipboard.writeText(String(props.value))}>
                            <svg width="31" height="28" viewBox="0 0 31 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.6666 9.66667V5.62251C10.6666 4.00457 10.6666 3.19501 11.0178 2.57704C11.3267 2.03346 11.8192 1.59183 12.4256 1.31487C13.1148 1 14.0178 1 15.8224 1H24.8445C26.6491 1 27.551 1 28.2402 1.31487C28.8465 1.59183 29.3399 2.03346 29.6488 2.57704C30 3.19501 30 4.00397 30 5.6219V13.7108C30 15.3287 30 16.1378 29.6488 16.7557C29.3399 17.2993 28.846 17.7418 28.2397 18.0187C27.5511 18.3333 26.6502 18.3333 24.8492 18.3333H20.3331M10.6666 9.66667H6.15582C4.35122 9.66667 3.44825 9.66667 2.75899 9.98154C2.15269 10.2585 1.66011 10.7001 1.3512 11.2437C1 11.8616 1 12.6713 1 14.2892V22.3781C1 23.996 1 24.8046 1.3512 25.4225C1.66011 25.9661 2.15269 26.4085 2.75899 26.6854C3.44757 27 4.34945 27 6.15052 27H15.1834C16.9845 27 17.8851 27 18.5736 26.6854C19.1799 26.4085 19.6734 25.9656 19.9822 25.4221C20.3331 24.8047 20.3331 23.997 20.3331 22.3823V18.3333M10.6666 9.66667H15.1779C16.9825 9.66667 17.8844 9.66667 18.5736 9.98154C19.1799 10.2585 19.6734 10.7001 19.9822 11.2437C20.3331 11.8611 20.3331 12.6697 20.3331 14.2844V18.3333" stroke="#999999" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )} */}
                    {props.copy && (
                        <div className={styles.copy} onClick={handleCopy}>
                            {isCopied ? (
                            <div className={styles.copied_indicator}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17l-5-5" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Скопировано!</span>
                            </div>
                            ) : (
                            <svg width="31" height="28" viewBox="0 0 31 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.6666 9.66667V5.62251C10.6666 4.00457 10.6666 3.19501 11.0178 2.57704C11.3267 2.03346 11.8192 1.59183 12.4256 1.31487C13.1148 1 14.0178 1 15.8224 1H24.8445C26.6491 1 27.551 1 28.2402 1.31487C28.8465 1.59183 29.3399 2.03346 29.6488 2.57704C30 3.19501 30 4.00397 30 5.6219V13.7108C30 15.3287 30 16.1378 29.6488 16.7557C29.3399 17.2993 28.846 17.7418 28.2397 18.0187C27.5511 18.3333 26.6502 18.3333 24.8492 18.3333H20.3331M10.6666 9.66667H6.15582C4.35122 9.66667 3.44825 9.66667 2.75899 9.98154C2.15269 10.2585 1.66011 10.7001 1.3512 11.2437C1 11.8616 1 12.6713 1 14.2892V22.3781C1 23.996 1 24.8046 1.3512 25.4225C1.66011 25.9661 2.15269 26.4085 2.75899 26.6854C3.44757 27 4.34945 27 6.15052 27H15.1834C16.9845 27 17.8851 27 18.5736 26.6854C19.1799 26.4085 19.6734 25.9656 19.9822 25.4221C20.3331 24.8047 20.3331 23.997 20.3331 22.3823V18.3333M10.6666 9.66667H15.1779C16.9825 9.66667 17.8844 9.66667 18.5736 9.98154C19.1799 10.2585 19.6734 10.7001 19.9822 11.2437C20.3331 11.8611 20.3331 12.6697 20.3331 14.2844V18.3333" stroke="#999999" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            )}
                        </div>
                        )}
                </div>
            </label>
        </div>
    );
});

export default Input;