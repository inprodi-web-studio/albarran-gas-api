"use strict";

const { FLEET, LOAD, FLEET_LEVEL } = require("../../../constants/models");
const { findMany } = require("../../../helpers");
const { ForbiddenError, NotFoundError } = require("../../../helpers/errors");
const { validateCreateFleet, validateJoinFleet } = require("../validation");

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

const normalizeJoinFleetData = (data = {}) => ({
    code : normalizeString(data.code),
});

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const mapLevel = (level, number = null) => {
    if (!level) {
        return null;
    }

    return {
        uuid : level.uuid ?? null,
        number,
        name : level.name ?? "",
        min : toNumber(level.min),
        max : toNumber(level.max),
        discount : toNumber(level.discount),
    };
};

const getFleetLevels = async (strapi) => {
    return strapi.db.query(FLEET_LEVEL).findMany({
        select : ["uuid", "name", "min", "max", "discount"],
        orderBy : {
            min : "asc",
        },
    });
};

const fleetDetailPopulate = {
    owner : {
        fields : ["id", "uuid", "name", "lastName"],
    },
    users : {
        fields : ["id"],
    },
};

const buildFleetLevelInfo = (totalLiters, levels = []) => {
    const liters = parseFloat(toNumber(totalLiters).toFixed(2));

    if (!Array.isArray(levels) || levels.length === 0) {
        return {
            level : null,
            nextLevel : null,
            progress : {
                currentLiters : liters,
                percentToNextLevel : 0,
                litersToNextLevel : 0,
                rangeStart : 0,
                rangeEnd : 0,
            },
        };
    }

    const sortedLevels = levels.slice().sort((a, b) => {
        return toNumber(a.min) - toNumber(b.min);
    });

    let currentLevelIndex = sortedLevels.findIndex((level) => {
        const min = toNumber(level.min);
        const max = toNumber(level.max, Number.POSITIVE_INFINITY);

        return liters >= min && liters <= max;
    });

    if (currentLevelIndex === -1) {
        if (liters < toNumber(sortedLevels[0].min)) {
            currentLevelIndex = 0;
        } else {
            currentLevelIndex = sortedLevels.length - 1;
        }
    }

    const currentLevelRaw = sortedLevels[currentLevelIndex];
    const nextLevelRaw = currentLevelIndex < sortedLevels.length - 1
        ? sortedLevels[currentLevelIndex + 1]
        : null;

    const currentMin = toNumber(currentLevelRaw?.min);
    const currentMax = toNumber(currentLevelRaw?.max, currentMin);
    const nextMin = nextLevelRaw ? toNumber(nextLevelRaw.min, currentMax) : currentMax;

    let percentToNextLevel = nextLevelRaw
        ? ((liters - currentMin) / (nextMin - currentMin)) * 100
        : 100;

    if (!Number.isFinite(percentToNextLevel)) {
        percentToNextLevel = nextLevelRaw ? 0 : 100;
    }

    percentToNextLevel = Math.min(100, Math.max(0, percentToNextLevel));

    const litersToNextLevel = nextLevelRaw ? Math.max(0, nextMin - liters) : 0;

    return {
        level : mapLevel(currentLevelRaw, currentLevelIndex + 1),
        nextLevel : mapLevel(
            nextLevelRaw,
            nextLevelRaw ? currentLevelIndex + 2 : null
        ),
        progress : {
            currentLiters : liters,
            percentToNextLevel : parseFloat(percentToNextLevel.toFixed(2)),
            litersToNextLevel : parseFloat(litersToNextLevel.toFixed(2)),
            rangeStart : parseFloat(currentMin.toFixed(2)),
            rangeEnd : parseFloat((nextLevelRaw ? nextMin : currentMax).toFixed(2)),
        },
    };
};

