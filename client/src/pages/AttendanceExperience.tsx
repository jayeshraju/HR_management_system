import { useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { useHrAttendance } from '../hooks/useHr';
import '../styles/attendance.css';

function fmt(v?: string) { return v ? new Date(v).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'; }
function fmtDate(d: Date) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }

export function HrAttendancePage() {
  const [date, setDate] = useState(() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; });
  const from = new Date(date).toISOString();
  const to = new Date(date.getTime() + 86400000).toISOString();
  const query = useHrAttendance(`?from=${from}&to=${to}`);
  const records = query.data?.records ?? [];
  const std = 8;

  const prevDay = () => setDate(d => new Date(d.getTime() - 86400000));
  const nextDay = () => setDate(d => new Date(d.getTime() + 86400000));

  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">HR Attendance</span>
        <h1>Daily Attendance</h1>
        <p>Track check-ins, check-outs, and hours for all employees.</p>
      </section>
      {/* Day Nav */}
      <div className="month-nav">
        <button onClick={prevDay}><ChevronLeft size={18} /></button>
        <span>{fmtDate(date)}</span>
        <button onClick={nextDay}><ChevronRight size={18} /></button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="eyebrow">{records.length} record{records.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      {/* Summary */}
      <div className="att-summary">
        <div><strong>{records.filter((r: any) => r.status === 'Present').length}</strong><span>Present</span></div>
        <div><strong>{records.filter((r: any) => r.status === 'Absent').length}</strong><span>Absent</span></div>
        <div><strong>{records.filter((r: any) => r.status === 'Leave').length}</strong><span>On Leave</span></div>
        <div><strong>{records.reduce((s: number, r: any) => s + (r.workingHours ?? 0), 0).toFixed(1)}</strong><span>Total Hrs</span></div>
      </div>
      {query.isLoading && <div className="data-state"><LoaderCircle className="spin" size={20} /> Loading attendance...</div>}
      {!query.isLoading && (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th><th>Status</th></tr>
            </thead>
            <tbody>
              {records.length ? records.map((r: any) => {
                const extra = Math.max(0, (r.workingHours ?? 0) - std);
                return (
                  <tr key={r._id}>
                    <td><b>{r.employee?.name ?? '—'}</b><small className="cell-subtitle">{r.employee?.employeeId}</small></td>
                    <td>{fmt(r.checkIn)}</td>
                    <td>{fmt(r.checkOut)}</td>
                    <td>{r.workingHours?.toFixed(2) ?? '—'}</td>
                    <td>{extra > 0 ? <span className="extra-hrs">+{extra.toFixed(2)}</span> : '—'}</td>
                    <td><span className={`status ${r.status?.toLowerCase()}`}>{r.status}</span></td>
                  </tr>
                );
              }) : <tr><td colSpan={6} style={{ textAlign: 'center', color: '#82908a', padding: 32 }}>No attendance records for this day.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
