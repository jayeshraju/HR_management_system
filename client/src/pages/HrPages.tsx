import { FormEvent, useState } from 'react';
import { ArrowRight, Award, Briefcase, Check, ChevronLeft, ChevronRight, LoaderCircle, Pencil, Plus, Search, UserRound, Users, WalletCards, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEmployee, useEmployeeMutationHr, useEmployees, useEmployeeStatus, useHrDashboard, useHrPayroll, useLeaveMutationHr, useHrLeave, useHrAttendance, usePayrollMutation, useSalaryInfoMutation } from '../hooks/useHr';
import { useAnalytics, useAssistant } from '../hooks/useIntelligence';
import '../styles/hr.css';

function Load({ loading, error }: { loading: boolean; error: unknown }) {
  if (loading) return <div className="data-state"><LoaderCircle className="spin" size={20} /> Loading workspace data...</div>;
  if (error) return <div className="data-state error-state">This data could not be loaded. Please try again.</div>;
  return null;
}

/* ── HR Dashboard ─────────────────────────────── */
export function HrDashboardPage() {
  const query = useHrDashboard();
  const data = query.data;
  if (!data) return <Load loading={query.isLoading} error={query.error} />;
  return (
    <>
      <section className="page-heading"><span className="eyebrow">HR command center</span><h1>Workforce, in focus.</h1></section>
      <div className="kpi-grid">
        {Object.entries(data.kpis).map(([label, value]) => (
          <article className="panel kpi-card" key={label}>
            <span>{label.replace(/([A-Z])/g, ' $1')}</span>
            <strong>{String(value)}</strong>
            <small>Live from Dayflow</small>
          </article>
        ))}
      </div>
    </>
  );
}

/* ── Employees Card Grid ─────────────────────── */
export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const query = useEmployees(search ? `?search=${encodeURIComponent(search)}` : '');
  const statusQuery = useEmployeeStatus();
  const navigate = useNavigate();
  const presentSet = new Set<string>(statusQuery.data?.presentIds ?? []);
  const onLeaveSet = new Set<string>(statusQuery.data?.onLeaveIds ?? []);

  function statusDot(id: string) {
    if (presentSet.has(id)) return <span className="emp-dot present" title="Present today" />;
    if (onLeaveSet.has(id)) return <span className="emp-dot on-leave" title="On leave" />;
    return <span className="emp-dot absent" title="Absent" />;
  }

  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">People</span>
        <h1>Employees</h1>
        <p>Manage and view your team members.</p>
      </section>
      <div className="directory-toolbar">
        <div className="search-field"><Search size={15} /><input placeholder="Search name, ID, or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>
      <Load loading={query.isLoading} error={query.error} />
      {query.data && (
        query.data.employees.length ? (
          <div className="emp-grid">
            {query.data.employees.map((emp: any) => (
              <article className="emp-card" key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)}>
                <div className="emp-card-top">
                  <div className="emp-avatar">{emp.name.slice(0, 2).toUpperCase()}</div>
                  {statusDot(emp.id)}
                </div>
                <h3>{emp.name}</h3>
                <span className="emp-role">{emp.profile?.position ?? emp.profile?.department ?? emp.role}</span>
                <span className="emp-id">{emp.employeeId}</span>
                <div className="emp-card-footer">
                  <span className={`status ${emp.status}`}>{emp.status}</span>
                  <ArrowRight size={14} className="emp-arrow" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel empty-copy" style={{ padding: '40px', textAlign: 'center' }}>No employees match this search.</div>
        )
      )}
    </>
  );
}

