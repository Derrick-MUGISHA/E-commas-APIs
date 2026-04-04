'use strict';

const express = require('express');
const { createVariant, updateVariant, deleteVariant, getVariant } =
  require('../controller/Variant.controller');
const { authenticate, requireAdminOrSeller } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { variantSchema, variantUpdateSchema } = require('../validations/schemas');

const router = express.Router();


router.post(
  '/:id/variants',
  authenticate,
  requireAdminOrSeller,
  validateSchema(variantSchema),
  createVariant
);


router.get('/:id/variants/:variantId', getVariant);


router.patch(
  '/:id/variants/:variantId',
  authenticate,
  requireAdminOrSeller,
  validateSchema(variantUpdateSchema),
  updateVariant
);


router.delete('/:id/variants/:variantId', authenticate, requireAdminOrSeller, deleteVariant);

module.exports = router;