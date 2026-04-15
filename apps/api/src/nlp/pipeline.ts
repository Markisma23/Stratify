export type ExtractedEntity = {
  type: "OBJECTIVE" | "INITIATIVE" | "KPI" | "ROLE";
  value: string;
  confidence: number;
};

const objectivePattern = /(?:objective|goal)\s*:\s*([^\.\n]+)/gi;
const initiativePattern = /(?:initiative|program)\s*:\s*([^\.\n]+)/gi;
const kpiPattern = /(?:kpi|metric)\s*:\s*([^\.\n]+)/gi;
const rolePattern = /(?:role|owner)\s*:\s*([^\.\n]+)/gi;

const collect = (text: string, pattern: RegExp, type: ExtractedEntity["type"], confidence: number) => {
  const matches: ExtractedEntity[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    matches.push({ type, value: m[1].trim(), confidence });
  }
  return matches;
};

export const extractEntities = (text: string): ExtractedEntity[] => {
  return [
    ...collect(text, objectivePattern, "OBJECTIVE", 0.86),
    ...collect(text, initiativePattern, "INITIATIVE", 0.82),
    ...collect(text, kpiPattern, "KPI", 0.84),
    ...collect(text, rolePattern, "ROLE", 0.8)
  ];
};

const ontologySynonyms: Record<string, string> = {
  "revenue growth": "KPI_REVENUE_GROWTH",
  "cloud migration": "INIT_CLOUD_MIGRATION",
  "data scientist": "ROLE_DATA_SCIENTIST"
};

export const mapToOntology = (value: string) => {
  const key = value.toLowerCase();
  return ontologySynonyms[key] ?? null;
};
