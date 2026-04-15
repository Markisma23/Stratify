import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

const navItems = [
  ["/", "Dashboard"],
  ["/intake", "Data Intake"],
  ["/strategy-map", "Strategy Map"],
  ["/kpi-analysis", "KPI Analysis"],
  ["/gap-analysis", "Gap Analysis"],
  ["/recommendations", "Recommendations"],
  ["/framework", "Framework Builder"],
  ["/admin", "Admin Console"]
];

export const AppLayout = ({ children }: PropsWithChildren) => {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">⚡ Stratify</div>
        <nav>
          {navItems.map(([to, label]) => (
            <Link key={to} to={to} className={pathname === to ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="pro-card">
          <strong>Production Mode</strong>
          <p>Security baseline enabled. Ready for enterprise integrations.</p>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
};
