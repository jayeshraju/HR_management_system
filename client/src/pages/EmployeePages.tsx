import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, FileText, LoaderCircle, MapPin, Pencil, Phone, Plus, WalletCards, X } from 'lucide-react';
import { employeeService, type AttendanceRecord, type DashboardData, type LeaveRequest } from '../services/employee';
import { useAttendance, useDashboard, useEmployeeMutation, useLeave, useNotifications, usePayroll, useProfile } from '../hooks/useEmployee';
import '../styles/employee.css';

function State({ loading, error, children, empty }: { loading: boolean; error: Error | null; children: React.ReactNode; empty?: boolean }) {
  if (loading) return <div className="data-state"><LoaderCircle className="spin" size={20} /> Loading your data...</div>;
  if (error) return <div className="data-state error-state">We could not load this right now. Please refresh and try again.</div>;
  if (empty) return <div className="data-state">{children}</div>;
  return <>{children}</>;
}
function Money({ value }: { value: number }) { return <>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}</>; }
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not set'; }

/* ── Dashboard ──────────────────────────────── */
export function EmployeeDashboard() {
  const query = useDashboard();
  const data = query.data;
  const client = useEmployeeMutation(() => employeeService.checkIn(), [['employee-dashboard'], ['employee-attendance']]);
  const checkout = useEmployeeMutation(() => employeeService.checkOut(), [['employee-dashboard'], ['employee-attendance']]);
  if (!data) return <State loading={query.isLoading} error={query.error as Error | null}>No dashboard data is available yet.</State>;
  const today = data.attendance.today;
  return (
    <State loading={query.isLoading} error={query.error as Error | null}>
      <div className="welcome">
        <div>
          <span className="eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <h1>Good morning, {data.user.name.split(' ')[0]} 👋</h1>
          <p>Your workday, calmly in view.</p>
        </div>
        <button className="primary" onClick={() => void (today?.checkIn ? checkout.mutateAsync() : client.mutateAsync())} disabled={client.isPending || checkout.isPending}>
          <Clock3 size={17} />{today?.checkIn && !today?.checkOut ? 'Check out' : 'Check in'}
        </button>
      </div>
      <div className="metric-grid">
        <article><span>Today's attendance</span><strong>{today?.status ?? 'Not recorded'}</strong><small>{today?.checkIn ? `In since ${new Date(today.checkIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'No check-in yet'}</small></article>
        <article><span>Working hours</span><strong>{data.attendance.workingHoursThisMonth.toFixed(1)} <small>hrs</small></strong><small>This month to date</small></article>
        <article><span>Leave balance</span><strong>{data.leave.balanceConfigured ? 'Available' : '—'}</strong><small>{data.leave.balanceConfigured ? 'Policy configured' : 'No policy configured'}</small></article>
        <article><span>Pending requests</span><strong>{data.pendingRequests}</strong><small>Leave requests</small></article>
        <article><span>Salary</span><strong>{data.salary?.monthlyWage ? <Money value={data.salary.monthlyWage} /> : data.salary ? <Money value={data.salary.netSalary} /> : '—'}</strong><small>{data.salary ? 'Monthly wage' : 'No payroll record'}</small></article>
      </div>
      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Quick actions</span><h2>Keep moving</h2></div></div>
          <div className="quick-actions">
            <Link to="/leave"><CalendarDays size={18} />Apply leave</Link>
            <Link to="/attendance"><Clock3 size={18} />View attendance</Link>
            <Link to="/payroll"><WalletCards size={18} />View payroll</Link>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Notifications</span><h2>Latest updates</h2></div><Link className="text-link" to="/notifications">View all</Link></div>
          {data.notifications.length ? data.notifications.slice(0, 3).map((item) => (
            <div className="event" key={item._id}><b>{item.title}</b><span>{formatDate(item.timestamp)}</span></div>
          )) : <div className="empty-copy">No notifications yet.</div>}
        </article>
      </div>
      <div className="panel activity-panel">
        <div className="panel-heading"><div><span className="eyebrow">Recent activity</span><h2>Your latest requests</h2></div></div>
        {data.recentActivity.length ? data.recentActivity.map((item) => (
          <div className="activity-row" key={item._id}>
            <div><b>{item.leaveType} leave</b><small>{formatDate(item.startDate)} to {formatDate(item.endDate)}</small></div>
            <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
          </div>
        )) : <div className="empty-copy">Your submitted leave requests will appear here.</div>}
      </div>
    </State>
  );
}

