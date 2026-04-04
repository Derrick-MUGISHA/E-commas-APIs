'use strict';

const prisma = require('../config/db');

/**
 * Audit Logger Utility
 * Records administrative actions to the database.
 * 
 * @param {string} action - The action performed (e.g. "CREATE_PRODUCT")
 * @param {string} target - The ID of the affected document
 * @param {string} userId - The ID of the user who performed the action
 */
const logAction = async (action, target, userId) => {
  try {
    await prisma.log.create({
      data: {
        action,
        target,
        userId
      }
    });
  } catch (error) {
    console.error('❌ Logging Error:', error.message);
    // We don't want to fail the main request if logging fails, but we record it locally.
  }
};

module.exports = { logAction };
