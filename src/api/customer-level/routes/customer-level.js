'use strict';

/**
 * customer-level router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::customer-level.customer-level');
