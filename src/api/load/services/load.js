'use strict';

/**
 * load service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::load.load');
