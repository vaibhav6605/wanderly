import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { wishlistApi } from '@/api/wishlist.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

export const fetchWishlistIdsThunk = createAsyncThunk(
  'wishlist/fetchIds',
  async (_, { rejectWithValue }) => {
    try {
      return (await wishlistApi.getIds()).data.ids
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load wishlist'))
    }
  },
)

export const fetchWishlistThunk = createAsyncThunk(
  'wishlist/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await wishlistApi.listWishlist(params)
      return { items: res.data.items, meta: res.meta }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load wishlist'))
    }
  },
)

export const toggleWishlistThunk = createAsyncThunk(
  'wishlist/toggle',
  async (tourId, { getState, rejectWithValue }) => {
    const isIn = getState().wishlist.ids.includes(tourId)
    try {
      if (isIn) {
        await wishlistApi.remove(tourId)
      } else {
        await wishlistApi.add(tourId)
      }
      return { tourId, added: !isIn }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to update wishlist'))
    }
  },
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    ids: [],
    idsStatus: 'idle',
    items: [],
    itemsMeta: null,
    itemsStatus: 'idle',
    toggleStatus: 'idle',
    error: null,
  },
  reducers: {
    clearWishlistItems(state) {
      state.items = []
      state.itemsMeta = null
      state.itemsStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistIdsThunk.pending, (s) => { s.idsStatus = 'loading' })
      .addCase(fetchWishlistIdsThunk.fulfilled, (s, { payload }) => {
        s.idsStatus = 'succeeded'
        s.ids = payload
      })
      .addCase(fetchWishlistIdsThunk.rejected, (s) => { s.idsStatus = 'failed' })

      .addCase(fetchWishlistThunk.pending, (s) => { s.itemsStatus = 'loading'; s.error = null })
      .addCase(fetchWishlistThunk.fulfilled, (s, { payload }) => {
        s.itemsStatus = 'succeeded'
        s.items = payload.items
        s.itemsMeta = payload.meta
      })
      .addCase(fetchWishlistThunk.rejected, (s, { payload }) => {
        s.itemsStatus = 'failed'
        s.error = payload
      })

      .addCase(toggleWishlistThunk.pending, (s) => { s.toggleStatus = 'loading' })
      .addCase(toggleWishlistThunk.fulfilled, (s, { payload: { tourId, added } }) => {
        s.toggleStatus = 'idle'
        if (added) {
          if (!s.ids.includes(tourId)) s.ids.push(tourId)
        } else {
          s.ids = s.ids.filter((id) => id !== tourId)
          s.items = s.items.filter((t) => t._id !== tourId)
        }
      })
      .addCase(toggleWishlistThunk.rejected, (s, { payload }) => {
        s.toggleStatus = 'idle'
        s.error = payload
      })
  },
})

export const { clearWishlistItems } = wishlistSlice.actions
export default wishlistSlice.reducer
