// import { combineReducers, configureStore } from '@reduxjs/toolkit';
// import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// import { davDamerAPI } from './api/DavdamerAPI';



// const rootReducer = combineReducers({
//     [davDamerAPI.reducerPath]: davDamerAPI.reducer
// });

// export const setupStore = () => {
//     return configureStore({
//         reducer: rootReducer,
//         middleware: (getDefaultMiddleware) =>
//             getDefaultMiddleware()
//                 .concat(davDamerAPI.middleware)
//     });
// };

// export type RootState = ReturnType<typeof rootReducer>;
// export type AppStore = ReturnType<typeof setupStore>;
// export type AppDispatch = AppStore['dispatch'];


// export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { davDamerAPI } from './api/DavdamerAPI';
import { authApi } from './api/authApi';
import authReducer from './authSlice';

const rootReducer = combineReducers({
    [davDamerAPI.reducerPath]: davDamerAPI.reducer,
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer
});

export const setupStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(davDamerAPI.middleware)
                .concat(authApi.middleware)
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;