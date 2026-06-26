/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import AdminLayout from '@/layouts/AdminLayout'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicOnlyRoute from '@/components/PublicOnlyRoute'
import Spinner from '@/components/ui/Spinner'
import { ROLES } from '@/lib/constants'

// ── Lazy-loaded pages ──────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ToursPage = lazy(() => import('@/pages/ToursPage'))
const TourDetailPage = lazy(() => import('@/pages/TourDetailPage'))
const BookingPage = lazy(() => import('@/pages/BookingPage'))
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const PaymentCompletePage = lazy(() => import('@/pages/PaymentCompletePage'))
const InvoicePage = lazy(() => import('@/pages/InvoicePage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminToursPage = lazy(() => import('@/pages/admin/AdminToursPage'))
const TourFormPage = lazy(() => import('@/pages/admin/TourFormPage'))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'))
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'))

const suspend = (Page) => (
  <Suspense fallback={<Spinner center size="lg" />}>
    <Page />
  </Suspense>
)

export const router = createBrowserRouter([
  // ── Public site (with Navbar + Footer) ────────────────────────────────────
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },

      // Tours (public)
      { path: 'tours', element: suspend(ToursPage) },
      { path: 'tours/:slug', element: suspend(TourDetailPage) },

      // Password reset (no auth needed)
      { path: 'forgot-password', element: suspend(ForgotPasswordPage) },
      { path: 'reset-password', element: suspend(ResetPasswordPage) },

      // Stripe redirect (public — Stripe sends users here after payment)
      { path: 'payment/complete', element: suspend(PaymentCompletePage) },

      // Public-only (guests only)
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: 'login', element: suspend(LoginPage) },
          { path: 'register', element: suspend(RegisterPage) },
        ],
      },

      // Protected (any authenticated user)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: suspend(ProfilePage) },
          { path: 'book/:tourId', element: suspend(BookingPage) },
          { path: 'bookings', element: suspend(MyBookingsPage) },
          { path: 'checkout/:bookingId', element: suspend(CheckoutPage) },
          { path: 'invoice/:bookingId', element: suspend(InvoicePage) },
          { path: 'wishlist', element: suspend(WishlistPage) },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // ── Admin (own layout — sidebar, no public Navbar) ─────────────────────
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: suspend(AdminDashboardPage) },
          { path: 'tours', element: suspend(AdminToursPage) },
          { path: 'tours/new', element: suspend(TourFormPage) },
          { path: 'tours/:id/edit', element: suspend(TourFormPage) },
          { path: 'bookings', element: suspend(AdminBookingsPage) },
          { path: 'payments', element: suspend(AdminPaymentsPage) },
          { path: 'users', element: suspend(AdminUsersPage) },
          { path: 'reviews', element: suspend(AdminReviewsPage) },
          { path: 'coupons', element: suspend(AdminCouponsPage) },
          { path: 'categories', element: suspend(AdminCategoriesPage) },
          { path: 'notifications', element: suspend(AdminNotificationsPage) },
        ],
      },
    ],
  },
])
