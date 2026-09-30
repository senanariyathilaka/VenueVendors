import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminUser, loginAdmin, loginError, isReady } = useAdminAuth();

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    if (adminUser) {
      router.replace("/dashboard");
    }
  }, [adminUser, isReady, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const success = await loginAdmin(username.trim(), password);

    setIsSubmitting(false);

    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="page-shell">
      <div
        className="card"
        style={{
          maxWidth: 520,
          margin: "60px auto",
          padding: 32,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#2563eb",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Venue Vendors Admin
        </p>

        <h1
          style={{
            marginTop: 10,
            marginBottom: 12,
            fontSize: 40,
            color: "#0f172a",
          }}
        >
          Admin sign in
        </h1>

        <p className="helper-text" style={{ marginBottom: 24 }}>
          Use the dedicated admin credentials to access the separate admin
          dashboard.
        </p>

        {loginError ? (
          <div className="error-box" style={{ marginBottom: 20 }}>
            {loginError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label className="label">Admin username</label>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter admin username"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="label">Admin password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            className="button-primary"
            style={{ width: "100%" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in to admin dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}