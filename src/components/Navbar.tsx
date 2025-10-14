import { Button } from "@/components/ui/button";
import { Menu, X, User as UserIcon, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { admin, isAdmin } = useAdmin();

  // Debug: Log authentication states
  useEffect(() => {
    console.log("Navbar - Auth states:", { user, admin, isAdmin });
    console.log("Navbar - User details:", user ? {
      id: user.id,
      email: user.email,
      full_name: user.full_name
    } : "No user");
  }, [user, admin, isAdmin]);

  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Contact", href: "/contact" },
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
              <span className="text-xs font-medium text-foreground">
                institut Spécialisé de Formation de l'Offshoring
              </span>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:bg-battle-purple/10 mr-2"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="text-foreground hover:bg-battle-purple/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Single-line layout for desktop */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo and Institute Name */}
          <div className="flex-shrink-0 flex items-center">
            <img 
              src="/ofppt logo.png" 
              alt="OFPPT Logo" 
              className="h-10 w-auto"
            />
            <span className="ml-3 text-sm font-medium text-foreground">
              institut Spécialisé de Formation de l'Offshoring
            </span>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`${
                  location.pathname === link.href 
                    ? "text-foreground font-bold" 
                    : "text-foreground/80 hover:text-foreground"
                } transition-colors font-medium`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-battle-purple/10"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center space-x-2">
              {/* Debug: Show auth states */}
              <div className="hidden text-xs text-foreground/50">
                User: {user ? "Yes" : "No"} | Admin: {isAdmin ? "Yes" : "No"}
              </div>
              
              {isAdmin && location.pathname !== "/admin/dashboard" && (
                <Button
                  onClick={() => navigate("/admin/dashboard")}
                  variant="outline"
                  size="sm"
                  className="border-battle-purple/50 hover:bg-battle-purple/10 text-xs"
                >
                  Admin Dashboard
                </Button>
              )}
              {isAdmin && !user && (
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  size="sm"
                  className="border-battle-purple/50 hover:bg-battle-purple/10 text-xs"
                >
                  Login as Player
                </Button>
              )}
              {user ? (
                <div 
                  className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate("/profile")}
                >
                  <UserIcon className="w-5 h-5 text-foreground" />
                </div>
              ) : !isAdmin && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="border-battle-purple/50 hover:bg-battle-purple/10"
                  >
                    Log in
                  </Button>
                  <Button 
                    onClick={() => window.open("https://css-battle-isfo.vercel.app/", "_blank")}
                    className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                  >
                    S'inscrire
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-battle-purple/20">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`${
                    location.pathname === link.href 
                      ? "text-foreground font-bold" 
                      : "text-foreground/80 hover:text-foreground"
                  } transition-colors font-medium px-2 py-1`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
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
                    {isAdmin && location.pathname !== "/admin/dashboard" && (
                      <Button
                        onClick={() => {
                          navigate("/admin/dashboard");
                          setIsMenuOpen(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                      >
                        Admin Dashboard
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        toggleTheme();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </Button>
                  </>
                ) : isAdmin ? (
                  <>
                    <Button
                      onClick={() => {
                        navigate("/login");
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      Login as Player
                    </Button>
                    {location.pathname !== "/admin/dashboard" && (
                      <Button
                        onClick={() => {
                          navigate("/admin/dashboard");
                          setIsMenuOpen(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                      >
                        Admin Dashboard
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        toggleTheme();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-battle-purple/50 hover:bg-battle-purple/10"
                    >
                      {isDarkMode ? "Light Mode" : "Dark Mode"}
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
                      Log in
                    </Button>
                    <Button 
                      onClick={() => {
                        window.open("https://css-battle-isfo.vercel.app/", "_blank");
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      S'inscrire
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