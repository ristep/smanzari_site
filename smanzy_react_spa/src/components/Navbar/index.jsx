import styles from "./index.module.scss";

import { Link, useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import logoImage from "@/assets/smanzy_logo_180.png";

const NavLink = ({ to, children, mobile = false, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={clsx(
      mobile ? styles.mobileLink : styles.navLink,
      isActive && styles.active,
    )}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Logo */}
          <div className={styles.leftSection}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <img src={logoImage} alt="Logo" />
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className={styles.navDesktop}>
              <div className={styles.navList}>
                <NavLink to="/" isActive={isActive("/")}>
                  Home
                </NavLink>
                <NavLink to="/about" isActive={isActive("/about")}>
                  About
                </NavLink>
                {token && (
                  <NavLink to="/media" isActive={isActive("/media")}>
                    Media List
                  </NavLink>
                )}
                {token && (
                  <NavLink to="/mediacards" isActive={isActive("/mediacards")}>
                    Media Cards
                  </NavLink>
                )}
                {token && (
                  <NavLink to="/albums" isActive={isActive("/albums")}>
                    Albums
                  </NavLink>
                )}
                {token && (
                  <NavLink to="/profile" isActive={isActive("/profile")}>
                    Profile
                  </NavLink>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className={styles.rightSection}>
            <div className={styles.authList}>
              <ThemeToggle />
              {token ? (
                <Button onClick={handleLogout} variant="danger" size="sm">
                  Logout
                </Button>
              ) : (
                <div className={styles.authList}>
                  <Link to="/login" className={styles.loginLink}>
                    Login
                  </Link>
                  <Button onClick={() => navigate("/register")} size="sm">
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className={styles.mobileBtnWrapper}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={styles.mobileMenuBtn}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className={styles.mobile}>
          <div className={styles.mobileContent}>
            {/* Theme Toggle in Mobile Menu */}
            <div className={styles.mobileThemeToggle}>
              <span>Theme</span>
              <ThemeToggle />
            </div>
            <NavLink
              to="/"
              mobile
              isActive={isActive("/")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              mobile
              isActive={isActive("/about")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </NavLink>
            {token && (
              <>
                <NavLink
                  to="/profile"
                  mobile
                  isActive={isActive("/profile")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/media"
                  mobile
                  isActive={isActive("/media")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Media
                </NavLink>
                <NavLink
                  to="/albums"
                  mobile
                  isActive={isActive("/albums")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Albums
                </NavLink>
                <NavLink
                  to="/mediathumbs"
                  mobile
                  isActive={isActive("/mediathumbs")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Media Thumbs
                </NavLink>
              </>
            )}
            <div className={styles.mobileAuth}>
              {!token ? (
                <div className={styles.mobileAuthGrid}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/register");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Register
                  </Button>
                </div>
              ) : (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
