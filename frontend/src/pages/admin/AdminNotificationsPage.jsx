import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchNotificationsThunk,
  markReadThunk,
  markAllReadThunk,
  sendNotificationThunk,
  clearSendStatus,
} from '@/features/notifications/notificationsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const TYPE_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'coupon_offer', label: 'Coupon offer' },
  { value: 'tour_update', label: 'Tour update' },
  { value: 'booking_confirmed', label: 'Booking confirmed' },
  { value: 'booking_cancelled', label: 'Booking cancelled' },
  { value: 'review_reminder', label: 'Review reminder' },
]

const TYPE_STYLES = {
  system: 'bg-gray-100 text-gray-600',
  coupon_offer: 'bg-green-100 text-green-700',
  tour_update: 'bg-blue-100 text-blue-700',
  booking_confirmed: 'bg-emerald-100 text-emerald-700',
  booking_cancelled: 'bg-red-100 text-red-600',
  payment_failed: 'bg-orange-100 text-orange-600',
  review_reminder: 'bg-yellow-100 text-yellow-700',
}

export default function AdminNotificationsPage() {
  const dispatch = useDispatch()
  const { items, meta, listStatus, listError, sendStatus, sendError, unreadCount } = useSelector(
    (s) => s.notifications,
  )

  const [userId, setUserId] = useState('')
  const [type, setType] = useState('system')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchNotificationsThunk({ page: 1, limit: 20 }))
  }, [dispatch])

  useEffect(() => {
    if (sendStatus === 'succeeded') {
      setUserId(''); setTitle(''); setMessage(''); setType('system')
      dispatch(clearSendStatus())
    }
  }, [sendStatus])

  function load(p = 1) {
    dispatch(fetchNotificationsThunk({ page: p, limit: 20 }))
  }

  function handleSend(e) {
    e.preventDefault()
    dispatch(sendNotificationThunk({ userId: userId.trim(), type, title: title.trim(), message: message.trim() }))
  }

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500'

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-muted">
          Send notifications to users. You have{' '}
          <strong>{unreadCount}</strong> unread in your own inbox.
        </p>
      </div>

      {/* Send form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">Send a notification</h2>
        {sendError && <ErrorMessage message={sendError} />}
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">User ID *</label>
              <input
                required
                className={field}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="MongoDB ObjectId of the user"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Type *</label>
              <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Title *</label>
              <input required className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Message *</label>
              <input required className={field} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Notification body text" />
            </div>
          </div>
          <Button type="submit" loading={sendStatus === 'loading'}>Send notification</Button>
        </form>
      </div>

      {/* My notifications list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink">Your notifications</h2>
        {items.some((n) => !n.isRead) && (
          <button
            onClick={() => dispatch(markAllReadThunk())}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {listError && <ErrorMessage message={listError} />}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {listStatus === 'loading' ? (
          <div className="py-16"><Spinner center /></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-4 p-4 transition-colors ${n.isRead ? '' : 'bg-brand-50'}`}
              >
                <div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-brand-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${n.isRead ? 'text-muted' : 'text-ink'}`}>{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLES[n.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => dispatch(markReadThunk(n._id))}
                    className="shrink-0 text-xs text-muted hover:text-ink"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
            {items.length === 0 && listStatus === 'succeeded' && (
              <p className="py-16 text-center text-sm text-muted">No notifications</p>
            )}
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
    </div>
  )
}
