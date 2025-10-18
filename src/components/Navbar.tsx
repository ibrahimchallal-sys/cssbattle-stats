import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  CloudSun,
  LogOut,
  BookOpen,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { themePreference, appliedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: userLogout } = useAuth();
  const { admin, isAdmin, logout: adminLogout } = useAdmin();

  // Debug: Log authentication states
  useEffect(() => {
    console.log("Navbar - Auth states:", { user, admin, isAdmin });
    console.log(
      "Navbar - User details:",
      user
        ? {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
          }
        : "No user"
    );
  }, [user, admin, isAdmin]);

  const getThemeIcon = () => {
    if (themePreference === "auto") {
      return <CloudSun className="h-5 w-5" />;
    }
    return appliedTheme === "dark" ? (
      <Sun className="h-5 w-5" />
    ) : (
      <Moon className="h-5 w-5" />
    );
  };

  const getThemeLabel = () => {
    if (themePreference === "auto") return "Auto";
    return appliedTheme === "dark"
      ? language === "fr"
        ? "Mode clair"
        : "Light Mode"
      : language === "fr"
      ? "Mode sombre"
      : "Dark Mode";
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    navigate("/admin");
  };

  const handleUserLogout = async () => {
    await userLogout();
    navigate("/");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  // Build nav links dynamically based on user status
  const getPlayerNavLinks = () => [
    { name: t("navbar.home"), href: "/" },
    { name: t("navbar.leaderboard"), href: "/leaderboard" },
    { name: t("navbar.learning"), href: "/learning" },
    { name: t("navbar.contact"), href: "/contact" },
  ];

  const getAdminNavLinks = () => [
    { name: t("navbar.home"), href: "/" },
    { name: t("navbar.leaderboard"), href: "/leaderboard" },
    { name: t("navbar.learning"), href: "/learning" },
    { name: t("navbar.dashboard"), href: "/admin/dashboard" },
    { name: t("navbar.messages"), href: "/admin/messages" },
    { name: "Manage Learning", href: "/admin/learning" },
  ];

  const navLinks = isAdmin
    ? getAdminNavLinks()
    : user
    ? getPlayerNavLinks()
    : [
        { name: t("navbar.home"), href: "/" },
        { name: t("navbar.leaderboard"), href: "/leaderboard" },
        { name: t("navbar.learning"), href: "/learning" },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-battle-purple/20">
      <div className="container mx-auto px-4">
        {/* Two-line layout for mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/ofppt logo.png"
                alt="OFPPT Logo"
                className="h-10 w-auto"
              />
            </div>

            {/* Institute Name */}
            <div className="flex-1 text-center px-2">
              <div className="text-xs font-medium text-foreground flex flex-col items-center justify-center text-center">
                {language === 'en' ? (
                  <>
                    <span>Specialized Training</span>
                    <span>Institute for Offshoring</span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px]">Institut Spécialisé de</span>
                    <span className="text-[11px]">Formation de l'Offshoring</span>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="text-foreground hover:bg-battle-purple/10 mr-2"
                title={language === "en" ? "Français" : "English"}
              >
                <Globe className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:bg-battle-purple/10 mr-2"
                title={getThemeLabel()}
              >
                {getThemeIcon()}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="text-foreground hover:bg-battle-purple/10"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Single-line layout for desktop */}
        <div className="hidden md:flex items-center justify-between h-16 w-full">
          {/* Logo and Institute Name */}
          <div className="flex-shrink-0 flex items-center">
            <img
              src="/ofppt logo.png"
              alt="OFPPT Logo"
              className="h-10 w-auto"
            />
            <div className="ml-3 text-sm font-medium text-foreground flex flex-col justify-center">
              {language === 'en' ? (
                <>
                  <span>Specialized Training</span>
                  <span>Institute for Offshoring</span>
                </>
              ) : (
                <>
                  <span className="text-[13px]">Institut Spécialisé de</span>
                  <span className="text-[13px]">Formation de l'Offshoring</span>
                </>
              )}
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className={`flex items-center ${isAdmin ? 'ml-12' : ''} absolute left-1/2 transform -translate-x-1/2`}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`${
                  location.pathname === link.href
                    ? "text-foreground font-bold border-b-2 border-purple-700"
                    : "text-foreground/80 hover:text-foreground hover:border-b-2 hover:border-purple-700/50"
                } transition-all duration-300 ease-in-out font-medium border-b-2 border-transparent mx-4 whitespace-nowrap ${language === 'fr' ? 'text-sm' : 'text-base'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="text-foreground hover:bg-battle-purple/10"
              title={language === "en" ? "Français" : "English"}
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-battle-purple/10"
              title={getThemeLabel()}
            >
              {getThemeIcon()}
            </Button>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <div className="flex items-center space-x-3 mr-4">
                  <button
                    onClick={handleAdminLogout}
                    className="flex items-center bg-gradient-to-r from-battle-purple to-indigo-600 rounded-full px-4 py-1.5 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <span className="text-xs font-semibold text-white mr-2">
                      ADMIN
                    </span>
                    <LogOut className="w-4 h-4 text-white hover:text-red-200" />
                  </button>
                </div>
              )}
              {user ? (
                <div className="flex items-center space-x-2">
                  <div
                    className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate("/profile")}
                  >
                    <UserIcon className="w-5 h-5 text-foreground" />
                  </div>
                  <Button
                    onClick={handleUserLogout}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 hover:bg-red-500/10 text-xs flex items-center"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    {t("navbar.logout")}
                  </Button>
                </div>
              ) : (
                !isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {t("navbar.login")}
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://css-battle-isfo.vercel.app/",
                          "_blank"
                        )
                      }
                      className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      {t("navbar.register")}
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-battle-purple/20">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`${
                    location.pathname === link.href
                      ? "text-foreground font-bold border-b-2 border-purple-700"
                      : "text-foreground/80 hover:text-foreground hover:border-b-2 hover:border-purple-700/50"
                  } transition-all duration-300 ease-in-out font-medium border-b-2 border-transparent px-2 py-1 whitespace-nowrap ${language === 'fr' ? 'text-sm' : 'text-base'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <>
                    <div
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => {
                        navigate("/profile");
                        setIsMenuOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-foreground">{user.full_name}</span>
                    </div>
                    <Button
                      onClick={() => {
                        handleUserLogout();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-500/50 hover:bg-red-500/10 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("navbar.logout")}
                    </Button>
                    <Button
                      onClick={() => {
                        toggleTheme();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {getThemeLabel()}
                    </Button>
                    <Button
                      onClick={() => {
                        toggleLanguage();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {language === "en" ? "FR" : "EN"}
                    </Button>
                  </>
                ) : isAdmin ? (
                  <>
                    <div className="flex items-center bg-battle-purple/10 rounded-full px-3 py-2 justify-center">
                      <span className="text-xs font-medium text-battle-purple mr-2">
                        ADMINISTRATEUR
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        handleAdminLogout();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-500/50 hover:bg-red-500/10 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("navbar.logout")}
                    </Button>
                    <Button
                      onClick={() => {
                        toggleTheme();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {getThemeLabel()}
                    </Button>
                    <Button
                      onClick={() => {
                        toggleLanguage();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {language === "en" ? "FR" : "EN"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("/login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {t("navbar.login")}
                    </Button>
                    <Button
                      onClick={() => {
                        window.open(
                          "https://css-battle-isfo.vercel.app/",
                          "_blank"
                        );
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      {t("navbar.register")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
