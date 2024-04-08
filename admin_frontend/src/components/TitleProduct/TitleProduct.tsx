import ClampLines from "react-clamp-lines";
import { useNavigate } from "react-router-dom";
import style from "./TitleProducts.module.css"
import urlDefaultProduct from "../../assets/images/default-product.png"


interface IProps {
    id?: number
    images: {
        id: number,
        original: string
    }[],
    className?: string,
    active: boolean,
    categories: string[],
    title: string,
}

function TitleProduct(props: IProps) {
    const { images, active, categories, title, id, className } = props;

    const navigate = useNavigate()
    const clickProduct = () => {
        if (id) {
            navigate(`products/${id}`)
        }
    }
    return (
        <div onClick={clickProduct} className={"col " + className + " " + style.col + " " + (images.length === 0 ? style.default : (images.length > 1 && active) ? style.active : "")}>
            <div className={style.col__images}>
                <img src={images.length > 0 ? images[0].original : urlDefaultProduct} alt="img" />
                {images.length > 1 && <div className={style.count_img}><span>+{images.length - 1}</span></div>}
            </div>
            <div className={style.titles}>
                <ClampLines text={title} lines={2} className={style.title} ellipsis="" id="custom" buttons={false} />
                <p className={style.category}>{categories.length === 0 ? "Без категории" : categories.join(" ")}</p>
            </div>
        </div>
    );
}

export default TitleProduct;