import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationsApi } from '@/api/notifications.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.listNotifications(params)
      return { notifications: res.data.notifications, meta: res.meta }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load notifications'))
    }
  },
)

export const fetchUnreadCountThunk = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return (await notificationsApi.getUnreadCount()).data.unreadCount
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to fetch unread count'))
    }
  },
)

export const markReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      return (await notificationsApi.markRead(id)).data.notification
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to mark as read'))
    }
  },
)

export const markAllReadThunk = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllRead()
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to mark all as read'))
    }
  },
)

export const sendNotificationThunk = createAsyncThunk(
  'notifications/send',
  async (data, { rejectWithValue }) => {
    try {
      return (await notificationsApi.sendNotification(data)).data.notification
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to send notification'))
    }
  },
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    meta: null,
    unreadCount: 0,
    listStatus: 'idle',
    listError: null,
    sendStatus: 'idle',
    sendError: null,
  },
  reducers: {
    clearSendStatus(state) {
      state.sendStatus = 'idle'
      state.sendError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (s) => { s.listStatus = 'loading' })
      .addCase(fetchNotificationsThunk.fulfilled, (s, { payload }) => {
        s.listStatus = 'succeeded'
        s.items = payload.notifications
        s.meta = payload.meta
        s.unreadCount = payload.meta?.unreadCount ?? s.unreadCount
      })
      .addCase(fetchNotificationsThunk.rejected, (s, { payload }) => {
        s.listStatus = 'failed'
        s.listError = payload
      })

      .addCase(fetchUnreadCountThunk.fulfilled, (s, { payload }) => {
        s.unreadCount = payload
      })

      .addCase(markReadThunk.fulfilled, (s, { payload }) => {
        const idx = s.items.findIndex((n) => n._id === payload._id)
        if (idx !== -1) s.items[idx] = payload
        s.unreadCount = Math.max(0, s.unreadCount - 1)
      })

      .addCase(markAllReadThunk.fulfilled, (s) => {
        s.items = s.items.map((n) => ({ ...n, isRead: true }))
        s.unreadCount = 0
      })

      .addCase(sendNotificationThunk.pending, (s) => { s.sendStatus = 'loading'; s.sendError = null })
      .addCase(sendNotificationThunk.fulfilled, (s) => { s.sendStatus = 'succeeded' })
      .addCase(sendNotificationThunk.rejected, (s, { payload }) => {
        s.sendStatus = 'failed'
        s.sendError = payload
      })
  },
})

export const { clearSendStatus } = notificationsSlice.actions
export default notificationsSlice.reducer
