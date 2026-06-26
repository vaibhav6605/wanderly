import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { paymentsApi } from '@/api/payments.api'

const msg = (err, fallback) =>
  err?.response?.data?.error?.message ?? err?.message ?? fallback

// ── Thunks ────────────────────────────────────────────────────────────────

export const createPaymentIntentThunk = createAsyncThunk(
  'payments/createIntent',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await paymentsApi.createIntent(bookingId)
      return res.data.clientSecret
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to initialize payment'))
    }
  },
)

export const fetchPaymentsThunk = createAsyncThunk(
  'payments/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await paymentsApi.listPayments(params)
      return { payments: res.data.payments, meta: res.meta }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load payment history'))
    }
  },
)

export const fetchInvoiceThunk = createAsyncThunk(
  'payments/fetchInvoice',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await paymentsApi.getInvoice(bookingId)
      return res.data.invoice
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load invoice'))
    }
  },
)

export const createRefundThunk = createAsyncThunk(
  'payments/createRefund',
  async ({ bookingId, amount, reason }, { rejectWithValue }) => {
    try {
      const res = await paymentsApi.createRefund(bookingId, amount, reason)
      return res.data.payment
    } catch (e) {
      return rejectWithValue(msg(e, 'Refund failed'))
    }
  },
)

// ── Slice ──────────────────────────────────────────────────────────────────

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    clientSecret: null,
    intentStatus: 'idle',
    intentError: null,

    payments: [],
    paymentsMeta: null,
    paymentsStatus: 'idle',

    invoice: null,
    invoiceStatus: 'idle',
    invoiceError: null,

    refundStatus: 'idle',
    refundError: null,
  },
  reducers: {
    clearIntent(state) {
      state.clientSecret = null
      state.intentStatus = 'idle'
      state.intentError = null
    },
    clearInvoice(state) {
      state.invoice = null
      state.invoiceStatus = 'idle'
      state.invoiceError = null
    },
    clearRefund(state) {
      state.refundStatus = 'idle'
      state.refundError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // ── create intent ─────────────────────────────────────────────────────
      .addCase(createPaymentIntentThunk.pending, (s) => {
        s.intentStatus = 'loading'
        s.intentError = null
        s.clientSecret = null
      })
      .addCase(createPaymentIntentThunk.fulfilled, (s, { payload }) => {
        s.intentStatus = 'succeeded'
        s.clientSecret = payload
      })
      .addCase(createPaymentIntentThunk.rejected, (s, { payload }) => {
        s.intentStatus = 'failed'
        s.intentError = payload
      })

      // ── list ──────────────────────────────────────────────────────────────
      .addCase(fetchPaymentsThunk.pending, (s) => { s.paymentsStatus = 'loading' })
      .addCase(fetchPaymentsThunk.fulfilled, (s, { payload }) => {
        s.paymentsStatus = 'succeeded'
        s.payments = payload.payments
        s.paymentsMeta = payload.meta
      })
      .addCase(fetchPaymentsThunk.rejected, (s) => { s.paymentsStatus = 'failed' })

      // ── invoice ───────────────────────────────────────────────────────────
      .addCase(fetchInvoiceThunk.pending, (s) => {
        s.invoiceStatus = 'loading'
        s.invoiceError = null
      })
      .addCase(fetchInvoiceThunk.fulfilled, (s, { payload }) => {
        s.invoiceStatus = 'succeeded'
        s.invoice = payload
      })
      .addCase(fetchInvoiceThunk.rejected, (s, { payload }) => {
        s.invoiceStatus = 'failed'
        s.invoiceError = payload
      })

      // ── refund ────────────────────────────────────────────────────────────
      .addCase(createRefundThunk.pending, (s) => {
        s.refundStatus = 'loading'
        s.refundError = null
      })
      .addCase(createRefundThunk.fulfilled, (s) => { s.refundStatus = 'succeeded' })
      .addCase(createRefundThunk.rejected, (s, { payload }) => {
        s.refundStatus = 'failed'
        s.refundError = payload
      })
  },
})

export const { clearIntent, clearInvoice, clearRefund } = paymentsSlice.actions
export default paymentsSlice.reducer
