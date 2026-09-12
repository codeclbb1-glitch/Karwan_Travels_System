import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Hajj from "./pages/Hajj";
import Umrah from "./pages/Umrah";
import Bookings from "./pages/Bookings";
import DisplayScreen from "./pages/DisplayScreen";
import Pricing from "./pages/Pricing";
import Finance from "./pages/Finance";
import Investments from "./pages/Investments";
import OfficeExpenses from "./pages/OfficeExpenses";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Tasks from "./pages/Tasks";
import PamphletGenerator from "./pages/PamphletGenerator";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { role, authLoading } = useApp();
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-navy-500">Loading your session...</div>;
  }
  return role ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role } = useApp();
  return role === "admin" ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/display" element={<DisplayScreen />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="hajj" element={<Hajj />} />
        <Route path="umrah" element={<Umrah />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="settings" element={<Settings />} />
        <Route path="pricing" element={<AdminRoute><Pricing /></AdminRoute>} />
        <Route path="finance" element={<AdminRoute><Finance /></AdminRoute>} />
        <Route path="investments" element={<AdminRoute><Investments /></AdminRoute>} />
        <Route path="office-expenses" element={<AdminRoute><OfficeExpenses /></AdminRoute>} />
        <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="pamphlet" element={<PamphletGenerator />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
