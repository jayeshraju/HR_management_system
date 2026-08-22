import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../services/auth';
export function ProtectedRoute({ roles }: { roles?: Role[] }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="auth-loading">Loading your workspace...</div>; if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace/>; if (roles && !roles.includes(user.role)) return <Navigate to="/" replace/>; return <Outlet/>; }
