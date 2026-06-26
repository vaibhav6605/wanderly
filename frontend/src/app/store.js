import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import toursReducer from '@/features/tours/toursSlice'
import bookingsReducer from '@/features/bookings/bookingsSlice'
import paymentsReducer from '@/features/payments/paymentsSlice'
import adminReducer from '@/features/admin/adminSlice'
import reviewsReducer from '@/features/reviews/reviewsSlice'
import categoriesReducer from '@/features/categories/categoriesSlice'
import couponsReducer from '@/features/coupons/couponsSlice'
import notificationsReducer from '@/features/notifications/notificationsSlice'
import wishlistReducer from '@/features/wishlist/wishlistSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tours: toursReducer,
    bookings: bookingsReducer,
    payments: paymentsReducer,
    admin: adminReducer,
    reviews: reviewsReducer,
    categories: categoriesReducer,
    coupons: couponsReducer,
    notifications: notificationsReducer,
    wishlist: wishlistReducer,
  },
})
