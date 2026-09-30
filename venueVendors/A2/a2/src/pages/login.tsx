import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { useAuth } from "../Context/AuthContext";
import useFadeInHook from "@/Components/useFadeInHook";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;

export default function Login() {
  const router = useRouter();
  const { currentUser, isLoading, login } = useAuth();
  const { ref, isVisible } = useFadeInHook();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [allowAutoRedirect, setAllowAutoRedirect] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.loggedOut === "true") {
      setSuccessMessage("You've been successfully logged out.");
      router.replace("/login", undefined, { shallow: true });
    }
  }, [router]);

  useEffect(() => {
    if (!router.isReady || isLoading || !currentUser || !allowAutoRedirect) {
      return;
    }

    const targetPage = currentUser.role === "hirer" ? "/hirer" : "/vendor";
    router.replace(targetPage);
  }, [currentUser, isLoading, allowAutoRedirect, router]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (!STRONG_PASSWORD_REGEX.test(password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, a special character, and be at least 6 characters long.";
    }

    return newErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAllowAutoRedirect(false);
    setSuccessMessage("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    const result = await login(email.trim().toLowerCase(), password);

    if (!result.success || !result.user) {
      setErrors({ general: result.message });
      return;
    }

    setSuccessMessage("Login successful. Taking you to your dashboard...");
    setIsRedirecting(true);

    setTimeout(() => {
      if (result.user?.role === "hirer") {
        router.push("/hirer");
      } else {
        router.push("/vendor");
      }
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Sign In | Venue Guys</title>
        <meta
          name="description"
          content="Login page for Venue Guys hirers and vendors"
        />
      </Head>

      <Header />

      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div
          ref={ref}
          className={`mx-auto w-full max-w-3xl fade-in ${
            isVisible ? "visible" : ""
          }`}
        >
          <section className="rounded-2xl bg-white p-8 shadow-lg">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Welcome back
            </p>

            <h1 className="mb-4 text-4xl font-bold text-slate-900">
              Sign in to Venue Guys
            </h1>

            <p className="mb-8 text-lg leading-8 text-slate-600">
              Enter your registered{" "}
              <span className="font-semibold text-slate-800">Hirer</span> or{" "}
              <span className="font-semibold text-slate-800">Vendor</span>{" "}
              email and password to continue.
            </p>

            {errors.general && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {successMessage && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {/* Sign-in still only asks for email and password, but now submits to the backend API. */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Password
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-l-lg px-4 py-3 text-slate-900 outline-none"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isRedirecting}
                className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isRedirecting ? "Redirecting..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              Need an account?{" "}
              <Link
                href="/signUp"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Get started
              </Link>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}