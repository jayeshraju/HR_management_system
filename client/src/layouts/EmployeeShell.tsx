import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronDown, Clock3, LayoutDashboard, LogOut, Menu, Moon, Sparkles, Sun, User, WalletCards } from 'lucide-react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EmployeeDashboard, PayrollPage, ProfilePage } from '../pages/EmployeePages';
import { EmployeeLeavePage } from '../pages/LeaveManagement';
import { AssistantPage } from '../pages/IntelligencePages';
import { AttendancePage } from '../pages/AttendancePage';
import { NotificationsCenterPage } from '../pages/OperationsPages';
import { employeeService } from '../services/employee';
import '../styles/shell.css';

function useCheckIn() {
  const [today, setToday] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { employeeService.dashboard().then((d) => setToday(d.attendance.today)).catch(() => null); }, []);
  const checkIn = async () => { setLoading(true); try { const r = await employeeService.checkIn(); setToday(r.record); } finally { setLoading(false); } };
  const checkOut = async () => { setLoading(true); try { const r = await employeeService.checkOut(); setToday(r.record); } finally { setLoading(false); } };
  return { today, loading, checkIn, checkOut };
}

function CheckInWidget() {
  const { today, loading, checkIn, checkOut } = useCheckIn();
  const isIn = today?.checkIn && !today?.checkOut;
  const sinceTime = today?.checkIn ? new Date(today.checkIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;
  return (
    <div className="checkin-widget">
      {isIn && <span className="checkin-since">Since {sinceTime}</span>}
      <button className={`checkin-btn ${isIn ? 'checkout' : 'checkin'}`} onClick={() => void (isIn ? checkOut() : checkIn())} disabled={loading}>
        <Clock3 size={14} />
        {isIn ? 'Check Out' : 'Check In'}
      </button>
      {today?.status && <span className={`status-dot ${today.status === 'Present' ? 'green' : 'yellow'}`} title={today.status} />}
    </div>
  );
}

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
          <button onClick={() => { navigate('/profile'); setOpen(false); }}><User size={14} /> My Profile</button>
          <button onClick={() => { setDark(!dark); setOpen(false); }}>{dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Light mode' : 'Dark mode'}</button>
          <hr />
          <button className="danger" onClick={() => { void logout(); setOpen(false); }}><LogOut size={14} /> Sign out</button>
        </div>
      )}
    </div>
  );
}

const nav = [
  ['Dashboard', '/', LayoutDashboard],
  ['Attendance', '/attendance', Clock3],
  ['Time Off', '/leave', CalendarDays],
  ['Payroll', '/payroll', WalletCards],
  ['AI Assistant', '/assistant', Sparkles],
] as const;

export function EmployeeShell() {
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
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={20} /></button>
        </div>
        <nav className={`topnav ${mobileOpen ? 'open' : ''}`}>
          {nav.map(([label, path, Icon]) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={() => setMobileOpen(false)}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <CheckInWidget />
          <button className="icon-button notification" onClick={() => navigate('/notifications')} title="Notifications">
            <Bell size={18} /><i />
          </button>
          <AvatarMenu user={user} logout={logout} dark={dark} setDark={setDark} />
        </div>
      </header>
      <main className="shell-main">
        <div className="content">
          <Routes>
            <Route path="/" element={<EmployeeDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave" element={<EmployeeLeavePage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/notifications" element={<NotificationsCenterPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export function ToastHost() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const handler = (event: Event) => { setMessage((event as CustomEvent<string>).detail); window.setTimeout(() => setMessage(''), 2600); };
    window.addEventListener('dayflow:toast', handler);
    return () => window.removeEventListener('dayflow:toast', handler);
  }, []);
  return message ? <div className="toast" role="status">{message}</div> : null;
}
