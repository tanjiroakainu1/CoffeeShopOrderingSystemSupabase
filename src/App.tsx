import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LoadingScreen } from "@/components/ui";
import { CustomerShell } from "@/customer/CustomerShell";
import { AdminShell } from "@/admin/AdminShell";
import { GuestHomePage } from "@/screens/GuestHomePage";
import { PublicMenuPage } from "@/screens/PublicMenuPage";
import { RegisterPage, SignInPage } from "@/screens/AuthPages";
import { ForgotAccountPage, RecoverySetPasswordPage, RecoveryStatusPage } from "@/screens/RecoveryPages";

function AppRoutes() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/app/home"} replace /> : <GuestHomePage />} />
      <Route path="/menu" element={user ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/app/home"} replace /> : <PublicMenuPage />} />
      <Route path="/sign-in" element={user ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/app/home"} replace /> : <SignInPage />} />
      <Route path="/register" element={user ? <Navigate to="/app/home" replace /> : <RegisterPage />} />
      <Route path="/forgot-account" element={<ForgotAccountPage />} />
      <Route path="/recovery/status" element={<RecoveryStatusPage />} />
      <Route path="/recovery/set-password" element={<RecoverySetPasswordPage />} />
      <Route
        path="/app/*"
        element={
          user?.role === "customer" ? (
            <CustomerShell user={user} onSignOut={() => void signOut()} />
          ) : user?.role === "admin" ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/admin/*"
        element={
          user?.role === "admin" ? (
            <AdminShell onSignOut={() => void signOut()} />
          ) : user ? (
            <Navigate to="/app/home" replace />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
