import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { DashboardPage } from "@/pages/DashboardPage";
import { ChatPage } from "@/pages/ChatPage";
import { SchemesPage } from "@/pages/SchemesPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { CivicPage } from "@/pages/CivicPage";
import { ScamPage } from "@/pages/ScamPage";
import { LifeEventsPage } from "@/pages/LifeEventsPage";
import { DeadlinesPage } from "@/pages/DeadlinesPage";
import { SettingsPage } from "@/pages/SettingsPage";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="schemes" element={<SchemesPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="civic" element={<CivicPage />} />
                  <Route path="scam" element={<ScamPage />} />
                  <Route path="life-events" element={<LifeEventsPage />} />
                  <Route path="deadlines" element={<DeadlinesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
