import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import toursReducer from '@/features/tours/toursSlice'
import reviewsReducer from '@/features/reviews/reviewsSlice'
import wishlistReducer from '@/features/wishlist/wishlistSlice'
import bookingsReducer from '@/features/bookings/bookingsSlice'

// Minimal initial auth state: not initializing, not authenticated.
const defaultAuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,
  isInitializing: false,
}

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      tours: toursReducer,
      reviews: reviewsReducer,
      wishlist: wishlistReducer,
      bookings: bookingsReducer,
    },
    preloadedState: {
      auth: defaultAuthState,
      ...preloadedState,
    },
  })
}

export function renderWithProviders(
  ui,
  { store, initialRoute = '/', routerProps = {}, ...renderOptions } = {},
) {
  const testStore = store ?? createTestStore()

  function Wrapper({ children }) {
    return (
      <Provider store={testStore}>
        <MemoryRouter initialEntries={[initialRoute]} {...routerProps}>
          {children}
        </MemoryRouter>
      </Provider>
    )
  }

  return { store: testStore, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
