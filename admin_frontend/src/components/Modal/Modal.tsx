import style from "./Modal.module.css"

interface IProps {
    id?: number;
    closeModal: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    funcRequest?: any;
    text: string
}
function Modal(props: IProps) {
    const { id, closeModal, funcRequest, text } = props;

    const clickDelete = () => {
        if (id && funcRequest) funcRequest({ id });
        closeModal();
    }


    return (
        <div className={style.modal}>
            <div className={style.modal__wrapper}>
                <p className={style.text}>{text}</p>
                {id && funcRequest && <div className={style.btns}>
                    <button onClick={clickDelete} className="btn__head btn__active btn__error">Да</button>
                    <button onClick={closeModal} className="btn__head btn__cancel">Отмена</button>
                </div>}
                {!id && !funcRequest && <div className={style.btns}>
                    <button onClick={closeModal} className="btn__head btn__active">ОК</button></div>}
            </div>

        </div>
    );
}

export default Modal;