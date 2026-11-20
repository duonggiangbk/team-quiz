"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const View = dynamic(() => import("@/components/EditView"), {
  ssr: false,
  loading: () => <p className="p-6 text-center text-slate-500">Đang tải…</p>,
});

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
