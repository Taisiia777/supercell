import { Link } from "react-router-dom"
import style from "./Error.module.css"
function ErrorPages() {


    return (
        <>
            <div className={style.errorPage}>
                <div className={style.errorWrapper}>
                    <h2>404</h2>
                    <Link to="/" >Вернуться на главную</Link>
                </div>

            </div>
        </>
    )
}

export default ErrorPages