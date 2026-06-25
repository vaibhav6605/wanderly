import * as usersService from './users.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'

export const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await usersService.listUsers(req.query)
  ApiResponse.send(res, 200, { users }, meta)
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id)
  ApiResponse.send(res, 200, { user })
})

export const setBanned = asyncHandler(async (req, res) => {
  const user = await usersService.setUserBanned(req.params.id, req.body.isBanned)
  ApiResponse.send(res, 200, { user })
})

export const setRole = asyncHandler(async (req, res) => {
  const user = await usersService.setUserRole(req.params.id, req.body.role)
  ApiResponse.send(res, 200, { user })
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = await usersService.updateOwnProfile(req.user.id, req.body)
  ApiResponse.send(res, 200, { user })
})
