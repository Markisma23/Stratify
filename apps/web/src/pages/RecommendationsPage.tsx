const sample = [
  { title: "Automated KPI Tracking", rationale: "Reduces process gap and reporting delay." },
  { title: "Data Science Upskilling", rationale: "Improves predictive capability for strategy analysts." }
];

export const RecommendationsPage = () => (
  <section>
    <header className="page-header">
      <h1>Intervention Recommendations</h1>
      <button>Build Framework</button>
    </header>
    <div className="grid cols-2">
      {sample.map((item) => (
        <article key={item.title} className="panel">
          <h3>{item.title}</h3>
          <p>{item.rationale}</p>
          <button>Add to Framework</button>
        </article>
      ))}
    </div>
  </section>
);
