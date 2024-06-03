const _   = require("lodash");
const jwt = require("jsonwebtoken");

const generateToken = (payload, jwtOptions) => {
    _.defaults(jwtOptions, strapi.config.get("plugin.users-permissions.jwt"));
    return jwt.sign(
      _.clone(payload.toJSON ? payload.toJSON() : payload),
      strapi.config.get("plugin.users-permissions.jwtSecret"),
      jwtOptions
    );
};

module.exports = generateToken;