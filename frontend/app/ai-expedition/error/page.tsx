"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ExpeditionError from "../components/ExpeditionError";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Something went wrong while preparing your historical expedition.";

  return <ExpeditionError message={message} />;
}

export default function AIExpeditionErrorPage() {
  return (
    <Suspense fallback={<ExpeditionError message="Loading error details..." />}>
      <ErrorContent />
    </Suspense>
  );
}
