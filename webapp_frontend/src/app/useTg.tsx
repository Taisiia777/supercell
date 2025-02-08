'use client'

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ITelegramUser, IWebApp } from "@/types/types";

export interface ITelegramContext {
    webApp?: IWebApp;
    user?: ITelegramUser;
}

export const TelegramContext = createContext<ITelegramContext>({});

export const TelegramProvider = ({
                                     children,
                                 }: {
    children: React.ReactNode;
}) => {
    const [webApp, setWebApp] = useState<IWebApp | null>(null);

    useEffect(() => {
        const app = (window as any).Telegram?.WebApp;
        if (app) {
            app.ready();
            app.expand();
            app.enableClosingConfirmation()
            app.disableVerticalSwipes(); // Добавьте это
            setWebApp(app);
        }
          // Устанавливаем высоту для main
  const main = document.querySelector('main');
  if (main) {
    main.style.height = `${window.innerHeight}px`;
  }
    }, []);

    // useEffect(() => {
    //     const overflow = 100;
    //     document.body.style.overflowY = "hidden";
    //     document.body.style.marginTop = `${overflow}px`;
    //     document.body.style.height = window.innerHeight + overflow + "px";
    //     document.body.style.paddingBottom = `${overflow}px`;
    //     document.body.style.minHeight = "100vh";
    //     document.documentElement.style.overflow = "hidden";
    //     document.documentElement.style.height = "auto";
    
    //     window.scrollTo(0, overflow);
        
    //   }, []);
    useEffect(() => {
        const overflow = 100;
        let lastScrollPosition = overflow;
    
        const handleScroll = () => {
            lastScrollPosition = window.scrollY;
            if (lastScrollPosition < overflow) {
                window.scrollTo(0, overflow);
            }
        };
    
        document.body.style.overflowY = "hidden";
        document.body.style.marginTop = `${overflow}px`;
        document.body.style.height = window.innerHeight + overflow + "px";
        document.body.style.paddingBottom = `${overflow}px`;
        document.body.style.minHeight = "100vh";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.height = "auto";
    
        window.scrollTo(0, overflow);
        window.addEventListener('scroll', handleScroll);
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const value = useMemo(() => {
        return webApp
            ? {
                webApp,
                unsafeData: webApp.initDataUnsafe,
                user: webApp.initDataUnsafe.user
            }
            : {};
    }, [webApp]);

    return (
        <TelegramContext.Provider value={value}>
            {/* Make sure to include script tag with "beforeInteractive" strategy to pre-load web-app script */}
            {children}
        </TelegramContext.Provider>
    );
};

export const useTelegram = () => useContext(TelegramContext);