/* ── Profile Page ────────────────────────────── */
function EditableField({ value, onSave, placeholder, multiline = false }: { value: string; onSave: (v: string) => void; placeholder: string; multiline?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) return (
    <div className="editable-field">
      <p>{value || <span className="empty-copy">{placeholder}</span>}</p>
      <button className="edit-pencil" onClick={() => { setDraft(value); setEditing(true); }}><Pencil size={13} /></button>
    </div>
  );
  return (
    <div className="editable-field editing">
      {multiline
        ? <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
        : <input value={draft} onChange={(e) => setDraft(e.target.value)} />}
      <div className="edit-actions">
        <button className="primary sm" onClick={() => { onSave(draft); setEditing(false); }}><Check size={13} /></button>
        <button className="secondary sm" onClick={() => setEditing(false)}><X size={13} /></button>
      </div>
    </div>
  );
}

function TagList({ tags, onAdd, onRemove, placeholder }: { tags: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string }) {
  const [val, setVal] = useState('');
  return (
    <div className="tag-list">
      {tags.map((t, i) => <span className="tag" key={i}>{t}<button onClick={() => onRemove(i)}><X size={11} /></button></span>)}
      <div className="tag-input">
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); e.preventDefault(); } }} placeholder={placeholder} />
        <button className="add-tag-btn" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}><Plus size={13} /></button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const query = useProfile();
  const data = query.data;
  const [tab, setTab] = useState<'resume' | 'private'>('resume');
  const mutation = useEmployeeMutation((input: any) => employeeService.updateProfile(input), [['employee-profile'], ['employee-dashboard']]);

  if (!data) return <State loading={query.isLoading} error={query.error as Error | null}>No profile data is available yet.</State>;
  const profile = data.profile;
  const skills: string[] = profile?.skills ?? [];
  const certs: string[] = profile?.certifications ?? [];

  const save = (patch: object) => { mutation.mutate(patch); };

  return (
    <State loading={query.isLoading} error={query.error as Error | null}>
      {/* Header */}
      <div className="profile-top-card panel">
        <div className="profile-avatar-lg">{data.user.name.slice(0, 2).toUpperCase()}</div>
        <div className="profile-top-info">
          <h2>{data.user.name}</h2>
          <span>{profile?.position ?? data.user.role}</span>
          <div className="profile-meta-row">
            {profile?.department && <span>{profile.department}</span>}
            <span>{data.user.email}</span>
            {profile?.phone && <span><Phone size={12} /> {profile.phone}</span>}
          </div>
        </div>
      </div>

      {/* Bio Sections */}
      <div className="bio-grid">
        <article className="panel bio-card">
          <h3>About me</h3>
          <EditableField value={profile?.about ?? ''} placeholder="Write something about yourself..." multiline onSave={(v) => save({ about: v })} />
        </article>
        <article className="panel bio-card">
          <h3>What I love about my job</h3>
          <EditableField value={profile?.whatILove ?? ''} placeholder="What motivates you?" multiline onSave={(v) => save({ whatILove: v })} />
        </article>
        <article className="panel bio-card">
          <h3>My interests & hobbies</h3>
          <EditableField value={profile?.interests ?? ''} placeholder="Interests, hobbies..." multiline onSave={(v) => save({ interests: v })} />
        </article>
      </div>

      {/* Skills & Certifications */}
      <div className="skills-grid">
        <article className="panel">
          <div className="panel-heading"><h2>Skills</h2><Award size={16} /></div>
          <TagList tags={skills} placeholder="+ Add skill" onAdd={(v) => save({ skills: [...skills, v] })} onRemove={(i) => save({ skills: skills.filter((_, idx) => idx !== i) })} />
        </article>
        <article className="panel">
          <div className="panel-heading"><h2>Certifications</h2><FileText size={16} /></div>
          <TagList tags={certs} placeholder="+ Add certification" onAdd={(v) => save({ certifications: [...certs, v] })} onRemove={(i) => save({ certifications: certs.filter((_, idx) => idx !== i) })} />
        </article>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={tab === 'resume' ? 'active' : ''} onClick={() => setTab('resume')}>Resume</button>
        <button className={tab === 'private' ? 'active' : ''} onClick={() => setTab('private')}>Private Info</button>
      </div>

      {tab === 'resume' && (
        <div className="info-grid tab-content">
          <InfoPanel title="Employment information">
            <b>Department</b><span>{profile?.department ?? 'Not set'}</span>
            <b>Position</b><span>{profile?.position ?? 'Not set'}</span>
            <b>Joining date</b><span>{formatDate(profile?.joiningDate)}</span>
            <b>Status</b><span>{data.user.status}</span>
          </InfoPanel>
          <InfoPanel title="Compensation">
            <b>Monthly wage</b><span>{data.compensation?.monthlyWage ? <Money value={data.compensation.monthlyWage} /> : 'No payroll record'}</span>
            <b>Net salary</b><span>{data.compensation ? <Money value={data.compensation.netSalary} /> : '—'}</span>
            <b>Effective date</b><span>{formatDate(data.compensation?.effectiveDate)}</span>
          </InfoPanel>
          <InfoPanel title="Documents">
            {profile?.documents?.length ? profile.documents.map((document: any) => (
              <a className="document-link" href={document.url} key={document.url} target="_blank" rel="noreferrer">{document.name}<ArrowRight size={14} /></a>
            )) : <span className="empty-copy">No documents uploaded.</span>}
          </InfoPanel>
        </div>
      )}

      {tab === 'private' && (
        <div className="tab-content">
          <article className="panel" style={{ maxWidth: 480 }}>
            <h2 style={{ marginBottom: 18, font: '700 17px Manrope' }}>Contact Information</h2>
            <form className="profile-form" onSubmit={(e) => { e.preventDefault(); }}>
              <label><Phone size={15} />Phone<input defaultValue={profile?.phone ?? ''} onBlur={(e) => save({ phone: e.target.value })} placeholder="Add phone number" /></label>
              <label><MapPin size={15} />Address<input defaultValue={profile?.address?.line1 ?? ''} onBlur={(e) => save({ address: { line1: e.target.value } })} placeholder="Add address" /></label>
              <label>Location<input defaultValue={profile?.location ?? ''} onBlur={(e) => save({ location: e.target.value })} placeholder="City, Country" /></label>
            </form>
          </article>
        </div>
      )}
    </State>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) { return <article className="panel info-panel"><h2>{title}</h2>{children}</article>; }

