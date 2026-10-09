import Header from "./component/Header.jsx";
import Footer from "./component/Footer.jsx";
import Home from "./pages/Home.jsx";

function App(){
    return (
        <div className="flex min-h-screen flex-col">
            <Header/>
            <Home/>
            <Footer/>
        </div>
    )
}
export default App;
