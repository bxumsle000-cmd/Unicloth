import Header from "./component/Header.jsx";
import Footer from "./component/Footer.jsx";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App(){
    return (
        <BrowserRouter>
        <div className="flex min-h-screen flex-col">
            <Header/>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/category/:code" element={<Category/>}/>
            </Routes>
            <Footer/>
        </div>
        </BrowserRouter>
            )
}

export default App;
