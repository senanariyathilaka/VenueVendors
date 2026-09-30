export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="siteFooter">
      <p className="siteFooterText">
        &copy; {currentYear} Vendor Venues. All rights reserved.
      </p>
    </footer>
  );
}