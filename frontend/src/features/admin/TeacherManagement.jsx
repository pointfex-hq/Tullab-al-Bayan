import React, { useEffect, useRef, useState } from 'react'
import { EmptyState, LoadingState, Notice, PageHeader } from '../../components/ui.jsx'
import {
  approveTeacher,
  listTeacherAuditLogs,
  listTeacherManagementAccounts,
  revokeTeacher,
  updateTeacher,
} from './teacherRepository.js'

const auditFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short',
})

const ACTION_LABELS = {
  approve_teacher: 'Approved as teacher',
  revoke_teacher: 'Teacher access revoked',
  update_teacher: 'Teacher details updated',
}

function AccountList({ title, accounts, empty, onApprove, onEdit, onRevoke }) {
  return (
    <section className="panel">
      <div className="panel-head"><h2>{title}</h2></div>
      {accounts.length ? (
        <ul className="divide-y">
          {accounts.map(account => (
            <li key={account.user_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 break-words">
                <p className="font-medium">{account.full_name || 'Name unavailable'}</p>
                <p className="text-sm text-muted">{account.email}</p>
                {account.staff_code && <p className="text-sm">Staff code {account.staff_code}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {onApprove && <button type="button" className="btn btn-primary btn-sm"
                  onClick={() => onApprove(account)}>Approve as Teacher</button>}
                {onEdit && <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => onEdit(account)}>Edit</button>}
                {onRevoke && <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => onRevoke(account)}>Revoke teacher access</button>}
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState>{empty}</EmptyState>}
    </section>
  )
}

function TeacherDialog({ mode, account, onCancel, onSaved }) {
  const dialog = useRef(null)
  const [name, setName] = useState(account.full_name ?? '')
  const [staffCode, setStaffCode] = useState(account.staff_code ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const approval = mode === 'approve'
  const editing = mode === 'edit'
  const title = approval ? 'Approve as Teacher'
    : editing ? 'Edit teacher details' : 'Revoke teacher access'

  useEffect(() => { dialog.current.showModal() }, [])

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if ((approval || editing) && !name.trim()) {
      setError('Enter the verified name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (approval) await approveTeacher(account.user_id, name, staffCode)
      else if (editing) await updateTeacher(account.user_id, name, staffCode)
      else await revokeTeacher(account.user_id)
      const notice = approval ? 'Teacher access approved.'
        : editing ? 'Teacher details updated.' : 'Teacher access revoked.'
      onSaved(notice)
    } catch (failure) {
      setError(failure?.message || 'The account change could not be saved.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="dialog max-w-lg" aria-labelledby="teacher-action-title"
      onCancel={event => { event.preventDefault(); if (!saving) onCancel() }}>
      <form className="grid gap-4 p-5" onSubmit={submit}>
        <h2 id="teacher-action-title" className="font-semibold">{title}</h2>
        <p className="break-words">{account.full_name || account.email}{account.full_name && account.email ? ' (' + account.email + ')' : ''}</p>
        {approval || editing ? <>
          <label className="grid gap-1">Verified name
            <input className="field" required value={name} disabled={saving} onChange={event => setName(event.target.value)} />
          </label>
          <label className="grid gap-1">Staff code (optional)
            <input className="field" value={staffCode} disabled={saving} onChange={event => setStaffCode(event.target.value)} />
          </label>
        </> : <p>Revoking access preserves the teacher’s existing homework and attendance records.</p>}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : title}</button>
        </div>
      </form>
    </dialog>
  )
}

function TeacherAudit({ revision }) {
  const [state, setState] = useState({ rows: null, error: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ rows: null, error: '' })
    listTeacherAuditLogs().then(
      rows => { if (active) setState({ rows, error: '' }) },
      failure => { if (active) setState({ rows: [], error: failure?.message || 'Teacher access history could not be loaded.' }) },
    )
    return () => { active = false }
  }, [revision, attempt])

  return (
    <section className="panel">
      <div className="panel-head"><h2>Teacher access history</h2></div>
      {state.error ? <Notice tone="error" action={<button type="button" className="btn btn-secondary btn-sm"
        onClick={() => setAttempt(value => value + 1)}>Try again</button>}>{state.error}</Notice>
        : !state.rows ? <LoadingState>Loading teacher access history…</LoadingState>
          : state.rows.length ? <ul className="divide-y">
            {state.rows.map(row => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 break-words">
                  <p className="font-medium">{ACTION_LABELS[row.action] ?? row.action}: {row.target_name}</p>
                  <p className="text-sm text-muted">By {row.actor_name}</p>
                  {row.details?.staff_code && <p className="text-sm">Staff code {row.details.staff_code}</p>}
                </div>
                <p className="text-sm text-muted">{auditFormat.format(new Date(row.created_at))}</p>
              </li>
            ))}
          </ul>
            : <EmptyState>No teacher access changes have been recorded yet.</EmptyState>}
    </section>
  )
}

export default function TeacherManagement() {
  const [accounts, setAccounts] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selection, setSelection] = useState(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    listTeacherManagementAccounts().then(
      data => { if (active) setAccounts(data) },
      failure => { if (active) setError(failure?.message || 'Teacher accounts could not be loaded.') },
    )
    return () => { active = false }
  }, [revision])

  function reload() {
    setAccounts(null)
    setError('')
    setRevision(value => value + 1)
  }

  return <>
    <PageHeader title="Teacher Management" description="Verify Google accounts before granting teacher access." />
    {message && <p className="mb-4" role="status">{message}</p>}
    {error ? <Notice tone="error" action={<button type="button" className="btn btn-secondary btn-sm" onClick={reload}>Try again</button>}>{error}</Notice>
      : !accounts ? <LoadingState /> : <div className="grid gap-4">
        <AccountList title="Pending Google accounts" accounts={accounts.pending} empty="No pending Google accounts."
          onApprove={account => setSelection({ mode: 'approve', account })} />
        <AccountList title="Approved teachers" accounts={accounts.teachers} empty="No approved teachers."
          onEdit={account => setSelection({ mode: 'edit', account })}
          onRevoke={account => setSelection({ mode: 'revoke', account })} />
      </div>}
    <div className="mt-4"><TeacherAudit revision={revision} /></div>
    {selection && <TeacherDialog {...selection} onCancel={() => setSelection(null)} onSaved={notice => {
      setMessage(notice)
      setSelection(null)
      reload()
    }} />}
  </>
}
