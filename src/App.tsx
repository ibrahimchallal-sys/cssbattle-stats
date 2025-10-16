import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMessages from "./pages/AdminMessages";
import Leaderboard from "./pages/Leaderboard";
import DatabaseTest from "./pages/DatabaseTest";
import DatabasePermissionsTest from "./pages/DatabasePermissionsTest";
import PasswordReset from "./pages/PasswordReset";

const App = () => (
  <AuthProvider>
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><Navbar /><Index /></>} />
          <Route path="/register" element={<><Navbar /><Register /></>} />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/profile" element={<><Navbar /><Profile /></>} />
          <Route path="/contact" element={<><Navbar /><Contact /></>} />
          <Route path="/leaderboard" element={<><Navbar /><Leaderboard /></>} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<><Navbar /><AdminDashboard /></>} />
          <Route path="/admin/messages" element={<><Navbar /><AdminMessages /></>} />
          <Route path="/database-test" element={<><Navbar /><DatabaseTest /></>} />
          <Route path="/database-permissions-test" element={<><Navbar /><DatabasePermissionsTest /></>} />
          <Route path="/reset-password" element={<PasswordReset />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  </AuthProvider>
);

export default App;