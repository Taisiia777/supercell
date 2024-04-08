import "./PagesHead.css"
import urlPhoto from "../../assets/images/test-davdamer.png";
interface IProps {
    title: string;
}
function Pages(props: IProps) {

    const { title } = props;

    return (
        <>
            <div className="page">
                <div className="page__head">
                    <h2 className="page__title">{title}</h2>
                    <div className="page__name">
                        <div className="page__info">
                            <span>Констанипольский</span>
                            <span>Богдан Иванович</span>
                        </div>
                        <div className="page__img">
                            <img src={urlPhoto} alt="photo" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Pages