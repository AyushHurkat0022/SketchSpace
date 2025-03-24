import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WelcomePage from "./components/pages/welcome.tsx";
import Login from "./components/Auth/login.tsx";
import Profile from "./components/pages/profile.jsx";
import CanvasPage from "./components/pages/CanvasPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/canvas/:canvasid" element={<CanvasPage />} />  {/* Canvas Route */}
      </Routes>
    </Router>
  );
}

export default App;
