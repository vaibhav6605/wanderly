import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoriesApi } from '@/api/categories.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

export const fetchCategoriesThunk = createAsyncThunk(
  'categories/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      return (await categoriesApi.listCategories()).data.categories
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load categories'))
    }
  },
)

export const createCategoryThunk = createAsyncThunk(
  'categories/create',
  async (data, { rejectWithValue }) => {
    try {
      return (await categoriesApi.createCategory(data)).data.category
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to create category'))
    }
  },
)

export const updateCategoryThunk = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return (await categoriesApi.updateCategory(id, data)).data.category
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to update category'))
    }
  },
)

export const deleteCategoryThunk = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await categoriesApi.deleteCategory(id)
      return id
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to delete category'))
    }
  },
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    actionStatus: 'idle',
    actionError: null,
  },
  reducers: {
    clearActionStatus(state) {
      state.actionStatus = 'idle'
      state.actionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesThunk.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(fetchCategoriesThunk.fulfilled, (s, { payload }) => {
        s.status = 'succeeded'
        s.items = payload
      })
      .addCase(fetchCategoriesThunk.rejected, (s, { payload }) => {
        s.status = 'failed'
        s.error = payload
      })

      .addCase(createCategoryThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(createCategoryThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        s.items.unshift(payload)
      })
      .addCase(createCategoryThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(updateCategoryThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(updateCategoryThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        const idx = s.items.findIndex((c) => c._id === payload._id)
        if (idx !== -1) s.items[idx] = payload
      })
      .addCase(updateCategoryThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(deleteCategoryThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(deleteCategoryThunk.fulfilled, (s, { payload: id }) => {
        s.actionStatus = 'succeeded'
        s.items = s.items.filter((c) => c._id !== id)
      })
      .addCase(deleteCategoryThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })
  },
})

export const { clearActionStatus } = categoriesSlice.actions
export default categoriesSlice.reducer
