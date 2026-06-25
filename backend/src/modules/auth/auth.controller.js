import * as authService from './auth.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_COOKIE_NAME,
} from './auth.cookies.js'

function deviceInfoFrom(req) {
  return req.headers['user-agent'] || 'unknown'
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser({
    ...req.body,
    deviceInfo: deviceInfoFrom(req),
  })
  setRefreshTokenCookie(res, refreshToken)
  ApiResponse.send(res, 201, { user, accessToken })
})

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser({
    ...req.body,
    deviceInfo: deviceInfoFrom(req),
  })
  setRefreshTokenCookie(res, refreshToken)
  ApiResponse.send(res, 200, { user, accessToken })
})

export const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies[REFRESH_COOKIE_NAME]
  try {
    const { accessToken, refreshToken } = await authService.refreshTokens({
      refreshToken: incomingToken,
      deviceInfo: deviceInfoFrom(req),
    })
    setRefreshTokenCookie(res, refreshToken)
    ApiResponse.send(res, 200, { accessToken })
  } catch (err) {
    // Whatever went wrong, this browser's cookie is dead either way —
    // don't leave it sitting there to be resent on every future request.
    clearRefreshTokenCookie(res)
    throw err
  }
})

export const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies[REFRESH_COOKIE_NAME]
  await authService.logoutUser({ refreshToken: incomingToken })
  clearRefreshTokenCookie(res)
  ApiResponse.send(res, 200, { message: 'Logged out' })
})

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id)
  ApiResponse.send(res, 200, { user })
})

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body)
  ApiResponse.send(res, 200, { message: 'Email verified' })
})

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerificationEmail(req.user.id)
  ApiResponse.send(res, 200, { message: 'Verification email sent' })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body)
  ApiResponse.send(res, 200, {
    message: 'If that email is registered, a password reset link has been sent.',
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body)
  ApiResponse.send(res, 200, { message: 'Password reset successful. Please log in again.' })
})
