"use strict";

const { uuid } = require("uuidv4");

const { USER } = require("./constants/models");

module.exports = {
  register(/*{ strapi }*/) {},

  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models : [
        USER,
      ],
      async beforeCreate( event ) {
        const { data } = event.params;

        data.uuid = uuid();
      },
    });
  },
};
