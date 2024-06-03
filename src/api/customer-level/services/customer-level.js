'use strict';

/**
 * customer-level service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::customer-level.customer-level');
