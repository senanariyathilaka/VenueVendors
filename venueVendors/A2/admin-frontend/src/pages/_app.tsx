import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AdminAuthProvider>
      <Component {...pageProps} />
    </AdminAuthProvider>
  );
}