const _ = require("lodash");

const roles             = require("../permissions/roles");
const { ROLE }          = require("../constants/models");
const permissionsParser = require("../permissions");

const generateRoles = async (strapi) => {
    console.log("Generating roles...");

    const ROLES = Object.keys(roles);

    for ( const role of ROLES ) {
        const permissionsObject = permissionsParser(role);

        const newRole = await strapi.entityService.create(ROLE, {
            data : {
                name : role,
                description : roles[role].meta.description,
                type : roles[role].meta.type,
            },
        });

        const createPermissions = _.flatMap(permissionsObject, (type, typeName) => {
            return _.flatMap(type.controllers, (controller, controllerName) => {
              return _.reduce(
                controller,
                (acc, action, actionName) => {
                  const { enabled /* policy */ } = action;
      
                  if (enabled) {
                    const actionID = `${typeName}.${controllerName}.${actionName}`;
      
                    acc.push(strapi.query("plugin::users-permissions.permission").create({ data: { action: actionID, role: newRole.id } }));
                  }
      
                  return acc;
                },
                [],
              );
            });
        });

        await Promise.all(createPermissions);
    }
};

module.exports = generateRoles;