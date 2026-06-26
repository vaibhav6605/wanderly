import * as listingsService from './listings.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'

export const listTours = asyncHandler(async (req, res) => {
  const showAll = req.user?.role === 'admin' && req.query.showAll === 'true'
  const { tours, meta } = await listingsService.listTours({ ...req.query, showAll })
  ApiResponse.send(res, 200, { tours }, meta)
})

export const getTour = asyncHandler(async (req, res) => {
  const tour = await listingsService.getTour(req.params.id)
  ApiResponse.send(res, 200, { tour })
})

export const getRelatedTours = asyncHandler(async (req, res) => {
  const tours = await listingsService.getRelatedTours(req.params.id)
  ApiResponse.send(res, 200, { tours })
})

export const getRecommended = asyncHandler(async (req, res) => {
  const tours = await listingsService.getRecommended()
  ApiResponse.send(res, 200, { tours })
})

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await listingsService.getCategories()
  ApiResponse.send(res, 200, { categories })
})

export const getDestinations = asyncHandler(async (req, res) => {
  const destinations = await listingsService.getDestinations(req.query.search)
  ApiResponse.send(res, 200, { destinations })
})

export const createTour = asyncHandler(async (req, res) => {
  const tour = await listingsService.createTour(req.body, req.user.id)
  ApiResponse.send(res, 201, { tour })
})

export const updateTour = asyncHandler(async (req, res) => {
  const tour = await listingsService.updateTour(req.params.id, req.body)
  ApiResponse.send(res, 200, { tour })
})

export const deleteTour = asyncHandler(async (req, res) => {
  await listingsService.deleteTour(req.params.id)
  ApiResponse.send(res, 200, { message: 'Tour deactivated successfully' })
})
