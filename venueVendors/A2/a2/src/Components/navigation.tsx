import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../Context/AuthContext";

const Navigation = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);

    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    router.push("/login?loggedOut=true");
  };

  return (
    <>
      <button className="click" onClick={() => setMenuOpen((prev) => !prev)}>
        {menuOpen ? "Close" : "Menu"}
      </button>

      <div className={`navFullScreen ${menuOpen ? "open" : ""}`}>
        <button className="close" onClick={closeMenu}>
          Close
        </button>

        <nav>
          <Link href="/" onClick={closeMenu}>
            Home
          </Link>

          {!currentUser && (
            <Link href="/login" onClick={closeMenu}>
              Sign In
            </Link>
          )}

          <Link href="/vendor" onClick={closeMenu}>
            Vendors
          </Link>

          <Link href="/hirer" onClick={closeMenu}>
            Hirers
          </Link>



          {currentUser && (
            <>
              <Link
                href={currentUser.role === "hirer" ? "/hirer" : "/vendor"}
                onClick={closeMenu}
              >
                Dashboard
              </Link>

              <button className="menuLogoutButton" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Navigation;