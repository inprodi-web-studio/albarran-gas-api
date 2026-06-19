"use strict";

const { uuid } = require("uuidv4");

const { USER, BOMB, LOAD, CUSTOMER_LEVEL, BANNER, FISCAL, VEHICLE, FLEET, FLEET_LEVEL, PROMOTION, DISPATCHER_SHIFT } = require("./constants/models");

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models : [
        USER,
        BOMB,
        LOAD,
        FISCAL,
        VEHICLE,
        FLEET,
        BANNER,
        DISPATCHER_SHIFT,
        CUSTOMER_LEVEL,
        FLEET_LEVEL,
        PROMOTION,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
