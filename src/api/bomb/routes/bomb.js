'use strict';

/**
 * bomb router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::bomb.bomb');
