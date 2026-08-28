import { Suspense } from "react";
import { SiteHeader } from "./SiteHeader";
import { AskWidget } from "./AskWidget";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <div className="grain" aria-hidden />
      <SiteHeader />
      {children}
      <Suspense fallback={null}>
        <AskWidget />
      </Suspense>
    </div>
  );
}