/* ── Attendance Page (Monthly) ────────────────── */
export function AttendancePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const from = new Date(Date.UTC(year, month, 1)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 1)).toISOString();
  const query = useAttendance(`?from=${from}&to=${to}`);
  const checkIn = useEmployeeMutation(() => employeeService.checkIn(), [['employee-attendance'], ['employee-dashboard']]);
  const checkOut = useEmployeeMutation(() => employeeService.checkOut(), [['employee-attendance'], ['employee-dashboard']]);
  const monthLabel = new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const records = query.data?.records ?? [];
  const present = records.filter((r: AttendanceRecord) => ['Present', 'Half-day'].includes(r.status)).length;
  const leaves = records.filter((r: AttendanceRecord) => r.status === 'Leave').length;
  const workingDays = records.length;
  const std = 8;
  return (
    <State loading={query.isLoading} error={query.error as Error | null}>
      <section className="page-heading"><span className="eyebrow">Attendance</span><h1>Your attendance</h1><p>Monthly record of your workdays and hours.</p></section>
      {/* Month Nav */}
      <div className="month-nav">
        <button onClick={prevMonth}><ChevronLeft size={18} /></button>
        <span>{monthLabel}</span>
        <button onClick={nextMonth}><ChevronRight size={18} /></button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="primary" onClick={() => void checkIn.mutateAsync()} disabled={checkIn.isPending}><Clock3 size={14} /> Check in</button>
          <button className="secondary" onClick={() => void checkOut.mutateAsync()} disabled={checkOut.isPending}>Check out</button>
        </div>
      </div>
      {/* Summary */}
      <div className="att-summary">
        <div><strong>{present}</strong><span>Days Present</span></div>
        <div><strong>{leaves}</strong><span>Leaves Taken</span></div>
        <div><strong>{workingDays}</strong><span>Total Working Days</span></div>
        <div><strong>{query.data?.insights?.totalWorkingHours?.toFixed(1) ?? '—'}</strong><span>Total Hours</span></div>
      </div>
      {records.length ? (
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th></tr></thead>
            <tbody>
              {records.map((record: AttendanceRecord) => {
                const extra = Math.max(0, (record.workingHours ?? 0) - std);
                return (
                  <tr key={record._id}>
                    <td>{formatDate(record.date)}</td>
                    <td><span className={`status ${record.status.toLowerCase().replace('-', '')}`}>{record.status}</span></td>
                    <td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                    <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                    <td>{record.workingHours?.toFixed(2) ?? '—'}</td>
                    <td>{extra > 0 ? <span className="extra-hrs">+{extra.toFixed(2)}</span> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty-copy" style={{ padding: 32 }}>No attendance records for this month.</div>
      )}
    </State>
  );
}

/* ── Leave Page ───────────────────────────────── */
export function LeavePage() {
  const query = useLeave();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('Paid');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const mutation = useEmployeeMutation((input: any) => employeeService.applyLeave(input), [['employee-leave'], ['employee-dashboard']]);
  const days = start && end ? Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1) : 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ leaveType: type, startDate: start, endDate: end, reason }, { onSuccess: () => { setOpen(false); setReason(''); } });
  };
  return (
    <State loading={query.isLoading} error={query.error as Error | null}>
      <section className="page-heading">
        <span className="eyebrow">Leave</span><h1>Leave requests</h1><p>Submit and track your time away.</p>
        <button className="primary" onClick={() => setOpen(!open)}><CalendarDays size={16} />{open ? 'Close form' : 'Apply for leave'}</button>
      </section>
      {open && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>New Time Off Request</h2><button onClick={() => setOpen(false)}><X size={18} /></button></div>
            <form onSubmit={submit}>
              <label>Time Off Type<select value={type} onChange={(e) => setType(e.target.value)}><option>Paid</option><option>Sick</option><option>Unpaid</option></select></label>
              <label>Start Date<input required type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label>End Date<input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              {days > 0 && <div className="allocation-badge">{days} day{days !== 1 ? 's' : ''} allocated</div>}
              <label>Reason<textarea required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={3} /></label>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setOpen(false)}>Discard</button>
                <button className="primary" disabled={mutation.isPending}>Submit <ArrowRight size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
      {query.data?.requests.length ? (
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {query.data.requests.map((item: LeaveRequest) => {
                const d = Math.floor((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / 86400000) + 1;
                return (
                  <tr key={item._id}>
                    <td>{item.leaveType}</td>
                    <td>{formatDate(item.startDate)} → {formatDate(item.endDate)}</td>
                    <td>{d}</td>
                    <td>{item.reason}</td>
                    <td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="panel empty-copy" style={{ padding: 32 }}>No leave requests yet.</div>}
    </State>
  );
}

/* ── Payroll Page ─────────────────────────────── */
export function PayrollPage() {
  const query = usePayroll();
  const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
  return (
    <State loading={query.isLoading} error={query.error as Error | null} empty={!query.data?.records.length}>
      <section className="page-heading"><span className="eyebrow">Payroll</span><h1>Salary summary</h1><p>Your compensation records.</p></section>
      {query.data?.records.length ? (
        <div className="payroll-grid">
          {query.data.records.map((item: any) => (
            <article className="panel" key={item._id}>
              <span className="eyebrow">Effective {formatDate(item.effectiveDate)}</span>
              <h2>{item.monthlyWage ? inr(item.monthlyWage) : inr(item.netSalary)} <small>/mo</small></h2>
              <div className="payroll-lines">
                {item.basicSalary != null && <span>Basic <b>{inr(item.basicSalary)}</b></span>}
                {item.hra != null && <span>HRA <b>{inr(item.hra)}</b></span>}
                {item.performanceBonus != null && <span>Perf. Bonus <b>{inr(item.performanceBonus)}</b></span>}
                <span>Gross <b>{inr(item.grossSalary)}</b></span>
                <span>Net Pay <b>{inr(item.netSalary)}</b></span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="page-heading"><h1>Salary summary</h1><p>No payroll records are available yet.</p></section>
      )}
    </State>
  );
}

/* ── Notifications Page ───────────────────────── */
export function NotificationsPage() {
  const query = useNotifications();
  return (
    <State loading={query.isLoading} error={query.error as Error | null} empty={!query.data?.notifications.length}>
      <section className="page-heading"><span className="eyebrow">Notifications</span><h1>Notifications</h1><p>Updates relevant to your workday.</p></section>
      {query.data?.notifications.length ? (
        <div className="notification-list">
          {query.data.notifications.map((item: any) => (
            <article className="panel notification-row" key={item._id}>
              <div><span className="eyebrow">{item.type}</span><h2>{item.title}</h2><p>{item.message}</p></div>
              <time>{formatDate(item.timestamp)}</time>
            </article>
          ))}
        </div>
      ) : <div className="panel empty-copy">You're all caught up.</div>}
    </State>
  );
}
