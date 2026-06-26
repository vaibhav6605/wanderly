import * as categoriesService from './categories.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'
import { PERMISSIONS } from '#config/permissions.js'
import { roleHasPermission } from '#config/permissions.js'

const isAdmin = (req) => roleHasPermission(req.user?.role, PERMISSIONS.MANAGE_CATEGORIES)

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoriesService.listCategories({
    includeInactive: isAdmin(req),
  })
  ApiResponse.send(res, 200, { categories })
})

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoriesService.createCategory(req.body)
  ApiResponse.send(res, 201, { category })
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoriesService.updateCategory(req.params.id, req.body)
  ApiResponse.send(res, 200, { category })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoriesService.deleteCategory(req.params.id)
  ApiResponse.send(res, 200, { message: 'Category deleted' })
})
