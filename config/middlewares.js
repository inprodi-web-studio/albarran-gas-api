module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  "global::errors",
  {
    name   : "strapi::poweredBy",
    config : {
      poweredBy : "Inprodi Web Studio",
    },
  },
];
