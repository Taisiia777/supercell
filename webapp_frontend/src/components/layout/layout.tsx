import {ReactNode} from "react";

interface ILayout {
    children: ReactNode
}

function Layout(props: ILayout) {
    return (
        <>
            {props.children}
        </>
    )
}

export default Layout