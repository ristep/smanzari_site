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

                        {/* Desktop Nav menu */}
                        <div className={styles.navDesktop}>
                            <div className={styles.navList}>
                                {routes.map((route, index) => (
                                    route.group === "menu" && (
                                        (route.protected === false ? (
                                            <NavLink key={index} to={route.path} isActive={isActive(route.path)}>
                                                {route.title}
                                            </NavLink>
                                        ) : (user && (
                                            <NavLink key={index} to={route.path} isActive={isActive(route.path)}>
                                                {route.title}
                                            </NavLink>
                                        )))
                                    )
                                ))}
                            </div>
                        </div>
                        {/* End of desktop menu */}
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
                    {routes.map((route, index) => (
                        route.group === "menu" && (
                            (route.protected === false ? (
                                <NavLink key={index} to={route.path} isActive={isActive(route.path)}>
                                    {route.title}
                                </NavLink>
                            ) : (user && (
                                <NavLink key={index} to={route.path} isActive={isActive(route.path)}>
                                    {route.title}
                                </NavLink>
                            ))
                            )
                        )
                    ))}

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
