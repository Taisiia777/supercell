import "./CreateHead.css"

import { Link, useParams, useNavigate } from "react-router-dom";

interface IProps {
    title: string;
    namePage: string;
    nameFunc: string;
    saveFunc?: () => void;
    redirect: boolean;
}
function CreateHead(props: IProps) {
    const { id } = useParams();
    const { title, namePage, nameFunc, saveFunc, redirect } = props;
    const navigate = useNavigate();
    const saveClick = () => {
        if (saveFunc) {
            saveFunc();
        }

        if (redirect) navigate(`/${namePage}`)

    }

    return (
        <>
            <div className="page">
                <div className="page__head">
                    <h2 className="page__title">{title}</h2>
                    <div className="page__btns head__btns">
                        <Link to={`/${namePage}`} className="btn__cancel btn__head">Отмена</Link>
                        {nameFunc === "show" && <Link to={`/${namePage}/edit/${id}`} className="btn__active btn__head">Редактировать</Link>}
                        {nameFunc === "save" && <button className="btn__active btn__head" onClick={saveClick}>Сохранить</button>}
                    </div>
                </div>
            </div>
        </>
    )
}

export default CreateHead