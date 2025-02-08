
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import OrdersPage from "./pages/Orders/OrdersPageMain/OrdersPage";
import ProductsPage from "./pages/Products/ProductsPageMain/ProductsPage";
import MassMailingPage from "./pages/Mailing/MassMailingPage";
import ErrorPages from "./pages/Error/ErrorPages";
import OrdersShowEdit from "./pages/Orders/OrdersShowEdit/OrdersShowEdit";
import ProductsShowEdit from "./pages/Products/ProductsShowEdit/ProductsShowEdit";
import ProductsCreate from "./pages/Products/ProductsCreate/ProductsCreate";
import ExcelPage from "./pages/Excel/ExcelPage";
import LayoutMenu from "./components/Layout/Layout";
import LoginPage from "./pages/Auth/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import 'overlayscrollbars/overlayscrollbars.css';
import './App.css'
import { LanguageProvider } from "./providers/LanguageProvider";


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <LayoutMenu />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="mailing" element={<MassMailingPage />} />
        <Route path="excel" element={<ExcelPage />} />

        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductsShowEdit edit={false} nameFunc="show" />} />
        <Route path="products/create" element={<ProductsCreate edit={true} />} />
        <Route path="products/edit/:id" element={<ProductsShowEdit edit={true} nameFunc="save" />} />

        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrdersShowEdit edit={false} nameFunc="show" />} />
        <Route path="orders/edit/:id" element={<OrdersShowEdit edit={true} nameFunc="save" />} />

        <Route path="*" element={<ErrorPages />} />
      </Route>
    </>
  )
);

function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}

export default App;