"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeTokens } from "@/lib/cookies";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Store tokens in cookies
      storeTokens(accessToken, refreshToken);
      
      // Redirect to dashboard
      router.replace("/dashboard");
    } else {
      // No tokens, redirect to login
      router.replace("/auth/login?error=missing_tokens");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}


