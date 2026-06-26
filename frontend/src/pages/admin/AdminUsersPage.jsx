/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { usersApi } from '@/api/users.api'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'
import { ROLES } from '@/lib/constants'

// Local thunks — users module doesn't have its own Redux slice yet
async function apiListUsers(params) {
  return usersApi.listUsers(params)
}

const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-gray-100 text-gray-600',
}

export default function AdminUsersPage() {
  const dispatch = useDispatch()
  const { user: me } = useSelector((s) => s.auth)

  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // userId being actioned

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  async function load(p = page) {
    setLoading(true)
    setError(null)
    try {
      const params = { page: p, limit: 20 }
      if (search.trim()) params.search = search.trim()
      if (roleFilter) params.role = roleFilter
      const res = await apiListUsers(params)
      setUsers(res.data?.users ?? [])
      setMeta(res.meta)
    } catch (e) {
      setError(e?.response?.data?.error?.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1); setPage(1) }, [search, roleFilter])

  async function handleBan(userId, isBanned) {
    setActionLoading(userId)
    try {
      const updated = await usersApi.setBanned(userId, isBanned)
      setUsers((prev) => prev.map((u) => (u.id === userId || u._id === userId ? { ...u, ...updated } : u)))
    } catch (e) {
      alert(e?.response?.data?.error?.message ?? 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRoleToggle(userId, currentRole) {
    const newRole = currentRole === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN
    if (!window.confirm(`Change role to ${newRole}?`)) return
    setActionLoading(userId)
    try {
      const updated = await usersApi.setRole(userId, newRole)
      setUsers((prev) => prev.map((u) => (u.id === userId || u._id === userId ? { ...u, ...updated } : u)))
    } catch (e) {
      alert(e?.response?.data?.error?.message ?? 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Users</h1>
        <p className="mt-1 text-sm text-muted">Manage user accounts, roles, and access.</p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {meta && (
          <span className="ml-auto text-xs text-muted">{meta.totalCount} user{meta.totalCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-16"><Spinner center /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uid = u._id ?? u.id
                  const isSelf = uid === me?.id
                  const busy = actionLoading === uid
                  return (
                    <tr key={uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="font-medium text-ink">{u.name}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isBanned ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">Banned</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        {isSelf ? (
                          <span className="text-xs text-muted italic">You</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              disabled={busy}
                              onClick={() => handleBan(uid, !u.isBanned)}
                              className={`text-xs font-medium hover:underline disabled:opacity-50 ${u.isBanned ? 'text-green-600' : 'text-red-500'}`}
                            >
                              {busy ? '…' : u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => handleRoleToggle(uid, u.role)}
                              className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
                            >
                              {u.role === ROLES.ADMIN ? 'Demote' : 'Make Admin'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-muted">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-muted">Page {page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1) }}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => { setPage(page + 1); load(page + 1) }}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
