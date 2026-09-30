import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function HomePage() {
  const router = useRouter();
  const { adminUser, isReady } = useAdminAuth();

  useEffect(() => {
    if (!isReady) return;

    if (adminUser) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [adminUser, isReady, router]);

  return null;
}