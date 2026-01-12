import styles from "./index.module.scss";

import { Link, useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import logoImage from "@/assets/smanzy_logo_180.png";
import { useUser } from "@/context/UserContext";

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
    const { user, logout } = useUser();

    const isAdmin = user?.roles?.some((r) => r.name === "admin");

    const isActive = (path) => location.pathname === path;

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const controlNavbar = () => {
        if (typeof window !== 'undefined') {
            if (window.scrollY > 100) { // Threshold to start hiding
                if (window.scrollY > lastScrollY) { // Scrolling down
                    setIsVisible(false);
                } else { // Scrolling up
                    setIsVisible(true);
                }
            } else {
                setIsVisible(true);
            }
            setLastScrollY(window.scrollY);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlNavbar);

            // Cleanup function
            return () => {
                window.removeEventListener('scroll', controlNavbar);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastScrollY]);


    return (
        <nav className={clsx(styles.navbar, !isVisible && styles.hidden)}>
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
                                <NavLink to="/videos" isActive={isActive("/videos")}>
                                    Videos
                                </NavLink>
                                <NavLink to="/about" isActive={isActive("/about")}>
                                    About
                                </NavLink>
                                {user && (
                                    <NavLink to="/media" isActive={isActive("/media")}>
                                        Media List
                                    </NavLink>
                                )}
                                {user && (
                                    <NavLink to="/mediacards" isActive={isActive("/mediacards")}>
                                        Media Cards
                                    </NavLink>
                                )}
                                {user && (
                                    <NavLink to="/albums" isActive={isActive("/albums")}>
                                        Albums
                                    </NavLink>
                                )}
                                {user && (
                                    <NavLink to="/profile" isActive={isActive("/profile")}>
                                        Profile
                                    </NavLink>
                                )}
                                {user && isAdmin && (
                                    <NavLink to="/users" isActive={isActive("/users")}>
                                        Users
                                    </NavLink>
                                )}
                                {user && isAdmin && (
                                    <NavLink to="/siteadmin" isActive={isActive("/siteadmin")}>
                                        Site Admin
                                    </NavLink>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className={styles.rightSection}>
                        <div className={styles.authList}>
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className={styles.userName}>
                                        {user.name}
                                    </span>
                                    <Button onClick={() => {
                                        logout();
                                        setIsMobileMenuOpen(false);
                                    }} variant="danger" size="sm">
                                        Logout
                                    </Button>
                                </div>
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
                        <ThemeToggle />
                    </div>

                    {/* Mobile menu button */}
                    <div className={styles.mobileBtnWrapper}>
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={styles.mobileMenuBtn}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={clsx(styles.mobileMenu, isMobileMenuOpen && styles.mobileMenuOpen)}>
                <div className={styles.mobileContent}>

                    {/* Navigation Links */}
                    <div className={styles.mobileNavSection}>
                        <NavLink
                            to="/"
                            mobile
                            isActive={isActive("/")}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to="/videos"
                            mobile
                            isActive={isActive("/videos")}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Videos
                        </NavLink>
                        <NavLink
                            to="/about"
                            mobile
                            isActive={isActive("/about")}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            About
                        </NavLink>
                        {user && (
                            <>
                                <NavLink
                                    to="/media"
                                    mobile
                                    isActive={isActive("/media")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Media List
                                </NavLink>
                                <NavLink
                                    to="/mediacards"
                                    mobile
                                    isActive={isActive("/mediacards")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Media Cards
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
                                    to="/profile"
                                    mobile
                                    isActive={isActive("/profile")}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profile
                                </NavLink>
                                {isAdmin && (
                                    <NavLink
                                        to="/users"
                                        mobile
                                        isActive={isActive("/users")}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Users
                                    </NavLink>
                                )}
                            </>
                        )}
                    </div>

                    {/* Auth Buttons */}
                    <div className={styles.mobileAuth}>
                        {!user ? (
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
                                onClick={() => {
                                    logout();
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav >
    );
}
