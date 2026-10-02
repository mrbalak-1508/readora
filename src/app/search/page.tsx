"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q) {
      router.replace(`/explore?q=${encodeURIComponent(q)}`);
    } else {
      router.replace("/explore");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
      <div className="text-xs text-[var(--text-muted)]">Searching catalog...</div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchRedirect />
    </Suspense>
  );
}
