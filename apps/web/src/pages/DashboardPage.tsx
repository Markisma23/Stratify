import { MetricCard } from "../components/MetricCard";

export const DashboardPage = () => {
  return (
    <section>
      <header className="page-header">
        <h1>Executive Summary</h1>
        <button>Export Report</button>
      </header>
      <div className="grid cols-4">
        <MetricCard title="Strategic Alignment" value="84%" delta="+12%" />
        <MetricCard title="Capacity Gap" value="22%" delta="-5%" />
        <MetricCard title="Active Initiatives" value="12" delta="+2" />
        <MetricCard title="Team Utilization" value="92%" delta="+3%" />
      </div>
      <div className="grid cols-2">
        <article className="panel">
          <h3>KPI Performance Trends</h3>
          <p>Use the API endpoint <code>/api/tls/kpis/upload</code> to connect real KPI series.</p>
        </article>
        <article className="panel">
          <h3>Gap Distribution</h3>
          <p>People: 10%, Process: 7%, Performance: 5%</p>
        </article>
      </div>
    </section>
  );
};
