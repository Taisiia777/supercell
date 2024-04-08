import {getProfile} from "@/actions/getProfile";
import Header from "@/components/header/header";
import GoBack from "@/components/back/back";
import Profile from "@/components/profile/profile";
import Button3D from "@/components/ui/button-3d/button-3d";
import {useEffect, useState} from "react";

export default function ProfilePage() {
//    const { webApp } = useTelegram();


    return (
        <>
            <Header component={
                <Button3D name="Мои заказы" href="/order"/>
            }/>
            <GoBack/>
            {/*<Profile data={profile}/>*/}
            <Profile/>
        </>
    )
}