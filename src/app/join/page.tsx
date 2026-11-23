"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const View = dynamic(() => import("@/components/StudentView"), { ssr: false });

export default function Page() {
  return <Suspense fallback={<p>Đang tải…</p>}><View /></Suspense>;
}
