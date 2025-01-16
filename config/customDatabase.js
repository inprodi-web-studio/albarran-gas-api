module.exports = {
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
};