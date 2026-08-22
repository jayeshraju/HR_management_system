import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EmployeeShell, ToastHost } from './layouts/EmployeeShell';
import { HrShell } from './layouts/HrShell';
import { Route, Routes } from 'react-router-dom';

function RoleShell() {
  const { user } = useAuth();
  return user?.role === 'employee' ? <><EmployeeShell /><ToastHost /></> : <HrShell />;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<RoleShell />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