const buildFleetDetailResponse = async (strapi, fleet, userId) => {
    const users = Array.isArray(fleet.users) ? fleet.users : [];
    const loads = await strapi.db.query(LOAD).findMany({
        where : {
            fleet : fleet.id,
        },
        select : ["quantity"],
    });

    const totalLiters = loads.reduce((accumulator, load) => {
        return accumulator + Number(load.quantity ?? 0);
    }, 0);

    const fleetLevels = await getFleetLevels(strapi);
    const levelInfo = buildFleetLevelInfo(totalLiters, fleetLevels);
    const ownerId = typeof fleet.owner === "object" ? fleet.owner?.id : fleet.owner;
    const owner = typeof fleet.owner === "object" ? {
        uuid : fleet.owner?.uuid,
        name : fleet.owner?.name,
        lastName : fleet.owner?.lastName,
    } : null;

    return {
        uuid : fleet.uuid,
        name : fleet.name,
        code : fleet.code,
        owner,
        isOwner : Number(ownerId) === Number(userId),
        usersCount : users.length,
        totalLiters : parseFloat(totalLiters.toFixed(2)),
        ...levelInfo,
    };
};

module.exports = createCoreController(FLEET, ({ strapi }) => ({
    async find(ctx) {
        const { id: userId, uuid: userUuid } = ctx.state.user;

        const fleets = await findMany(FLEET, fleetFields, {
            users : {
                id : userId,
            },
        });
        const fleetLevels = await getFleetLevels(strapi);

        const fleetsWithStats = await Promise.all(
            fleets.data.map(async ({ users, ...fleet }) => {
                const loads = await strapi.db.query(LOAD).findMany({
                    where : {
                        fleet : fleet.id,
                    },
                    select : ["quantity"],
                });

                const totalLiters = loads.reduce((accumulator, load) => {
                    return accumulator + Number(load.quantity ?? 0);
                }, 0);

                const ownerUuid = typeof fleet.owner === "object" ? fleet.owner?.uuid : null;
                const levelInfo = buildFleetLevelInfo(totalLiters, fleetLevels);

                return {
                    ...fleet,
                    usersCount : Array.isArray(users) ? users.length : 0,
                    isOwner : ownerUuid === userUuid,
                    totalLiters : parseFloat(totalLiters.toFixed(2)),
                    ...levelInfo,
                };
            })
        );

        return {
            ...fleets,
            data : fleetsWithStats,
        };
    },

    async findOne_Customer(ctx) {
        const { id: userId } = ctx.state.user;
        const { id: uuid } = ctx.params;

        const fleet = await strapi.query(FLEET).findOne({
            where : {
                uuid,
            },
            populate : fleetDetailPopulate,
        });

        if (!fleet) {
            throw new NotFoundError("Fleet not found.", {
                key : "fleet.notFound",
                path : ctx.request.path,
            });
        }

        const users = Array.isArray(fleet.users) ? fleet.users : [];
        const isMember = users.some((user) => Number(user.id) === Number(userId));

        if (!isMember) {
            throw new ForbiddenError("You are not part of this fleet.", {
                key : "fleet.forbidden",
                path : ctx.request.path,
            });
        }

        return await buildFleetDetailResponse(strapi, fleet, userId);
    },

    async join_Customer(ctx) {
        const { id: userId } = ctx.state.user;
        const data = normalizeJoinFleetData(ctx.request.body);

        await validateJoinFleet(data);

        const fleet = await strapi.query(FLEET).findOne({
            where : {
                code : data.code,
            },
            populate : fleetDetailPopulate,
        });

        if (!fleet) {
            throw new NotFoundError("Fleet not found.", {
                key : "fleet.notFound",
                path : ctx.request.path,
            });
        }

        const users = Array.isArray(fleet.users) ? fleet.users : [];
        const userIds = users.map((user) => {
            return Number(user.id);
        });

        if (!userIds.includes(Number(userId))) {
            await strapi.entityService.update(FLEET, fleet.id, {
                data : {
                    users : [...new Set([...userIds, Number(userId)])],
                },
            });
        }

        const updatedFleet = await strapi.query(FLEET).findOne({
            where : {
                id : fleet.id,
            },
            populate : fleetDetailPopulate,
        });

        return await buildFleetDetailResponse(strapi, updatedFleet, userId);
    },

    async create(ctx) {
        const { id: userId } = ctx.state.user;
        const data = normalizeFleetData(ctx.request.body);

        await validateCreateFleet(data);

        const code = await strapi.service(FLEET).generateUniqueCode();
        const fleetLevels = await getFleetLevels(strapi);
        const levelInfo = buildFleetLevelInfo(0, fleetLevels);

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
            isOwner : true,
            totalLiters : 0,
            ...levelInfo,
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
