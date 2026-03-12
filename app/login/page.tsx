"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/app/_components/AuthProvider";
import style from "./Login.module.scss";

export default function LoginPage() {
  const { login, loginWithGoogle, isAdmin, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? "/admin" : "/");
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  const redirectAfterLogin = (admin: boolean) =>
    router.push(admin ? "/admin" : "/");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(email, password);
      redirectAfterLogin(user.role === "admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className={style.page}>
      <form className={style.form} onSubmit={handleSubmit}>
        <h1 className={style.title}>Sign In</h1>

        <div className={style.googleButton}>
          <GoogleLogin
            use_fedcm_for_prompt
            onSuccess={async (response) => {
              if (!response.credential) return;
              setError("");
              try {
                const user = await loginWithGoogle(response.credential);
                redirectAfterLogin(user.role === "admin");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Google sign-in failed");
              }
            }}
            onError={() => setError("Google sign-in failed")}
          />
        </div>

        <div className={style.divider}>
          <span>or</span>
        </div>

        <div className={style.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className={style.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className={style.error}>{error}</p>}

        <button type="submit" className={style.submit} disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
