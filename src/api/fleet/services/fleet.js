"use strict";

const { FLEET } = require("../../../constants/models");
const generateRandomCode = require("../../../helpers/generateRandomCode");

const { createCoreService } = require("@strapi/strapi").factories;

const FLEET_CODE_LENGTH = 10;
const MAX_GENERATION_ATTEMPTS = 25;

module.exports = createCoreService(FLEET, ({ strapi }) => ({
    async generateUniqueCode() {
        for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            const code = generateRandomCode(FLEET_CODE_LENGTH);

            const existingCodeCount = await strapi.query(FLEET).count({
                where : {
                    code,
                },
            });

            if (existingCodeCount === 0) {
                return code;
            }
        }

        throw new Error("Unable to generate a unique fleet code.");
    },
}));
