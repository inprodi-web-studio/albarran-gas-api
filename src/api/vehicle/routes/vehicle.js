"use strict";

/**
 * vehicle router
 */

const { VEHICLE } = require("../../../constants/models");
const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter(VEHICLE, {
    only : ["find", "create", "update", "delete"],
});
