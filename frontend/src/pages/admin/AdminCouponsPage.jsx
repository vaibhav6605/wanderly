/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchCouponsThunk,
  createCouponThunk,
  updateCouponThunk,
  deleteCouponThunk,
  clearCouponAction,
} from '@/features/coupons/couponsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minBookingAmount: '',
  usageLimit: '',
  usageLimitPerUser: '1',
  validFrom: '',
  validUntil: '',
  isActive: true,
}

function CouponForm({ initial = EMPTY_FORM, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      ...form,
      code: form.code.toUpperCase(),
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minBookingAmount: Number(form.minBookingAmount || 0),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usageLimitPerUser: Number(form.usageLimitPerUser || 1),
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil).toISOString(),
    }
    onSubmit(data)
  }

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Code *</label>
          <input required className={field} value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Type *</label>
          <select required className={field} value={form.discountType} onChange={(e) => set('discountType', e.target.value)}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Discount value *</label>
          <input required type="number" min={0} className={field} value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Max discount $</label>
          <input type="number" min={0} className={field} value={form.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Min booking $</label>
          <input type="number" min={0} className={field} value={form.minBookingAmount} onChange={(e) => set('minBookingAmount', e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Total usage limit</label>
          <input type="number" min={1} className={field} value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="Unlimited" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Uses per user</label>
          <input type="number" min={1} className={field} value={form.usageLimitPerUser} onChange={(e) => set('usageLimitPerUser', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Valid from *</label>
          <input required type="date" className={field} value={form.validFrom} onChange={(e) => set('validFrom', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Valid until *</label>
          <input required type="date" className={field} value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink">Description</label>
          <input className={field} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional internal note" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
        Active
      </label>
      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={loading}>Save coupon</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export default function AdminCouponsPage() {
  const dispatch = useDispatch()
  const { items, meta, listStatus, listError, actionStatus, actionError } = useSelector((s) => s.coupons)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)

  function load(p = 1) {
    dispatch(fetchCouponsThunk({ page: p, limit: 20 }))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (actionStatus === 'succeeded') {
      setShowForm(false)
      setEditTarget(null)
      dispatch(clearCouponAction())
    }
  }, [actionStatus])

  function handleCreate(data) { dispatch(createCouponThunk(data)) }
  function handleUpdate(data) { dispatch(updateCouponThunk({ id: editTarget._id, data })) }
  function handleDelete() {
    dispatch(deleteCouponThunk(deleteTarget._id))
    setDeleteTarget(null)
  }

  function toFormValues(c) {
    return {
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : '',
      minBookingAmount: String(c.minBookingAmount ?? 0),
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      usageLimitPerUser: String(c.usageLimitPerUser ?? 1),
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
      isActive: c.isActive,
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Coupons</h1>
          <p className="mt-1 text-sm text-muted">Create and manage discount codes.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditTarget(null) }}>+ New coupon</Button>
      </div>

      {listError && <ErrorMessage message={listError} />}

      {/* Create/Edit form panel */}
      {(showForm || editTarget) && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-ink">
            {editTarget ? `Edit ${editTarget.code}` : 'New coupon'}
          </h2>
          <CouponForm
            initial={editTarget ? toFormValues(editTarget) : EMPTY_FORM}
            onSubmit={editTarget ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditTarget(null) }}
            loading={actionStatus === 'loading'}
            error={actionError}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {listStatus === 'loading' ? (
          <div className="py-16"><Spinner center /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Used / Limit</th>
                  <th className="px-5 py-3">Valid until</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono font-semibold text-ink">{c.code}</td>
                    <td className="px-5 py-3.5 capitalize text-muted">{c.discountType}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                      {c.maxDiscountAmount && <span className="text-xs text-muted"> (max ${c.maxDiscountAmount})</span>}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {c.usedCount} / {c.usageLimit ?? '∞'}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {new Date(c.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setEditTarget(c); setShowForm(false) }}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => dispatch(updateCouponThunk({ id: c._id, data: { isActive: !c.isActive } }))}
                          className="text-xs font-medium text-muted hover:text-ink hover:underline"
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && listStatus === 'succeeded' && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-muted">No coupons yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-ink">Delete {deleteTarget.code}?</h2>
            <p className="mb-5 text-sm text-muted">This cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
