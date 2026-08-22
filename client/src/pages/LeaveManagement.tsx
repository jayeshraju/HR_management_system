import { FormEvent, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ClipboardList, LoaderCircle, X } from 'lucide-react';
import { useLeave, useEmployeeMutation } from '../hooks/useEmployee';
import { useHrLeave, useLeaveDecision } from '../hooks/useLeaveManagement';
import { employeeService, type LeaveRequest } from '../services/employee';
import '../styles/leave.css';

function DateText({ value }: { value: string }) { return <>{new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</>; }

/* ── Employee Leave Page ─────────────────────── */
function BalanceCards({ balances }: { balances?: Record<string, { limit: number | null; used: number; available: number | null }> }) {
  return (
    <div className="balance-grid">
      {['Paid', 'Sick', 'Unpaid'].map((type) => {
        const balance = balances?.[type];
        return (
          <article className="panel balance-card" key={type}>
            <span className="eyebrow">{type} Leave</span>
            <strong>{balance?.available === null ? '∞' : balance?.available ?? '—'}</strong>
            <small>{balance ? `${balance.used} used of ${balance.limit ?? 'unlimited'}` : 'Loading policy'}</small>
          </article>
        );
      })}
    </div>
  );
}

export function EmployeeLeavePage() {
  const query = useLeave();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'Paid' | 'Sick' | 'Unpaid'>('Paid');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const mutation = useEmployeeMutation((input: any) => employeeService.applyLeave(input), [['employee-leave'], ['employee-dashboard']]);
  const days = start && end ? Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1) : 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ leaveType: type, startDate: start, endDate: end, reason, remarks: remarks || undefined }, { onSuccess: () => { setOpen(false); setReason(''); setRemarks(''); } });
  };
  if (query.isLoading) return <div className="data-state"><LoaderCircle className="spin" size={20} /> Loading leave data...</div>;
  if (query.error) return <div className="data-state error-state">Leave data could not be loaded. Please try again.</div>;
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">Leave</span>
        <h1>Time Off</h1>
        <p>Plan time away and track every request.</p>
        <button className="primary" onClick={() => setOpen(!open)}><CalendarDays size={16} />{open ? 'Close' : 'New Time Off'}</button>
      </section>
      <BalanceCards balances={query.data?.balances} />
      {/* Modal */}
      {open && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2><CalendarDays size={18} /> New Time Off Request</h2>
              <button onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="modal-form">
              <label>Time Off Type
                <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                  <option>Paid</option><option>Sick</option><option>Unpaid</option>
                </select>
              </label>
              <div className="modal-row">
                <label>Start Date<input required type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
                <label>End Date<input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              </div>
              {days > 0 && <div className="allocation-badge"><CalendarDays size={13} /> {days} day{days !== 1 ? 's' : ''} allocated</div>}
              <label>Reason <textarea required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={3} /></label>
              <label>Remarks (optional)<textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={1000} rows={2} /></label>
              {mutation.error && <p className="form-error">{(mutation.error as Error).message}</p>}
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setOpen(false)}>Discard</button>
                <button className="primary" disabled={mutation.isPending}>Submit <ArrowRight size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Requests Table */}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th>HR Comment</th></tr></thead>
          <tbody>
            {query.data?.requests.length ? query.data.requests.map((request: LeaveRequest) => {
              const d = Math.floor((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / 86400000) + 1;
              return (
                <tr key={request._id}>
                  <td>{request.leaveType}</td>
                  <td><DateText value={request.startDate} /> → <DateText value={request.endDate} /></td>
                  <td>{d}</td>
                  <td>{request.reason}</td>
                  <td><span className={`status ${request.status.toLowerCase()}`}>{request.status}</span></td>
                  <td>{request.hrComment ?? '—'}</td>
                </tr>
              );
            }) : <tr><td colSpan={6}>No leave requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── HR Leave Page ────────────────────────────── */
export function HrLeavePage() {
  const [status, setStatus] = useState('Pending');
  const [leaveType, setLeaveType] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [comment, setComment] = useState<Record<string, string>>({});
  const queryString = new URLSearchParams(Object.entries({ status, leaveType, employeeId }).filter(([, value]) => value)).toString();
  const query = useHrLeave(queryString ? `?${queryString}` : '');
  const decision = useLeaveDecision();
  const requests = query.data?.requests ?? [];
  const paidCount = requests.filter((r: any) => r.leaveType === 'Paid' && r.status === 'Approved').length;
  const sickCount = requests.filter((r: any) => r.leaveType === 'Sick' && r.status === 'Approved').length;
  const unpaidCount = requests.filter((r: any) => r.leaveType === 'Unpaid' && r.status === 'Approved').length;
  if (query.isLoading) return <div className="data-state"><LoaderCircle className="spin" size={20} /> Loading requests...</div>;
  if (query.error) return <div className="data-state error-state">Leave requests could not be loaded.</div>;
  return (
    <>
      <section className="page-heading"><span className="eyebrow">HR leave approvals</span><h1>Time Off Approvals</h1><p>Review and decide employee time-off requests.</p></section>
      {/* Summary Boxes */}
      <div className="leave-summary-boxes">
        <div className="leave-summary-box paid"><span>Paid Time Off</span><strong>24 days</strong><small>Annual limit</small></div>
        <div className="leave-summary-box sick"><span>Sick Leave</span><strong>7 days</strong><small>Annual limit</small></div>
        <div className="leave-summary-box approved"><span>Approved this period</span><strong>{paidCount + sickCount + unpaidCount}</strong><small>requests</small></div>
        <div className="leave-summary-box pending"><span>Pending review</span><strong>{requests.filter((r: any) => r.status === 'Pending').length}</strong><small>needs action</small></div>
      </div>
      {/* Filters */}
      <div className="panel hr-filters">
        <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>Pending</option><option>Approved</option><option>Rejected</option><option value="">All statuses</option></select></label>
        <label>Type<select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}><option value="">All types</option><option>Paid</option><option>Sick</option><option>Unpaid</option></select></label>
        <label>Employee ID<input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-1042" /></label>
      </div>
      {/* Table */}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Start</th><th>End</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {requests.length ? requests.map((request: any) => (
              <tr key={request._id}>
                <td><b>{request.employee?.name}</b><small className="cell-subtitle">{request.employee?.employeeId}</small></td>
                <td><DateText value={request.startDate} /></td>
                <td><DateText value={request.endDate} /></td>
                <td>{request.leaveType}</td>
                <td><span className={`status ${request.status.toLowerCase()}`}>{request.status}</span></td>
                <td>
                  {request.status === 'Pending' ? (
                    <div className="approve-actions">
                      <button className="approve-btn" disabled={decision.isPending} onClick={() => decision.mutate({ id: request._id, status: 'Approved', hrComment: comment[request._id] })} title="Approve"><Check size={15} /></button>
                      <button className="reject-btn" disabled={decision.isPending} onClick={() => decision.mutate({ id: request._id, status: 'Rejected', hrComment: comment[request._id] })} title="Reject"><X size={15} /></button>
                    </div>
                  ) : '—'}
                </td>
              </tr>
            )) : <tr><td colSpan={6}>No requests match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
