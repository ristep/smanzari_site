import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { User, Mail, Lock, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/Button";
import styles from "./index.module.scss";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data) => api.post("/auth/register", data),
    onSuccess: () => {
      navigate("/login");
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Registration failed.");
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(formData);
  };

  return (
    <div className={styles.registerPage}>
      {/* Ambient Background Effects */}
      <div className={styles.ambientBackground}>
        <div className={styles.effect1} />
        <div className={styles.effect2} />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <UserPlus className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Join Smanzy today</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full Name</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIcon}>
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIcon}>
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
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

          <Button
            type="submit"
            disabled={mutation.isPending}
            variant="register"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Creating Account...</span>
              </>
            ) : (
              "Register"
            )}
          </Button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" className={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
