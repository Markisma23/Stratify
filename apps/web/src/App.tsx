import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DataIntakePage } from "./pages/DataIntakePage";
import { FrameworkPage } from "./pages/FrameworkPage";
import { GapAnalysisPage } from "./pages/GapAnalysisPage";
import { KpiAnalysisPage } from "./pages/KpiAnalysisPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { StrategyMapPage } from "./pages/StrategyMapPage";

export const App = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/intake" element={<DataIntakePage />} />
      <Route path="/strategy-map" element={<StrategyMapPage />} />
      <Route path="/kpi-analysis" element={<KpiAnalysisPage />} />
      <Route path="/gap-analysis" element={<GapAnalysisPage />} />
      <Route path="/recommendations" element={<RecommendationsPage />} />
      <Route path="/framework" element={<FrameworkPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AppLayout>
);
