"use strict";

const { FLEET, LOAD } = require("../../../constants/models");
const { findMany } = require("../../../helpers");
const { ForbiddenError, NotFoundError } = require("../../../helpers/errors");
const { validateCreateFleet } = require("../validation");

const { createCoreController } = require("@strapi/strapi").factories;

const fleetFields = {
    fields : ["uuid", "name", "code"],
    populate : {
        owner : {
            fields : ["uuid", "name", "lastName"],
        },
        users : {
            fields : ["id"],
        },
    },
};

const normalizeString = (value) => {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim();
};

const normalizeFleetData = (data = {}) => ({
    name : normalizeString(data.name),
});

module.exports = createCoreController(FLEET, ({ strapi }) => ({
    async find(ctx) {
        const { id: userId } = ctx.state.user;

        const fleets = await findMany(FLEET, fleetFields, {
            users : userId,
        });

        const fleetsWithUsersCount = fleets.data.map(({ users, ...fleet }) => ({
            ...fleet,
            usersCount : Array.isArray(users) ? users.length : 0,
        }));

        return {
            ...fleets,
            data : fleetsWithUsersCount,
        };
    },

    async create(ctx) {
        const { id: userId } = ctx.state.user;
        const data = normalizeFleetData(ctx.request.body);

        await validateCreateFleet(data);

        const code = await strapi.service(FLEET).generateUniqueCode();

        const newFleet = await strapi.entityService.create(FLEET, {
            data : {
                ...data,
                code,
                owner : userId,
                users : [userId],
            },
            ...fleetFields,
        });

        const { users, ...fleetData } = newFleet;

        return {
            ...fleetData,
            usersCount : Array.isArray(users) ? users.length : 0,
        };
    },

    async delete(ctx) {
        const { id: userId } = ctx.state.user;
        const { id: uuid } = ctx.params;

        const fleet = await strapi.query(FLEET).findOne({
            where : {
                uuid,
            },
            populate : {
                owner : {
                    fields : ["id"],
                },
            },
        });

        if (!fleet) {
            throw new NotFoundError("Fleet not found.", {
                key : "fleet.notFound",
                path : ctx.request.path,
            });
        }

        const ownerId = typeof fleet.owner === "object" ? fleet.owner?.id : fleet.owner;

        if (ownerId !== userId) {
            throw new ForbiddenError("Only the fleet owner can delete this fleet.", {
                key : "fleet.forbiddenDelete",
                path : ctx.request.path,
            });
        }

        await strapi.db.query(LOAD).updateMany({
            where : {
                fleet : fleet.id,
            },
            data : {
                fleet : null,
            },
        });

        const deletedFleet = await strapi.entityService.delete(FLEET, fleet.id);

        return deletedFleet;
    },
}));
