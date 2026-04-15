const counters = new Map<string, number>();

export const inc = (name: string, by = 1) => {
  counters.set(name, (counters.get(name) ?? 0) + by);
};

export const renderPrometheus = () => {
  return Array.from(counters.entries())
    .map(([name, value]) => `# TYPE ${name} counter\n${name} ${value}`)
    .join("\n");
};
