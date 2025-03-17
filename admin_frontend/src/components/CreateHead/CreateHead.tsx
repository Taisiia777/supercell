import "./CreateHead.css"

import { Link, useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

interface IProps {
    title: string;
    namePage: string;
    nameFunc: string;
    saveFunc?: () => void;
    redirect: boolean;
}
function CreateHead(props: IProps) {
    const { translations, language } = useLanguage();
    const { id } = useParams();
    const { namePage, nameFunc, saveFunc, redirect } = props;
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
                    <h2 className="page__title">
                        {/* Используем соответствующий перевод для заголовка */}
                        {translations[namePage === 'products' ? 'productCard' : 'orderCard'][language]}
                    </h2>
                    <div className="page__btns head__btns">
                        <Link to={`/${namePage}`} className="btn__cancel btn__head">
                            {translations.cancel[language]}
                        </Link>
                        {nameFunc === "show" && (
                            <Link to={`/${namePage}/edit/${id}`} className="btn__active btn__head">
                                {translations.edit[language]}
                            </Link>
                        )}
                        {nameFunc === "save" && (
                            <button className="btn__active btn__head" onClick={saveClick}>
                                {translations.save[language]}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default CreateHead