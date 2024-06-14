module.exports = {
    client     : process.env.PETROTECH_DATABASE_CLIENT ?? "mssql",
    connection : {
        host     : process.env.PETROTECH_DATABASE_HOST ?? "petrotech.ddns.net",
        database : process.env.PETROTECH_DATABASE_NAME ?? "PRUEBAS",
        user     : process.env.PETROTECH_DATABASE_USERNAME,
        password : process.env.PETROTECH_DATABASE_PASSWORD,
        options : {
            port             : parseInt( process.env.PETROTECH_DATABASE_PORT ),
            enableArithAbort : true,
        },
      },
    pool : {
      min : process.env.DATABASE_POOL_MIN ?? 2,
      max : process.env.DATABASE_POOL_MAX ?? 10,
    },
};