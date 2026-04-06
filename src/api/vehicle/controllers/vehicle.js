const { VEHICLE } = require("../../../constants/models");
const { findMany } = require("../../../helpers");
const { BadRequestError, ConflictError, NotFoundError } = require("../../../helpers/errors");
const { validateCreateVehicle } = require("../validation");

const { createCoreController } = require("@strapi/strapi").factories;

const normalizeString = (value) => {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim();
};

const normalizeNullableString = (value) => {
    if (typeof value !== "string") {
        return value;
    }

    const normalizedValue = value.trim();

    return normalizedValue.length > 0 ? normalizedValue : null;
};

const normalizeVehicleData = (data) => ({
    ...data,
    brand : normalizeString(data.brand),
    model : normalizeString(data.model),
    color : normalizeString(data.color),
    plates : normalizeString(data.plates),
    insurancePolicy : normalizeNullableString(data.insurancePolicy),
    insuranceExpiration : normalizeNullableString(data.insuranceExpiration),
    insuranceCompany : normalizeNullableString(data.insuranceCompany),
});

const vehicleFields = {
    fields : [
        "uuid",
        "brand",
        "model",
        "color",
        "plates",
        "insurancePolicy",
        "insuranceExpiration",
        "insuranceCompany",
    ],
    populate : {
        insuranceCoverPhoto : {
            fields : ["url", "name"],
        },
    },
};

module.exports = createCoreController(VEHICLE, ({ strapi }) => ({
    async uploadInsuranceCover(ctx) {
        const file = ctx.request?.files?.file;

        if (!file) {
            throw new BadRequestError("Insurance cover image is required.", {
                key : "vehicle.insuranceCoverRequired",
                path : ctx.request.path,
            });
        }

        const uploadedFiles = await strapi.plugin("upload").service("upload").upload({
            data : {},
            files : file,
        });

        const uploadedFile = uploadedFiles?.[0];

        if (!uploadedFile?.id) {
            throw new BadRequestError("Insurance cover image could not be uploaded.", {
                key : "vehicle.insuranceCoverUploadFailed",
                path : ctx.request.path,
            });
        }

        return {
            id : uploadedFile.id,
            url : uploadedFile.url,
            name : uploadedFile.name,
        };
    },

    async find(ctx) {
        const { id: userId } = ctx.state.user;

        const vehicles = await findMany(VEHICLE, vehicleFields, {
            user : userId,
        });

        return vehicles;
    },

    async create(ctx) {
        const data = normalizeVehicleData(ctx.request.body);
        const { id: userId } = ctx.state.user;

        await validateCreateVehicle(data);

        const duplicatedPlates = await strapi.query(VEHICLE).count({
            where : {
                user : userId,
                plates : data.plates,
            },
        });

        if (duplicatedPlates > 0) {
            throw new ConflictError("Vehicle already exists with these plates.", {
                key : "vehicle.duplicatedPlates",
                path : ctx.request.path,
            });
        }

        if (data.insurancePolicy) {
            const duplicatedInsurancePolicy = await strapi.query(VEHICLE).count({
                where : {
                    user : userId,
                    insurancePolicy : data.insurancePolicy,
                },
            });

            if (duplicatedInsurancePolicy > 0) {
                throw new ConflictError("Vehicle already exists with this insurance policy.", {
                    key : "vehicle.duplicatedInsurancePolicy",
                    path : ctx.request.path,
                });
            }
        }

        const newVehicle = await strapi.entityService.create(VEHICLE, {
            data : {
                ...data,
                user : userId,
            },
            ...vehicleFields,
        });

        return newVehicle;
    },

    async delete(ctx) {
        const { id: uuid } = ctx.params;
        const { id: userId } = ctx.state.user;

        const vehicle = await strapi.query(VEHICLE).findOne({
            where : {
                uuid,
                user : userId,
            },
        });

        if (!vehicle) {
            throw new NotFoundError("Vehicle not found.", {
                key : "vehicle.notFound",
                path : ctx.request.path,
            });
        }

        const deletedVehicle = await strapi.entityService.delete(VEHICLE, vehicle.id);

        return deletedVehicle;
    },
}));
