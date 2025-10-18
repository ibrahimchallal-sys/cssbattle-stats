import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMessages from "./pages/AdminMessages";
import AdminPlayerDetails from "./pages/AdminPlayerDetails";
import AdminLearningManagement from "./pages/AdminLearningManagement";
import Leaderboard from "./pages/Leaderboard";
import LearningCenter from "./pages/LearningCenter";
import DatabaseTest from "./pages/DatabaseTest";
import DatabasePermissionsTest from "./pages/DatabasePermissionsTest";
import PasswordReset from "./pages/PasswordReset";
import Contact from "./pages/Contact";
import TestPlayerFetch from "./pages/TestPlayerFetch";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PlayerProtectedRoute from "./components/PlayerProtectedRoute";

const App = () => (
  <AuthProvider>
    <AdminProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Index />
                </>
              }
            />
            <Route
              path="/register"
              element={
                <>
                  <Navbar />
                  <Register />
                </>
              }
            />
            <Route
              path="/login"
              element={
                <>
                  <Navbar />
                  <Login />
                </>
              }
            />
            <Route path="/reset-password" element={<PasswordReset />} />

            {/* Player-only routes */}
            <Route
              path="/profile"
              element={
                <PlayerProtectedRoute>
                  <>
                    <Navbar />
                    <Profile />
                  </>
                </PlayerProtectedRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <PlayerProtectedRoute>
                  <>
                    <Navbar />
                    <Contact />
                  </>
                </PlayerProtectedRoute>
              }
            />

            {/* Routes accessible to both players and admins */}
            <Route
              path="/leaderboard"
              element={
                <>
                  <Navbar />
                  <Leaderboard />
                </>
              }
            />
            <Route
              path="/learning"
              element={
                <>
                  <Navbar />
                  <LearningCenter />
                </>
              }
            />

            {/* Admin-only routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <>
                    <Navbar />
                    <AdminDashboard />
                  </>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <AdminProtectedRoute>
                  <>
                    <Navbar />
                    <AdminMessages />
                  </>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/player/:playerId"
              element={
                <AdminProtectedRoute>
                  <>
                    <Navbar />
                    <AdminPlayerDetails />
                  </>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/learning"
              element={
                <AdminProtectedRoute>
                  <>
                    <Navbar />
                    <AdminLearningManagement />
                  </>
                </AdminProtectedRoute>
              }
            />

            {/* Test routes - should probably be removed in production */}
            <Route
              path="/database-test"
              element={
                <>
                  <Navbar />
                  <DatabaseTest />
                </>
              }
            />
            <Route
              path="/database-permissions-test"
              element={
                <>
                  <Navbar />
                  <DatabasePermissionsTest />
                </>
              }
            />
            <Route
              path="/test-player-fetch"
              element={
                <>
                  <Navbar />
                  <TestPlayerFetch />
                </>
              }
            />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AdminProvider>
  </AuthProvider>
);

export default App;
