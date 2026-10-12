import Header from "./component/Header.jsx";
import Footer from "./component/Footer.jsx";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Wishlist from "./pages/Wishlist.jsx";

function App(){
    return (
        <BrowserRouter>
        <div className="flex min-h-screen flex-col">
            <Header/>
            <main className="flex-1">
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/category/:code" element={<Category/>}/>
                <Route path="/wishlist/" element={<Wishlist/>}/>
            </Routes>
            </main>
            <Footer/>
        </div>
        </BrowserRouter>
            )
}

export default App;
