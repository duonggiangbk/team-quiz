"use client";

import Image from "next/image";
import { useState } from "react";

export default function QuestionImage({ src, alt }: { src: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState("");

  if (failedSrc === src) {
    return <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Không tải được hình ảnh. Hãy kiểm tra lại liên kết.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-sky-50 p-3">
      <Image
        src={src}
        alt={alt}
        width={640}
        height={360}
        unoptimized
        className="mx-auto max-h-64 w-auto max-w-full rounded-xl object-contain"
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
