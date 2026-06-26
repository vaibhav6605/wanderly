import * as reviewsService from './reviews.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'
import { PERMISSIONS } from '#config/permissions.js'
import { roleHasPermission } from '#config/permissions.js'

const isAdmin = (req) => roleHasPermission(req.user?.role, PERMISSIONS.MANAGE_REVIEWS)

export const listReviews = asyncHandler(async (req, res) => {
  const { reviews, meta, ratingDistribution } = await reviewsService.listReviews({
    isAdmin: isAdmin(req),
    ...req.query,
  })
  ApiResponse.send(res, 200, { reviews, ratingDistribution }, meta)
})

export const getMyStatus = asyncHandler(async (req, res) => {
  const status = await reviewsService.getMyStatus(req.user.id, req.query.tourId)
  ApiResponse.send(res, 200, status)
})

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewsService.createReview({ userId: req.user.id, ...req.body })
  ApiResponse.send(res, 201, { review })
})

export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewsService.updateReview(
    req.params.id,
    req.user.id,
    isAdmin(req),
    req.body,
  )
  ApiResponse.send(res, 200, { review })
})

export const approveReview = asyncHandler(async (req, res) => {
  const review = await reviewsService.approveReview(req.params.id, req.body.isApproved)
  ApiResponse.send(res, 200, { review })
})

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewsService.deleteReview(req.params.id, req.user.id, isAdmin(req))
  ApiResponse.send(res, 200, { message: 'Review deleted' })
})
