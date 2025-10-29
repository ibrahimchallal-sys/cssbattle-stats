import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import LearningCenter from "./pages/LearningCenter";
import AdminDashboard from "./pages/AdminDashboardBulk";
import AdminPlayerDetails from "./pages/AdminPlayerDetails";
import AdminQuizRecords from "./pages/AdminQuizRecords";
import AdminMessagesEnhanced from "./pages/AdminMessagesEnhanced";
import PasswordReset from "./pages/PasswordReset";
import DatabaseTest from "./pages/DatabaseTest";
import DatabasePermissionsTest from "./pages/DatabasePermissionsTest";
import TestPlayerFetch from "./pages/TestPlayerFetch";
import TestStorage from "./pages/TestStorage";
import QuizScoreTest from "./pages/QuizScoreTest";
import QuizDebug from "./pages/QuizDebug";
import Team from "./pages/Team";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import PlayerProtectedRoute from "./components/PlayerProtectedRoute";
import PlayerMessagesPanel from "./components/PlayerMessagesPanel";
import MessagesPanel from "./components/MessagesPanel";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useAuth } from "./contexts/AuthContext";
import { useAdmin } from "./contexts/AdminContext";
import { useMessagePanel } from "./hooks/useMessagePanel";
import TestVideoCompletion from "./pages/TestVideoCompletion";

// Wrapper component that includes global message panels
const AppContent = () => {
  const { user } = useAuth();
  const { admin, isAdmin } = useAdmin();
  const {
    isPlayerMessagesOpen,
    isAdminMessagesOpen,
    closePlayerMessages,
    closeAdminMessages,
  } = useMessagePanel();

  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Index />
              <Footer />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <Register />
              <Footer />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <Login />
              <Footer />
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
                <Footer />
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
              <Footer />
            </>
          }
        />
        <Route
          path="/learning"
          element={
            <>
              <Navbar />
              <LearningCenter />
              <Footer />
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
                <Footer />
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
                <Footer />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/quiz-records"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <AdminQuizRecords />
                <Footer />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminProtectedRoute>
              <AdminMessagesEnhanced />
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
              <Footer />
            </>
          }
        />
        <Route
          path="/database-permissions-test"
          element={
            <>
              <Navbar />
              <DatabasePermissionsTest />
              <Footer />
            </>
          }
        />
        <Route
          path="/test-player-fetch"
          element={
            <>
              <Navbar />
              <TestPlayerFetch />
              <Footer />
            </>
          }
        />
        <Route
          path="/test-storage"
          element={
            <AdminProtectedRoute>
              <>
                <Navbar />
                <TestStorage />
                <Footer />
              </>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/quiz-score-test"
          element={
            <>
              <Navbar />
              <QuizScoreTest />
              <Footer />
            </>
          }
        />
        <Route
          path="/quiz-debug"
          element={
            <>
              <Navbar />
              <QuizDebug />
              <Footer />
            </>
          }
        />
        <Route
          path="/test-video-completion"
          element={
            <>
              <Navbar />
              <TestVideoCompletion />
              <Footer />
            </>
          }
        />
        <Route
          path="/team"
          element={
            <>
              <Team />
              <Footer />
            </>
          }
        />
      </Routes>

      {/* Global Player Messages Panel */}
      {user && (
        <PlayerMessagesPanel
          playerEmail={user?.email || ""}
          isOpen={isPlayerMessagesOpen}
          onClose={closePlayerMessages}
        />
      )}

      {/* Global Admin Messages Panel */}
      {isAdmin && (
        <MessagesPanel
          isOpen={isAdminMessagesOpen}
          onClose={closeAdminMessages}
        />
      )}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AdminProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </AdminProvider>
  </AuthProvider>
);

export default App;
