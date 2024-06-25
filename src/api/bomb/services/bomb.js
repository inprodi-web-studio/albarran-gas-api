'use strict';

/**
 * bomb service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::bomb.bomb');
