import React, { useEffect, useRef, useState } from 'react'
import { GraduationCap, Link2, RotateCcw, UserRoundCheck, X, XCircle } from 'lucide-react'
import { EmptyState, Notice, PageHeader, Person, SkeletonRows, useToast } from '../../components/ui.jsx'
import { listBatches } from './batchRepository.js'
import { approveTeacher } from './teacherRepository.js'
import { linkStudentAccount, listRoster } from '../roster/rosterRepository.js'
import { approveAsStudent, listAccessRequests, rejectAccessRequest, restoreAccessRequest } from './accessRequestRepository.js'

const requestedFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })

function displayName(request) {
  return request.fullName || request.email || 'Google account'
}

function canonicalEmail(value) {
  const email = (value ?? '').trim().toLowerCase()
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (domain === 'gmail.com' || domain === 'googlemail.com') return local.split('+')[0].replaceAll('.', '') + '@gmail.com'
  return email
}

function useModal() {
  const dialog = useRef(null)
  useEffect(() => { dialog.current.showModal() }, [])
  return dialog
}

function DialogHeader({ id, title, request, onClose, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id}>{title}</h2>
        <p className="mt-1 break-words text-sm text-muted">{displayName(request)}{request.fullName && request.email ? ` (${request.email})` : ''}</p>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" disabled={disabled} onClick={onClose}><X size={18} /></button>
    </div>
  )
}

function ApproveStudentDialog({ request, batches, onCancel, onSaved }) {
  const dialog = useModal()
  const [fields, setFields] = useState({
    studentCode: '',
    fullName: request.fullName,
    batchId: batches[0]?.id ?? '',
    defaultMonthlyFee: '',
    defaultScholarshipPercent: 0,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const change = (key, value) => { setFields(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined, form: undefined })) }
  const error = key => errors[key] && <span className="field-error">{errors[key]}</span>

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const result = await approveAsStudent(request.userId, fields)
      if (result.errors) { setErrors(result.errors); setSaving(false) }
      else onSaved(`${fields.fullName.trim()} was added as a student and can sign in now.`)
    } catch {
      setErrors({ form: 'The request could not be approved. Try again.' })
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="dialog max-w-2xl" aria-labelledby="approve-student-title"
      onCancel={event => { event.preventDefault(); if (!saving) onCancel() }}>
      <DialogHeader id="approve-student-title" title="Approve as a new student" request={request} onClose={onCancel} disabled={saving} />
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <label className="label">Student ID
          <input className="field" value={fields.studentCode} disabled={saving} aria-invalid={Boolean(errors.studentCode)} onChange={event => change('studentCode', event.target.value)} placeholder="SAT-001" />
          {error('studentCode')}
        </label>
        <label className="label">Full name
          <input className="field" value={fields.fullName} disabled={saving} aria-invalid={Boolean(errors.fullName)} onChange={event => change('fullName', event.target.value)} />
          {error('fullName')}
        </label>
        <label className="label sm:col-span-2">Google email
          <input className="field" type="email" value={request.email} readOnly disabled />
          <span className="field-hint">The student record uses the Google account that asked for access.</span>
        </label>
        <label className="label">Batch
          <select className="field" value={fields.batchId} disabled={saving} onChange={event => change('batchId', event.target.value)}>
            {batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
          {error('batchId')}
        </label>
        <label className="label">Monthly fee (BDT)
          <input className="field" type="number" min="0" step="0.01" value={fields.defaultMonthlyFee} disabled={saving} aria-invalid={Boolean(errors.defaultMonthlyFee)} onChange={event => change('defaultMonthlyFee', event.target.value)} placeholder="Not set" />
          {error('defaultMonthlyFee')}
        </label>
        <label className="label">Scholarship
          <select className="field" value={fields.defaultScholarshipPercent} disabled={saving} onChange={event => change('defaultScholarshipPercent', event.target.value)}>
            {[0, 50, 100].map(value => <option key={value} value={value}>{value === 0 ? 'None' : `${value}%`}</option>)}
          </select>
          {error('defaultScholarshipPercent')}
        </label>
        {errors.form && <Notice tone="error" className="sm:col-span-2">{errors.form}</Notice>}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Approving…' : 'Approve as student'}</button>
        </div>
      </form>
    </dialog>
  )
}

