import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../app/AppLayout";
import DashboardPage from "../pages/DashboardPage";
import CrawlerManagerPage from "../pages/CrawlerManagerPage";
import RuleManagerPage from "../pages/RuleManagerPage";
import SettingsPage from "../pages/SettingsPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/crawler-manager" element={<CrawlerManagerPage />} />
          <Route path="/rule-manager" element={<RuleManagerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
