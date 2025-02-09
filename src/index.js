"use strict";

const { uuid } = require("uuidv4");

const { USER, BOMB, LOAD, CUSTOMER_LEVEL, BANNER, FISCAL } = require("./constants/models");

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models : [
        USER,
        BOMB,
        LOAD,
        FISCAL,
        BANNER,
        CUSTOMER_LEVEL,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
