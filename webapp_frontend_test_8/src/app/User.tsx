'use client';

import { TelegramProvider, useTelegram } from "./useTg";

const Hustler = () => {
    const { user, webApp } = useTelegram();

    return (
        <>
            <h2>{user?.first_name} just better</h2>


        </>
    );
};
export default Hustler;