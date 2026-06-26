import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { bookingsApi } from '@/api/bookings.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

// ── Thunks ────────────────────────────────────────────────────────────────

export const createBookingThunk = createAsyncThunk(
  'bookings/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await bookingsApi.createBooking(data)
      return res.data.booking
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to create booking'))
    }
  },
)

export const fetchBookingsThunk = createAsyncThunk(
  'bookings/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await bookingsApi.listBookings(params)
      return { bookings: res.data.bookings, meta: res.meta }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load bookings'))
    }
  },
)

export const fetchBookingThunk = createAsyncThunk(
  'bookings/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await bookingsApi.getBooking(id)
      return res.data.booking
    } catch (e) {
      return rejectWithValue(msg(e, 'Booking not found'))
    }
  },
)

export const cancelBookingThunk = createAsyncThunk(
  'bookings/cancel',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await bookingsApi.cancelBooking(id, reason)
      return res.data.booking
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to cancel booking'))
    }
  },
)

export const validateCouponThunk = createAsyncThunk(
  'bookings/validateCoupon',
  async (data, { rejectWithValue }) => {
    try {
      const res = await bookingsApi.validateCoupon(data)
      return res.data // { coupon, discountAmount }
    } catch (e) {
      return rejectWithValue(msg(e, 'Invalid coupon'))
    }
  },
)

// ── Slice ──────────────────────────────────────────────────────────────────

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    // List
    items: [],
    meta: null,
    listStatus: 'idle',
    listError: null,

    // Create
    createStatus: 'idle',
    createError: null,
    createdBooking: null,

    // Cancel
    cancelStatus: 'idle',
    cancelError: null,

    // Coupon validation
    coupon: null,
    couponStatus: 'idle',
    couponError: null,
  },
  reducers: {
    clearCreate(state) {
      state.createStatus = 'idle'
      state.createError = null
      state.createdBooking = null
    },
    clearCoupon(state) {
      state.coupon = null
      state.couponStatus = 'idle'
      state.couponError = null
    },
    clearCancel(state) {
      state.cancelStatus = 'idle'
      state.cancelError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // ── create ───────────────────────────────────────────────────────────
      .addCase(createBookingThunk.pending, (s) => {
        s.createStatus = 'loading'
        s.createError = null
      })
      .addCase(createBookingThunk.fulfilled, (s, { payload }) => {
        s.createStatus = 'succeeded'
        s.createdBooking = payload
        // Prepend to list if already loaded
        if (s.listStatus === 'succeeded') s.items.unshift(payload)
      })
      .addCase(createBookingThunk.rejected, (s, { payload }) => {
        s.createStatus = 'failed'
        s.createError = payload
      })

      // ── fetch list ────────────────────────────────────────────────────────
      .addCase(fetchBookingsThunk.pending, (s) => {
        s.listStatus = 'loading'
        s.listError = null
      })
      .addCase(fetchBookingsThunk.fulfilled, (s, { payload }) => {
        s.listStatus = 'succeeded'
        s.items = payload.bookings
        s.meta = payload.meta
      })
      .addCase(fetchBookingsThunk.rejected, (s, { payload }) => {
        s.listStatus = 'failed'
        s.listError = payload
      })

      // ── cancel ────────────────────────────────────────────────────────────
      .addCase(cancelBookingThunk.pending, (s) => {
        s.cancelStatus = 'loading'
        s.cancelError = null
      })
      .addCase(cancelBookingThunk.fulfilled, (s, { payload }) => {
        s.cancelStatus = 'succeeded'
        s.items = s.items.map((b) => (b._id === payload._id ? payload : b))
      })
      .addCase(cancelBookingThunk.rejected, (s, { payload }) => {
        s.cancelStatus = 'failed'
        s.cancelError = payload
      })

      // ── coupon ────────────────────────────────────────────────────────────
      .addCase(validateCouponThunk.pending, (s) => {
        s.couponStatus = 'loading'
        s.couponError = null
        s.coupon = null
      })
      .addCase(validateCouponThunk.fulfilled, (s, { payload }) => {
        s.couponStatus = 'succeeded'
        s.coupon = payload
      })
      .addCase(validateCouponThunk.rejected, (s, { payload }) => {
        s.couponStatus = 'failed'
        s.couponError = payload
      })
  },
})

export const { clearCreate, clearCoupon, clearCancel } = bookingsSlice.actions
export default bookingsSlice.reducer
