import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronDown, Clock3, LogOut, Moon, Search, ShieldCheck, Sparkles, Sun, User, Users, WalletCards } from 'lucide-react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HrAttendancePage } from '../pages/AttendanceExperience';
import { HrLeavePage } from '../pages/LeaveManagement';
import { HrDashboardPage, EmployeeDetailPage, EmployeesPage, HrPayrollPage } from '../pages/HrPages';
import { AnalyticsPage, AssistantPage } from '../pages/IntelligencePages';
import { AuditLogPage, GlobalSearchPage, NotificationsCenterPage, ReportsPage } from '../pages/OperationsPages';
import { DemoControls } from '../components/DemoControls';
import '../styles/shell.css';

function AvatarMenu({ user, logout, dark, setDark }: { user: any; logout: () => void; dark: boolean; setDark: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="avatar-menu" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(!open)}>
        <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="avatar-dropdown">
          <div className="avatar-dropdown-header">
            <span className="avatar lg">{user.name.slice(0, 2).toUpperCase()}</span>
            <div><strong>{user.name}</strong><small>{user.email}</small></div>
          </div>
          <button onClick={() => { navigate('/employees'); setOpen(false); }}><User size={14} /> My Profile</button>
          <button onClick={() => { setDark(!dark); setOpen(false); }}>{dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Light mode' : 'Dark mode'}</button>
          <hr />
          <button className="danger" onClick={() => { void logout(); setOpen(false); }}><LogOut size={14} /> Sign out</button>
        </div>
      )}
    </div>
  );
}

const nav = [
  ['Employees', '/employees', Users],
  ['Attendance', '/attendance', Clock3],
  ['Time Off', '/leave-approvals', CalendarDays],
  ['Payroll', '/payroll', WalletCards],
  ['Analytics', '/analytics', Sparkles],
  ['Reports', '/reports', WalletCards],
  ['Audit Logs', '/audit-logs', ShieldCheck],
  ['Search', '/search', Search],
] as const;

export function HrShell() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className={dark ? 'app shell-top dark' : 'app shell-top'}>
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand-mark">d</span>
          <span className="brand-name">dayflow</span>
          <span className="hr-badge">HR</span>
        </div>
        <nav className={`topnav ${mobileOpen ? 'open' : ''}`}>
          {nav.slice(0, 5).map(([label, path, Icon]) => (
            <NavLink key={path} to={path} end={path === '/employees'} onClick={() => setMobileOpen(false)}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <button className="icon-button" onClick={() => navigate('/search')} title="Global Search"><Search size={17} /></button>
          <button className="icon-button notification" onClick={() => navigate('/notifications')} title="Notifications">
            <Bell size={18} /><i />
          </button>
          <AvatarMenu user={user} logout={logout} dark={dark} setDark={setDark} />
        </div>
      </header>
      <main className="shell-main">
        <div className="content">
          <DemoControls />
          <Routes>
            <Route path="/" element={<Navigate to="/employees" replace />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/attendance" element={<HrAttendancePage />} />
            <Route path="/leave-approvals" element={<HrLeavePage />} />
            <Route path="/payroll" element={<HrPayrollPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/notifications" element={<NotificationsCenterPage />} />
            <Route path="/audit-logs" element={<AuditLogPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/search" element={<GlobalSearchPage />} />
            <Route path="/dashboard" element={<HrDashboardPage />} />
            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
