import { Suspense } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AskWidget } from "./AskWidget";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <SiteHeader />
      {children}
      <SiteFooter />
      <Suspense fallback={null}>
        <AskWidget />
      </Suspense>
    </div>
  );
}
