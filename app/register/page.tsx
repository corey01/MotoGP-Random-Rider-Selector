"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_components/AuthProvider";
import {
  buildPathWithReturnTo,
  normalizeReturnTo,
  RETURN_TO_PARAM,
} from "@/utils/returnTo";
import style from "./Register.module.scss";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = normalizeReturnTo(searchParams.get(RETURN_TO_PARAM));
  const loginHref = buildPathWithReturnTo("/login", returnTo);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await register(email, password, displayName);
      router.replace(buildPathWithReturnTo("/onboarding", returnTo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.page}>
      <form className={style.form} onSubmit={handleSubmit}>
        <h1 className={style.title}>Create account</h1>

        <div className={style.field}>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            required
          />
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
            autoComplete="new-password"
            required
          />
        </div>

        <div className={style.field}>
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className={style.error}>{error}</p>}

        <button type="submit" className={style.submit} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className={style.loginLink}>
          Already have an account? <Link href={loginHref}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
