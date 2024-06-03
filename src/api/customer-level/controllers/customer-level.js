'use strict';

/**
 * customer-level controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::customer-level.customer-level');
