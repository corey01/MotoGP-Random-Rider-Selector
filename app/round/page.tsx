"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RoundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roundId = searchParams.get("roundId");
    if (roundId) {
      router.replace(`/race?roundId=${encodeURIComponent(roundId)}`);
      return;
    }

    router.replace("/calendar");
  }, [router, searchParams]);

  return null;
}