function LinkStudentDialog({ request, onCancel, onSaved }) {
  const dialog = useModal()
  const [students, setStudents] = useState(null)
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listRoster({ isActive: true }).then(
      rows => {
        if (!active) return
        const target = canonicalEmail(request.email)
        const unlinked = rows.filter(student => !student.linkedUserId)
          .map(student => ({ ...student, matches: Boolean(target) && canonicalEmail(student.email) === target }))
          .sort((a, b) => Number(b.matches) - Number(a.matches) || a.name.localeCompare(b.name))
        setStudents(unlinked)
        if (unlinked[0]?.matches) setSelected(unlinked[0].uuid)
      },
      () => { if (active) setError('Student records could not be loaded.') },
    )
    return () => { active = false }
  }, [request.email])

  async function submit(event) {
    event.preventDefault()
    const student = students?.find(item => item.uuid === selected)
    if (!student || saving) return
    if (!student.matches && !window.confirm(`${request.email || 'This account'} does not match ${student.name}'s recorded email (${student.email || 'none'}). Link anyway?`)) return
    setSaving(true)
    setError('')
    try {
      await linkStudentAccount(student.uuid, request.userId)
      onSaved(`${displayName(request)} was linked to ${student.name}.`)
    } catch {
      setError('The account could not be linked. Refresh the list and try again.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="dialog max-w-lg" aria-labelledby="link-student-title"
      onCancel={event => { event.preventDefault(); if (!saving) onCancel() }}>
      <DialogHeader id="link-student-title" title="Link to an existing student" request={request} onClose={onCancel} disabled={saving} />
      <form className="mt-5 grid gap-4" onSubmit={submit}>
        {!students && !error ? <SkeletonRows rows={2} label="Loading students…" />
          : students && !students.length ? <EmptyState>Every active student is already linked. Approve as a new student instead.</EmptyState>
          : students && (
            <label className="label">Student record
              <select className="field" value={selected} disabled={saving} onChange={event => setSelected(event.target.value)}>
                <option value="">Choose a student</option>
                {students.map(student => (
                  <option key={student.uuid} value={student.uuid}>
                    {student.name} ({student.id}){student.matches ? ' · email matches' : student.email ? ` · ${student.email}` : ''}
                  </option>
                ))}
              </select>
              <span className="field-hint">Only active students without a linked account are listed.</span>
            </label>
          )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !selected}>{saving ? 'Linking…' : 'Link account'}</button>
        </div>
      </form>
    </dialog>
  )
}

function ApproveTeacherDialog({ request, onCancel, onSaved }) {
  const dialog = useModal()
  const [name, setName] = useState(request.fullName)
  const [staffCode, setStaffCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if (!name.trim()) { setError('Enter the verified name.'); return }
    setSaving(true)
    setError('')
    try {
      await approveTeacher(request.userId, name, staffCode)
      onSaved(`${name.trim()} was approved as a teacher.`)
    } catch (failure) {
      setError(failure?.message || 'Teacher access could not be approved.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={dialog} className="dialog max-w-lg" aria-labelledby="approve-teacher-title"
      onCancel={event => { event.preventDefault(); if (!saving) onCancel() }}>
      <DialogHeader id="approve-teacher-title" title="Approve as a teacher" request={request} onClose={onCancel} disabled={saving} />
      <form className="mt-5 grid gap-4" onSubmit={submit}>
        <label className="label">Verified name
          <input className="field" required value={name} disabled={saving} onChange={event => setName(event.target.value)} />
        </label>
        <label className="label">Staff code (optional)
          <input className="field" value={staffCode} disabled={saving} onChange={event => setStaffCode(event.target.value)} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Approving…' : 'Approve as teacher'}</button>
        </div>
      </form>
    </dialog>
  )
}

export default function AccessRequests() {
  const [status, setStatus] = useState('pending')
  const [state, setState] = useState({ requests: null, batches: [], error: '' })
  const [revision, setRevision] = useState(0)
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState('')
  const toast = useToast()

  useEffect(() => {
    let active = true
    setState(current => ({ ...current, requests: null, error: '' }))
    Promise.all([listAccessRequests(status), listBatches()]).then(
      ([requests, batches]) => { if (active) setState({ requests, batches, error: '' }) },
      () => { if (active) setState(current => ({ ...current, error: 'Access requests could not be loaded.' })) },
    )
    return () => { active = false }
  }, [status, revision])

  const reload = () => setRevision(value => value + 1)

  function finish(message) {
    setAction(null)
    toast(message)
    reload()
  }

  async function decline(request) {
    if (!window.confirm(`Decline access for ${displayName(request)}? They stay signed out of the portal and are hidden from pending lists until you restore the request.`)) return
    setBusy(request.userId)
    try { await rejectAccessRequest(request.userId); toast(`${displayName(request)}'s request was declined.`); reload() }
    catch { toast('The request could not be declined. Refresh and try again.', 'error') }
    finally { setBusy('') }
  }

  async function restore(request) {
    setBusy(request.userId)
    try { await restoreAccessRequest(request.userId); toast(`${displayName(request)}'s request is back in the queue.`); reload() }
    catch { toast('The request could not be restored. Refresh and try again.', 'error') }
    finally { setBusy('') }
  }

  const { requests, batches, error } = state
  const pending = status === 'pending'

  return <>
    <PageHeader title="Access requests"
      description="People who signed in with Google but are not linked to a student or staff record yet. You can still add students by email in Students." />
    {error && <Notice tone="error" className="mb-4" action={<button type="button" className="btn btn-secondary btn-sm" onClick={reload}>Try again</button>}>{error}</Notice>}
    <section className="panel" aria-labelledby="requests-title">
      <div className="panel-head">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="requests-title">{pending ? 'Waiting for review' : 'Declined requests'}</h2>
          <div className="flex gap-1.5" role="group" aria-label="Request status">
            <button type="button" className="batch-chip" aria-pressed={pending} onClick={() => setStatus('pending')}>Waiting</button>
            <button type="button" className="batch-chip" aria-pressed={!pending} onClick={() => setStatus('rejected')}>Declined</button>
          </div>
        </div>
      </div>
      {!requests ? (!error && <SkeletonRows rows={4} label="Loading access requests…" />)
        : !requests.length ? <EmptyState title={pending ? 'No one is waiting' : 'No declined requests'}>
            {pending ? 'New Google sign-ins without access show up here.' : 'Requests you decline appear here and can be restored.'}
          </EmptyState>
        : <ul className="divide-y">
          {requests.map(request => (
            <li key={request.userId} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 break-words">
                <Person name={displayName(request)} sub={request.fullName ? request.email : null} />
                <p className="mt-1 text-sm text-muted">
                  {pending ? 'Requested ' : 'Declined '}{requestedFormat.format(new Date(pending ? request.requestedAt : (request.reviewedAt ?? request.requestedAt)))}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {pending ? <>
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy === request.userId || !batches.length}
                    onClick={() => setAction({ kind: 'student', request })}><GraduationCap size={15} aria-hidden="true" /> Approve as student</button>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busy === request.userId}
                    onClick={() => setAction({ kind: 'link', request })}><Link2 size={15} aria-hidden="true" /> Link to existing student</button>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busy === request.userId || !request.hasGoogleIdentity}
                    title={request.hasGoogleIdentity ? undefined : 'Teachers must sign in with a verified Google account.'}
                    onClick={() => setAction({ kind: 'teacher', request })}><UserRoundCheck size={15} aria-hidden="true" /> Approve as teacher</button>
                  <button type="button" className="btn btn-ghost btn-sm text-danger" disabled={busy === request.userId}
                    onClick={() => decline(request)}><XCircle size={15} aria-hidden="true" /> Decline</button>
                </> : (
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busy === request.userId}
                    onClick={() => restore(request)}><RotateCcw size={15} aria-hidden="true" /> Restore to queue</button>
                )}
              </div>
            </li>
          ))}
        </ul>}
    </section>
    {action?.kind === 'student' && <ApproveStudentDialog request={action.request} batches={batches} onCancel={() => setAction(null)} onSaved={finish} />}
    {action?.kind === 'link' && <LinkStudentDialog request={action.request} onCancel={() => setAction(null)} onSaved={finish} />}
    {action?.kind === 'teacher' && <ApproveTeacherDialog request={action.request} onCancel={() => setAction(null)} onSaved={finish} />}
  </>
}
