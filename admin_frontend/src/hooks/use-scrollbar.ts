import { useEffect } from 'react';
import { OverlayScrollbars, ScrollbarsVisibilityBehavior, ScrollbarsAutoHideBehavior } from 'overlayscrollbars';

interface IScrollbar {
    visibility: ScrollbarsVisibilityBehavior,
    autoHide: ScrollbarsAutoHideBehavior
}
interface IOptions {
    scrollbars: IScrollbar
}


const config: IOptions = {

    scrollbars: {
        visibility: "auto",
        autoHide: "never",
    }
};
const useScrollbar = (root: HTMLDivElement | null, hasScroll: boolean | undefined) => {
    useEffect(() => {
        let scrollbars: OverlayScrollbars | undefined;

        if (root && hasScroll) {
            scrollbars = OverlayScrollbars(root, config);
        }

        return () => {
            if (scrollbars) {
                scrollbars.destroy();
            }
        }
    }, [root, hasScroll]);
};

export { useScrollbar };