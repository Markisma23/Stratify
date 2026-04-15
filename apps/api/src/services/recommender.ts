export type GapSignal = {
  category: "people" | "process" | "performance";
  severity: "low" | "medium" | "high";
  title: string;
};

const library = [
  { id: "INT-001", title: "Data Science Upskilling", tags: ["people"], impact: 0.87 },
  { id: "INT-002", title: "KPI Automation Pipeline", tags: ["process", "performance"], impact: 0.9 },
  { id: "INT-003", title: "Process SOP Redesign Workshop", tags: ["process"], impact: 0.8 },
  { id: "INT-004", title: "Coaching + Mentorship Sprint", tags: ["people"], impact: 0.72 }
];

export const generateRecommendations = (signals: GapSignal[]) => {
  const boosted = library.map((item) => {
    const relevance = signals.reduce((score, signal) => {
      const tagMatch = item.tags.includes(signal.category) ? 0.2 : 0;
      const severityWeight = signal.severity === "high" ? 0.2 : signal.severity === "medium" ? 0.1 : 0.05;
      return score + tagMatch + severityWeight;
    }, 0);

    const score = Math.min(0.99, Number((item.impact + relevance).toFixed(2)));

    return {
      interventionId: item.id,
      title: item.title,
      confidence: score,
      rationale: `Selected due to signal overlap with ${signals.map((s) => s.title).join(", ")}`
    };
  });

  return boosted.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
};
