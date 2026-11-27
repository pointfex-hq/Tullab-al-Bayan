import { createLogger } from '../../lib/logger.js'
import { supabase } from '../auth/supabaseAuth.js'

const log = createLogger('teachers')

const ERROR_MESSAGES = {
  PGRST202: 'Teacher management is not set up in the database yet. Ask an administrator to apply the latest Supabase migration.',
  PGRST205: 'Teacher management is not set up in the database yet. Ask an administrator to apply the latest Supabase migration.',
  42501: 'You do not have permission to manage teacher accounts.',
  23514: 'This account cannot be changed here. Refresh the list and try again.',
  22023: 'Enter a verified name for the teacher.',
  P0002: 'That account no longer exists. Refresh the list.',
}

function toTeacherError(failure) {
  const code = failure?.code
  const details = String(failure?.message ?? '')
  const message = code === '23505'
    ? (/staff[_ ]code/i.test(details)
      ? 'That staff code is already in use.'
      : 'This account is already linked to a teacher role. Refresh the list.')
    : ERROR_MESSAGES[code] ?? failure?.message ?? 'The teacher account change could not be saved.'
  const error = new Error(message)
  if (code) error.code = code
  return error
}

async function teacherRpc(name, args) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.rpc(name, args)
  if (error) {
    log.error(`${name} failed`, error)
    throw toTeacherError(error)
  }
  return data
}

export async function listTeacherManagementAccounts() {
  const [teachers, pending] = await Promise.all([
    teacherRpc('list_teacher_accounts'),
    teacherRpc('list_pending_teacher_accounts'),
  ])
  return { teachers: teachers ?? [], pending: pending ?? [] }
}

export function approveTeacher(userId, name, staffCode) {
  return teacherRpc('link_teacher_account', {
    p_user_id: userId,
    p_full_name: name.trim(),
    p_staff_code: staffCode.trim() || null,
  })
}

export function revokeTeacher(userId) {
  return teacherRpc('unlink_teacher_account', { p_user_id: userId })
}

export function updateTeacher(userId, name, staffCode) {
  return teacherRpc('update_teacher_account', {
    p_user_id: userId,
    p_full_name: name.trim(),
    p_staff_code: staffCode.trim() || null,
  })
}

export async function listTeacherAuditLogs(limit = 50) {
  const rows = await teacherRpc('list_teacher_audit_logs', { p_limit: limit })
  return rows ?? []
}
