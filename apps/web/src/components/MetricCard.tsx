type Props = {
  title: string;
  value: string;
  delta: string;
};

export const MetricCard = ({ title, value, delta }: Props) => {
  return (
    <div className="metric-card">
      <p className="muted">{title}</p>
      <h3>{value}</h3>
      <span className={delta.startsWith("-") ? "down" : "up"}>{delta}</span>
    </div>
  );
};
