import { randomUUID } from "node:crypto";
import { query } from "../client.js";

type KpiPointInput = { timestamp: string; value: number };

export const upsertKpiSeries = async (kpiKey: string, unit: string, points: KpiPointInput[]) => {
  const selectResult = await query<{ id: string }>("SELECT id FROM kpis WHERE kpi_key = $1 LIMIT 1", [kpiKey]);

  const kpiId = selectResult.rows[0]?.id ?? randomUUID();

  if (!selectResult.rows[0]) {
    await query("INSERT INTO kpis (id, kpi_key, unit, source) VALUES ($1, $2, $3, $4)", [kpiId, kpiKey, unit, "api_upload"]);
  }

  await query("DELETE FROM kpi_points WHERE kpi_id = $1", [kpiId]);

  for (const point of points) {
    await query(
      "INSERT INTO kpi_points (id, kpi_id, point_time, point_value) VALUES ($1, $2, $3, $4)",
      [randomUUID(), kpiId, point.timestamp, point.value]
    );
  }

  return { id: kpiId, records: points.length };
};
