import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/Button";

import styles from "./index.module.scss";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data) => api.post("/auth/login", data),
    onSuccess: (data) => {
      const token = data.data?.data?.access_token || data.data?.access_token;
      if (token) {
        localStorage.setItem("user", JSON.stringify(data.data?.data?.user));
        localStorage.setItem("token", token);
        localStorage.setItem("refresh_token", data.data?.data?.refresh_token);
      }
      navigate("/profile");
    },
    onError: (err) => {
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    mutation.mutate({ email, password });
  };

  return (
    <div className={styles.loginPage}>
      {/* Ambient Background Effects */}
      <div className={styles.ambientBackground}>
        <div className={styles.effect1} />
        <div className={styles.effect2} />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <LogIn className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to continue to Smanzy</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIcon}>
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIcon}>
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.togglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending} variant="login">
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" className={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
