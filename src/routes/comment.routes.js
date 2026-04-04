'use strict';

const express = require('express');
const {
    createComment,
    getComments,
    deleteComment,
    reactToComment,
} = require('../controller/Comment.controller');
const { authenticate } = require('../middleware/Auth.middleware');
const { validateSchema } = require('../middleware/Zod.middleware');
const { createCommentSchema, commentReactionSchema } = require('../validations/schemas');

const router = express.Router();


router.get('/', getComments);


router.post(
    '/',
    authenticate,
    validateSchema(createCommentSchema),
    createComment
);


router.post(
    '/:id/react',
    authenticate,
    validateSchema(commentReactionSchema),
    reactToComment
);


router.delete('/:id', authenticate, deleteComment);

module.exports = router;