module.exports = {
  bohemio: {
    client: process.env.BOHEMIO_DATABASE_CLIENT,
    connection: {
      host: process.env.BOHEMIO_DATABASE_HOST,
      database: process.env.BOHEMIO_DATABASE_NAME,
      user: process.env.BOHEMIO_DATABASE_USERNAME,
      password: process.env.BOHEMIO_DATABASE_PASSWORD,
      options: {
        port: parseInt(process.env.BOHEMIO_DATABASE_PORT),
        enableArithAbort: true,
      },
    },
    pool: {
      min: process.env.DATABASE_POOL_MIN ?? 2,
      max: process.env.DATABASE_POOL_MAX ?? 10,
    },
  },
  navarrol: {
    client: process.env.NAVARROL_DATABASE_CLIENT,
    connection: {
      host: process.env.NAVARROL_DATABASE_HOST,
      database: process.env.NAVARROL_DATABASE_NAME,
      user: process.env.NAVARROL_DATABASE_USERNAME,
      password: process.env.NAVARROL_DATABASE_PASSWORD,
      options: {
        port: parseInt(process.env.NAVARROL_DATABASE_PORT),
        enableArithAbort: true,
      },
    },
    pool: {
      min: process.env.DATABASE_POOL_MIN ?? 2,
      max: process.env.DATABASE_POOL_MAX ?? 10,
    },
  },
  lopez: {
    client: process.env.LOPEZ_MATEOS_DATABASE_CLIENT,
    connection: {
      host: process.env.LOPEZ_MATEOS_DATABASE_HOST,
      database: process.env.LOPEZ_MATEOS_DATABASE_NAME,
      user: process.env.LOPEZ_MATEOS_DATABASE_USERNAME,
      password: process.env.LOPEZ_MATEOS_DATABASE_PASSWORD,
      options: {
        port: parseInt(process.env.LOPEZ_MATEOS_DATABASE_PORT),
        enableArithAbort: true,
      },
    },
    pool: {
      min: process.env.DATABASE_POOL_MIN ?? 2,
      max: process.env.DATABASE_POOL_MAX ?? 10,
    },
  },
  alamo: {
    client: process.env.ALAMO_DATABASE_CLIENT,
    connection: {
      host: process.env.ALAMO_DATABASE_HOST,
      database: process.env.ALAMO_DATABASE_NAME,
      user: process.env.ALAMO_DATABASE_USERNAME,
      password: process.env.ALAMO_DATABASE_PASSWORD,
      options: {
        port: parseInt(process.env.ALAMO_DATABASE_PORT),
        enableArithAbort: true,
      },
    },
    pool: {
      min: process.env.DATABASE_POOL_MIN ?? 2,
      max: process.env.DATABASE_POOL_MAX ?? 10,
    },
  },
  arenal: {
    client: process.env.ARENAL_DATABASE_CLIENT,
    connection: {
      host: process.env.ARENAL_DATABASE_HOST,
      database: process.env.ARENAL_DATABASE_NAME,
      user: process.env.ARENAL_DATABASE_USERNAME,
      password: process.env.ARENAL_DATABASE_PASSWORD,
      options: {
        port: parseInt(process.env.ARENAL_DATABASE_PORT),
        enableArithAbort: true,
      },
    },
    pool: {
      min: process.env.DATABASE_POOL_MIN ?? 2,
      max: process.env.DATABASE_POOL_MAX ?? 10,
    },
  },
};