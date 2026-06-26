import * as adminService from './admin.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'

export const overview = asyncHandler(async (req, res) => {
  const data = await adminService.getOverview()
  ApiResponse.send(res, 200, data)
})

export const trends = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days ?? 30), 90)
  const data = await adminService.getTrends({ days })
  ApiResponse.send(res, 200, { trends: data })
})

export const topTours = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 5), 10)
  const data = await adminService.getTopTours({ limit })
  ApiResponse.send(res, 200, { tours: data })
})
