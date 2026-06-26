import * as wishlistService from './wishlist.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'

export const listWishlist = asyncHandler(async (req, res) => {
  const { items, meta } = await wishlistService.listWishlist(req.user.id, req.query)
  ApiResponse.send(res, 200, { items }, meta)
})

export const getWishlistIds = asyncHandler(async (req, res) => {
  const ids = await wishlistService.getWishlistIds(req.user.id)
  ApiResponse.send(res, 200, { ids })
})

export const addToWishlist = asyncHandler(async (req, res) => {
  await wishlistService.addToWishlist(req.user.id, req.body.tourId)
  ApiResponse.send(res, 201, { message: 'Added to wishlist' })
})

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlist(req.user.id, req.params.tourId)
  ApiResponse.send(res, 200, { message: 'Removed from wishlist' })
})