/* ── Employee Detail / Profile ────────────────── */
export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const query = useEmployee(id);
  const mutation = useEmployeeMutationHr();
  const salaryMutation = useSalaryInfoMutation();
  const payrollQuery = useHrPayroll(id);
  const [tab, setTab] = useState<'resume' | 'private' | 'salary'>('resume');
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPos, setEditPos] = useState('');
  // Salary Info
  const [monthlyWage, setMonthlyWage] = useState('');
  const [workDays, setWorkDays] = useState('5');
  const [breakTime, setBreakTime] = useState('1');
  const [effectiveDate, setEffectiveDate] = useState('');
  const data = query.data;
  if (!data) return <Load loading={query.isLoading} error={query.error} />;
  const payroll = payrollQuery.data?.records?.[0];
  const comps = payroll ? [
    { label: 'Basic (50%)', value: payroll.basicSalary ?? Math.round((payroll.monthlyWage ?? 0) * 0.5) },
    { label: 'HRA', value: payroll.hra ?? 0 },
    { label: 'Standard Allowance', value: payroll.standardAllowance ?? 4167 },
    { label: 'Performance Bonus', value: payroll.performanceBonus ?? 0 },
    { label: 'LTA', value: payroll.lta ?? 0 },
    { label: 'Fixed Allowance', value: payroll.fixedAllowance ?? 0 },
  ] : [];
  const deductions = payroll ? [
    { label: 'Employee PF (12%)', value: payroll.employeePf ?? 0 },
    { label: 'Employer PF (12%)', value: payroll.employerPf ?? 0 },
    { label: 'Professional Tax', value: payroll.professionalTax ?? 200 },
  ] : [];
  const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
  return (
    <>
      <section className="page-heading">
        <Link className="text-link back-link" to="/employees"><ChevronLeft size={15} /> Back to employees</Link>
        <h1>{data.employee.name}</h1>
        <p>{data.employee.employeeId} · {data.employee.email}</p>
      </section>
      {/* Top Profile Card */}
      <div className="profile-top-card panel">
        <div className="profile-avatar-lg">{data.employee.name.slice(0, 2).toUpperCase()}</div>
        <div className="profile-top-info">
          <h2>{data.employee.name}</h2>
          <span>{data.profile?.position ?? '—'}</span>
          <div className="profile-meta-row">
            {data.profile?.department && <span><Briefcase size={13} /> {data.profile.department}</span>}
            {data.employee.email && <span>{data.employee.email}</span>}
            <span className={`status ${data.employee.status}`}>{data.employee.status}</span>
          </div>
        </div>
        <form className="inline-edit-form" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ id, data: { name: editName || undefined, department: editDept || undefined, position: editPos || undefined } }); }}>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={data.employee.name} />
          <input value={editDept} onChange={(e) => setEditDept(e.target.value)} placeholder={data.profile?.department ?? 'Department'} />
          <input value={editPos} onChange={(e) => setEditPos(e.target.value)} placeholder={data.profile?.position ?? 'Position'} />
          <button className="primary" disabled={mutation.isPending}><Check size={14} /> Save</button>
        </form>
      </div>
      {/* Tabs */}
      <div className="profile-tabs">
        <button className={tab === 'resume' ? 'active' : ''} onClick={() => setTab('resume')}><UserRound size={14} /> Resume</button>
        <button className={tab === 'private' ? 'active' : ''} onClick={() => setTab('private')}><Users size={14} /> Private Info</button>
        <button className={tab === 'salary' ? 'active' : ''} onClick={() => setTab('salary')}><WalletCards size={14} /> Salary Info</button>
      </div>
      {/* Resume Tab */}
      {tab === 'resume' && (
        <div className="tab-content">
          <div className="info-grid">
            <article className="panel info-panel">
              <h2>Leave history</h2>
              {data.leave?.length ? data.leave.slice(0, 8).map((item: any) => (
                <span key={item._id}>{item.leaveType} · <b>{item.status}</b> · {new Date(item.startDate).toLocaleDateString()}</span>
              )) : <span className="empty-copy">No leave records.</span>}
            </article>
            <article className="panel info-panel">
              <h2>Attendance (last 30 days)</h2>
              {data.attendance?.length ? data.attendance.slice(0, 8).map((item: any) => (
                <span key={item._id}>{new Date(item.date).toLocaleDateString()} · <b>{item.status}</b></span>
              )) : <span className="empty-copy">No attendance records.</span>}
            </article>
            <article className="panel info-panel">
              <h2>Payroll history</h2>
              {data.payroll?.length ? data.payroll.slice(0, 5).map((item: any) => (
                <span key={item._id}>{item.monthlyWage ? inr(item.monthlyWage) : `$${item.netSalary?.toLocaleString()}`} · {new Date(item.effectiveDate).toLocaleDateString()}</span>
              )) : <span className="empty-copy">No payroll records.</span>}
            </article>
          </div>
        </div>
      )}
      {/* Private Info Tab */}
      {tab === 'private' && (
        <div className="tab-content">
          <div className="panel info-panel" style={{ maxWidth: 520 }}>
            <h2>Personal Details</h2>
            <span>Employee ID <b>{data.employee.employeeId}</b></span>
            <span>Email <b>{data.employee.email}</b></span>
            <span>Phone <b>{data.profile?.phone ?? '—'}</b></span>
            <span>Status <b>{data.employee.status}</b></span>
            <span>Joining Date <b>{data.profile?.joiningDate ? new Date(data.profile.joiningDate).toLocaleDateString() : '—'}</b></span>
            <span>Location <b>{data.profile?.location ?? '—'}</b></span>
          </div>
        </div>
      )}
      {/* Salary Info Tab */}
      {tab === 'salary' && (
        <div className="tab-content">
          <div className="salary-info-grid">
            <form className="panel salary-form" onSubmit={(e) => { e.preventDefault(); salaryMutation.mutate({ employeeId: id, data: { monthlyWage: Number(monthlyWage) || payroll?.monthlyWage, workingDaysPerWeek: Number(workDays), breakTimeHrs: Number(breakTime), effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10) } }); }}>
              <h2>Salary Configuration</h2>
              <label>Monthly Wage (₹)<input type="number" min="0" value={monthlyWage || payroll?.monthlyWage || ''} onChange={(e) => setMonthlyWage(e.target.value)} placeholder="e.g. 50000" /></label>
              <label>Yearly Wage (auto)<input readOnly value={monthlyWage ? inr(Number(monthlyWage) * 12) : payroll?.yearlyWage ? inr(payroll.yearlyWage) : '—'} /></label>
              <label>Working Days/Week<input type="number" min="1" max="7" value={workDays} onChange={(e) => setWorkDays(e.target.value)} /></label>
              <label>Break Time (hrs)<input type="number" min="0" step="0.5" value={breakTime} onChange={(e) => setBreakTime(e.target.value)} /></label>
              <label>Effective Date<input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></label>
              <button className="primary" disabled={salaryMutation.isPending}><Check size={14} /> Save Salary Info</button>
            </form>
            <div className="panel salary-breakdown">
              <h2>Salary Breakdown</h2>
              {payroll ? (
                <>
                  <div className="salary-section-title">Earnings</div>
                  {comps.map((c) => <div className="salary-row" key={c.label}><span>{c.label}</span><b>{inr(c.value)}</b></div>)}
                  <div className="salary-row total"><span>Gross Total</span><b>{inr(payroll.grossSalary ?? payroll.monthlyWage ?? 0)}</b></div>
                  <div className="salary-section-title deduction">Deductions</div>
                  {deductions.map((d) => <div className="salary-row" key={d.label}><span>{d.label}</span><b>- {inr(d.value)}</b></div>)}
                  <div className="salary-row net"><span>Net Pay</span><b>{inr(payroll.netSalary ?? 0)}</b></div>
                </>
              ) : (
                <p className="empty-copy">No salary data yet. Save a configuration above.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── HR Payroll Page ──────────────────────────── */
export function HrPayrollPage() {
  const [employeeId, setEmployeeId] = useState('');
  const query = useHrPayroll(employeeId);
  const mutation = usePayrollMutation();
  const [basic, setBasic] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  return (
    <>
      <section className="page-heading"><span className="eyebrow">Payroll management</span><h1>Compensation records</h1><p>Review salary history and publish a new effective structure.</p></section>
      <div className="payroll-toolbar"><label>Employee ID<input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Filter employee" /></label></div>
      <Load loading={query.isLoading} error={query.error} />
      {query.data && (
        <>
          <div className="panel table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Effective</th><th>Monthly</th><th>Gross</th><th>Net</th></tr></thead>
              <tbody>
                {query.data.records.length ? query.data.records.map((record: any) => (
                  <tr key={record._id}>
                    <td>{record.employee?.name}<small className="cell-subtitle">{record.employee?.employeeId}</small></td>
                    <td>{new Date(record.effectiveDate).toLocaleDateString()}</td>
                    <td>{record.monthlyWage ? `₹${record.monthlyWage.toLocaleString('en-IN')}` : '—'}</td>
                    <td>₹{(record.grossSalary ?? 0).toLocaleString('en-IN')}</td>
                    <td>₹{(record.netSalary ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                )) : <tr><td colSpan={5}>No payroll records found.</td></tr>}
              </tbody>
            </table>
          </div>
          <form className="panel payroll-form" onSubmit={(e) => { e.preventDefault(); if (!employeeId) return; mutation.mutate({ employeeId, data: { basicSalary: basic, allowances, deductions, effectiveDate } }); }}>
            <h2>Update salary structure</h2>
            <label>Employee user ID<input required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /></label>
            <label>Basic salary<input required type="number" min="0" value={basic} onChange={(e) => setBasic(e.target.value)} /></label>
            <label>Allowances<input required type="number" min="0" value={allowances} onChange={(e) => setAllowances(e.target.value)} /></label>
            <label>Deductions<input required type="number" min="0" value={deductions} onChange={(e) => setDeductions(e.target.value)} /></label>
            <label>Effective date<input required type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></label>
            <button className="primary" disabled={mutation.isPending}>Save payroll record <WalletCards size={15} /></button>
          </form>
        </>
      )}
    </>
  );
}
