import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "@/Components/Header";
import { Footer } from "@/Components/Footer";
import useFadeInHook from "@/Components/useFadeInHook";
import { useAuth, type UserRole } from "@/Context/AuthContext";

interface FormErrors {
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const NAME_REGEX = /^[A-Za-z\s'-]{2,}$/;
const PHONE_REGEX = /^[\d\s()+-]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;

export default function SignUp() {
  const router = useRouter();
  const { ref, isVisible } = useFadeInHook();
  const { currentUser, isLoading, signup } = useAuth();

  const [role, setRole] = useState<UserRole>("hirer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || isLoading || !currentUser) return;

    const targetPage = currentUser.role === "hirer" ? "/hirer" : "/vendor";
    router.replace(targetPage);
  }, [currentUser, isLoading, router]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (role !== "hirer" && role !== "vendor") {
      newErrors.role = "Please choose an account type.";
    }

    if (!name.trim()) {
      newErrors.name = "Please enter your name.";
    } else if (!NAME_REGEX.test(name.trim())) {
      newErrors.name = "Enter a valid name.";
    }

    if (!email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      newErrors.phone = "Enter a valid phone number.";
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (!STRONG_PASSWORD_REGEX.test(password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, a special character, and be at least 6 characters long.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await signup({
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      confirmPassword,
    });

    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setErrors({ general: result.message });
      return;
    }

    setSuccessMessage("Account created. Taking you to your dashboard...");

    setTimeout(() => {
      router.push(result.user?.role === "vendor" ? "/vendor" : "/hirer");
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Get Started | Venue Guys</title>
        <meta
          name="description"
          content="Create a hirer or vendor account for Venue Guys"
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
              Venue Vendors
            </p>

            <h1 className="mb-4 text-4xl font-bold text-slate-900">
              Get started
            </h1>

            <p className="mb-8 text-lg leading-8 text-slate-600">
              Create an account as either a hirer or a vendor so you can access
              the correct dashboard.
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

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-800">
                  Account type
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("hirer")}
                    className={`rounded-xl border px-5 py-4 text-left transition ${
                      role === "hirer"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-lg font-bold">Hirer</span>
                    <span className="text-sm opacity-80">
                      Search venues and submit booking applications.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("vendor")}
                    className={`rounded-xl border px-5 py-4 text-left transition ${
                      role === "vendor"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-lg font-bold">Vendor</span>
                    <span className="text-sm opacity-80">
                      Manage venues, bookings, blocked dates, and analytics.
                    </span>
                  </button>
                </div>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

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
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
                  placeholder="Enter your phone number (optional)"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
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
                    placeholder="Create your password"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Confirm password
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-l-lg px-4 py-3 text-slate-900 outline-none"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Go to Sign In
              </Link>

              <Link
                href="/"
                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Back to Home
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
