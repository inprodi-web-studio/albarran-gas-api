'use strict';

/**
 * fiscal service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::fiscal.fiscal');
