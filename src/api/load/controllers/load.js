'use strict';

/**
 * load controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::load.load');
