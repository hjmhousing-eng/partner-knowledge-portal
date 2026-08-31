import { Suspense } from "react";
import { SearchProvider } from "./SearchContext";
import { SearchSidebar } from "./SearchSidebar";
import { SearchToggle } from "./SearchToggle";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="shell">
          <SiteHeader search={false} />
          {children}
          <SiteFooter />
        </div>
      }
    >
      <SearchProvider>
        <div className="shell">
          <SiteHeader />
          <div className="app-frame">
            {children}
            <SearchSidebar />
          </div>
          <SiteFooter />
          <SearchToggle />
        </div>
      </SearchProvider>
    </Suspense>
  );
}
