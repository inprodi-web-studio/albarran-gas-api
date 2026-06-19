"use strict";

const { BANNER } = require("../../../constants/models");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../../../helpers/errors");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const bannerFields = ["id", "uuid", "createdAt", "updatedAt"];
const bannerPopulate = {
  image: {
    fields: ["id", "url", "name", "mime", "size", "width", "height", "formats", "provider"],
  },
};

const firstValue = (value) => Array.isArray(value) ? value[0] : value;

const assertAdmin = (ctx) => {
  if (ctx.state.user?.type !== "admin") {
    throw new ForbiddenError("Only admins can access this resource.", {
      key: "auth.adminOnly",
      path: ctx.request.path,
    });
  }
};

const getPagination = (query = {}) => {
  const parsedPage = Number(firstValue(query.page));
  const parsedLimit = Number(firstValue(query.limit));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(Math.floor(parsedLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;

  return {
    page,
    limit,
    start: (page - 1) * limit,
  };
};

const parseSort = (value) => {
  const allowedFields = ["createdAt", "updatedAt", "uuid"];
  const rawValue = String(firstValue(value) || "createdAt:desc");
  const [rawField, rawDirection = "desc"] = rawValue.split(":");
  const field = allowedFields.includes(rawField) ? rawField : "createdAt";
  const direction = rawDirection === "asc" ? "asc" : "desc";

  return `${field}:${direction}`;
};

const getUploadFile = (ctx) => {
  const file = ctx.request?.files?.file;

  if (Array.isArray(file)) {
    return file[0];
  }

  return file;
};

const assertImageFile = (file, path) => {
  if (!file) {
    throw new BadRequestError("Banner image is required.", {
      key: "banner.imageRequired",
      path,
    });
  }

  if (file.type && !String(file.type).startsWith("image/")) {
    throw new BadRequestError("Banner file must be an image.", {
      key: "banner.imageInvalid",
      path,
    });
  }
};

const uploadBannerImage = async (file) => {
  const uploadedFiles = await strapi.plugin("upload").service("upload").upload({
    data: {},
    files: file,
  });
  const uploadedFile = uploadedFiles?.[0];

  if (!uploadedFile?.id) {
    throw new BadRequestError("Banner image could not be uploaded.", {
      key: "banner.imageUploadFailed",
    });
  }

  return uploadedFile;
};

const removeUploadFile = async (file) => {
  if (!file?.id) {
    return;
  }

  try {
    await strapi.plugin("upload").service("upload").remove(file);
  } catch (error) {
    strapi.log.warn(`Could not remove banner image ${file.id}: ${error.message}`);
  }
};

const formatBanner = (banner) => ({
  uuid: banner.uuid,
  createdAt: banner.createdAt,
  updatedAt: banner.updatedAt,
  image: banner.image
    ? {
        id: banner.image.id,
        url: banner.image.url,
        name: banner.image.name,
        mime: banner.image.mime,
        size: banner.image.size,
        width: banner.image.width || null,
        height: banner.image.height || null,
      }
    : null,
});

const findBannerByUuid = async (uuid) => {
  const banner = await strapi.db.query(BANNER).findOne({
    where: {
      uuid,
    },
    select: bannerFields,
    populate: bannerPopulate,
  });

  if (!banner) {
    throw new NotFoundError("Banner not found.", {
      key: "banner.notFound",
      path: "uuid",
    });
  }

  return banner;
};

module.exports = {
  async find(ctx) {
    assertAdmin(ctx);

    const pagination = getPagination(ctx.query || {});
    const totalDocs = await strapi.db.query(BANNER).count();
    const banners = await strapi.entityService.findMany(BANNER, {
      fields: bannerFields,
      populate: bannerPopulate,
      start: pagination.start,
      limit: pagination.limit,
      sort: [parseSort(ctx.query?.sort)],
    });

    return {
      data: banners.map(formatBanner),
      meta: {
        totalDocs,
        limit: pagination.limit,
        page: pagination.page,
        totalPages: Math.max(Math.ceil(totalDocs / pagination.limit), 1),
      },
    };
  },

  async create(ctx) {
    assertAdmin(ctx);

    const file = getUploadFile(ctx);
    assertImageFile(file, ctx.request.path);

    const uploadedFile = await uploadBannerImage(file);
    const banner = await strapi.entityService.create(BANNER, {
      data: {
        image: uploadedFile.id,
      },
      fields: bannerFields,
      populate: bannerPopulate,
    });

    return formatBanner(banner);
  },

  async update(ctx) {
    assertAdmin(ctx);

    const existingBanner = await findBannerByUuid(ctx.params.uuid);
    const file = getUploadFile(ctx);
    assertImageFile(file, ctx.request.path);

    const uploadedFile = await uploadBannerImage(file);
    const banner = await strapi.entityService.update(BANNER, existingBanner.id, {
      data: {
        image: uploadedFile.id,
      },
      fields: bannerFields,
      populate: bannerPopulate,
    });

    await removeUploadFile(existingBanner.image);

    return formatBanner(banner);
  },

  async delete(ctx) {
    assertAdmin(ctx);

    const existingBanner = await findBannerByUuid(ctx.params.uuid);
    const banner = await strapi.entityService.delete(BANNER, existingBanner.id, {
      fields: bannerFields,
      populate: bannerPopulate,
    });

    await removeUploadFile(existingBanner.image);

    return formatBanner(banner);
  },
};
