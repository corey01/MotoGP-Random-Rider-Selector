"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../_components/AuthProvider";
import styles from "../_components/AuthPage.module.scss";

const DEFAULT_REDIRECT = "/sweepstake";

function sanitizeRedirect(path: string | null): string {
  if (!path) return DEFAULT_REDIRECT;
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_REDIRECT;
  return path;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated, isLoading } = useAuth();

  const redirectTo = sanitizeRedirect(searchParams.get("redirect"));

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(email.trim(), password, displayName.trim());
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Register</h2>
      <p className={styles.description}>
        Create an account to save subscriptions and join private sweepstake groups.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          <span className={styles.label}>Display Name</span>
          <input
            className={styles.field}
            type="text"
            required
            minLength={1}
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>

        <label>
          <span className={styles.label}>Email</span>
          <input
            className={styles.field}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          <span className={styles.label}>Password</span>
          <input
            className={styles.field}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={`pickButton ${styles.submit}`} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className={styles.helperText}>
        Already have an account?{" "}
        <Link className={styles.helperLink} href="/login">
          Login
        </Link>
      </p>
    </section>
  );
}
