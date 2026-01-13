import { useContext } from "react";
import styles from "./index.module.scss";

import { Link, useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import logoImage from "@/assets/smanzy_logo_180.png";
import { useUser } from "@/context/UserContext";
import { RouteContext } from "@/context/RouteContext";

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
    const { routes } = useContext(RouteContext);

    // Check if user has admin role
    const isAdmin = user?.roles?.some((r) => r.name === "admin");

    const isActive = (path) => location.pathname === path;

    const hasAccess = (route) => {
        // Public routes (no roles defined)
        if (!route.roles || route.roles.length === 0) return true;
        // Protected routes require user
        if (!user || !user.roles) return false;
        // Check matching roles
        return user.roles.some((r) => route.roles.includes(r.name));
    };

    const inMenu = (route) => {
        if (route.group !== "menu") return false;
        return hasAccess(route);
    };

    const inAdminMenu = (route) => {  // to be implemented soon
        if (route.group !== "adminMenu") return false;
        return hasAccess(route);
    };

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

                    <div className={styles.leftSection}>
                        {/* Logo */}
                        <Link to="/" className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <img src={logoImage} alt="Logo" />
                            </div>
                        </Link>

                        {/* Desktop Nav menu */}
                        <div className={styles.navDesktop}>
                            <div className={styles.navList}>
                                {routes
                                    .filter(inMenu)
                                    .map((route, index) => (
                                        <NavLink key={index} to={route.path} isActive={isActive(route.path)}>
                                            {route.title}
                                        </NavLink>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className={styles.rightSection}>
                        <div className={styles.authList}>
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <NavLink to="/profile" className={styles.userName}>
                                        {user.name}
                                    </NavLink>
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
                    {routes
                        .filter(inMenu)
                        .map((route, index) => (
                            <NavLink
                                key={index}
                                to={route.path}
                                mobile
                                isActive={isActive(route.path)}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {route.title}
                            </NavLink>
                        ))
                    }

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
                            </div>
                        ) : (
                            <div className={styles.mobileAuthGrid}>
                                <NavLink to="/profile" className={styles.userName} onClick={() => setIsMobileMenuOpen(false)}>
                                    {user.name}
                                </NavLink>
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* End of mobile menu */}
        </nav>
    );
}

