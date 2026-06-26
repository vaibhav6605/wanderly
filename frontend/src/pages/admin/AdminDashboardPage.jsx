/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  fetchOverviewThunk,
  fetchTrendsThunk,
  fetchTopToursThunk,
} from '@/features/admin/adminSlice'
import Spinner from '@/components/ui/Spinner'

const STATUS_COLORS = {
  confirmed: '#10b981',
  pending_payment: '#f59e0b',
  cancelled: '#6b7280',
  completed: '#3b82f6',
  refunded: '#8b5cf6',
}

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  pending_payment: 'Pending',
  cancelled: 'Cancelled',
  completed: 'Completed',
  refunded: 'Refunded',
}

function fmtMoney(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${Number(n ?? 0).toLocaleString()}`
}

function fmtDate(str) {
  const d = new Date(str)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'brand', to }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  const card = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value ?? '—'}</p>
      {sub && <p className={`mt-1 text-xs font-medium ${colors[color]}`}>{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

// ── Custom tooltip ─────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="mb-1.5 font-semibold text-ink">{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === 'revenue' ? `$${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-lg text-xs">
      <p style={{ color: d.payload.fill }} className="font-semibold">{d.name}</p>
      <p className="text-ink">{d.value} bookings</p>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const dispatch = useDispatch()
  const { overview, overviewStatus, trends, trendsStatus, topTours, topToursStatus } = useSelector(
    (s) => s.admin,
  )

  useEffect(() => {
    dispatch(fetchOverviewThunk())
    dispatch(fetchTrendsThunk(30))
    dispatch(fetchTopToursThunk(5))
  }, [dispatch])

  const loading = overviewStatus === 'loading' || overviewStatus === 'idle'

  // Pie data from bookingsByStatus
  const pieData = Object.entries(overview?.bookingsByStatus ?? {})
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] ?? key,
      value,
      fill: STATUS_COLORS[key] ?? '#e5e7eb',
    }))

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Welcome back. Here's what's happening.</p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          <StatCard
            label="Total Users"
            value={overview?.totalUsers?.toLocaleString()}
            sub="Active accounts"
            color="brand"
            to="/admin/users"
          />
          <StatCard
            label="Total Tours"
            value={overview?.totalTours?.toLocaleString()}
            sub="Active tours"
            color="blue"
            to="/admin/tours"
          />
          <StatCard
            label="Total Bookings"
            value={overview?.totalBookings?.toLocaleString()}
            sub={`${overview?.bookingsByStatus?.confirmed ?? 0} confirmed`}
            color="green"
            to="/admin/bookings"
          />
          <StatCard
            label="Revenue"
            value={fmtMoney(overview?.totalRevenue)}
            sub="All time (paid)"
            color="purple"
            to="/admin/payments"
          />
        </div>
      )}

      {/* Row 1: Revenue + Bookings trend */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue area chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-ink">Revenue — last 30 days</h2>
          <p className="mb-4 text-xs text-muted">Daily payment totals</p>
          {trendsStatus === 'loading' ? (
            <div className="flex h-52 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a5f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff5a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: '#717171' }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
                  tick={{ fontSize: 11, fill: '#717171' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#ff5a5f"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bookings bar chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-ink">Bookings — last 30 days</h2>
          <p className="mb-4 text-xs text-muted">Daily new bookings</p>
          {trendsStatus === 'loading' ? (
            <div className="flex h-52 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: '#717171' }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#717171' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Bar
                  dataKey="bookings"
                  name="Bookings"
                  fill="#6366f1"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Status donut + Top tours */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Bookings by status donut */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-ink">Bookings by status</h2>
          <p className="mb-4 text-xs text-muted">Distribution across all bookings</p>
          {loading ? (
            <div className="flex h-52 items-center justify-center"><Spinner /></div>
          ) : pieData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted">No bookings yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2 text-sm">
                {pieData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted">{d.name}</span>
                    </span>
                    <span className="font-semibold text-ink">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top tours horizontal bar */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-ink">Top tours by bookings</h2>
          <p className="mb-4 text-xs text-muted">Confirmed + completed bookings</p>
          {topToursStatus === 'loading' ? (
            <div className="flex h-52 items-center justify-center"><Spinner /></div>
          ) : topTours.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topTours}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#717171' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={120}
                  tick={{ fontSize: 11, fill: '#717171' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v.length > 18 ? v.slice(0, 16) + '…' : v)}
                />
                <Tooltip
                  formatter={(v, name) => [v, name === 'bookings' ? 'Bookings' : 'Revenue']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="bookings" name="bookings" fill="#ff5a5f" radius={[0, 3, 3, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Recent bookings</h2>
          <Link to="/admin/bookings" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="py-10"><Spinner center /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Tour</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.recentBookings ?? []).map((b) => (
                  <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink max-w-[160px] truncate">
                      {b.tour?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-muted">{b.user?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-muted">
                      {new Date(b.tourStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink">
                      ${Number(b.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending_payment: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    completed: 'bg-blue-100 text-blue-700',
    refunded: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
