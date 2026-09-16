import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsToc } from "@/components/docs/toc";
import { PageFrame } from "@/components/propfund/SiteChrome";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageFrame>
      <div className="help-shell">
        <div className="route-container help-layout">
          <aside className="help-aside">
            <DocsSidebar />
          </aside>
          <div className="help-main">{children}</div>
          <aside className="help-toc-rail">
            <DocsToc />
          </aside>
        </div>
      </div>
    </PageFrame>
  );
}
