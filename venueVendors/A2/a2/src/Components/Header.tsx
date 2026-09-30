import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/Context/AuthContext";
import Navigation from "@/Components/navigation";

export function Header() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login?loggedOut=true");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-slate-900">
          Venue Vendors
        </Link>

        <nav className="flex items-center gap-4 text-sm font-semibold text-slate-700">
          {!currentUser && (
            <Link href="/signUp" className="hover:text-slate-900">
              Get Started
            </Link>
          )}

          {currentUser && (
            <>
              <Link
                href={currentUser.role === "hirer" ? "/hirer" : "/vendor"}
                className="hover:text-slate-900"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
              >
                Sign Out
              </button>
            </>
          )}

          <Navigation />
        </nav>
      </div>
    </header>
  );
}