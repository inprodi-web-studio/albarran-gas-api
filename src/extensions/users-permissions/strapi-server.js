const authRoutes          = require("./routes/auth");
const customerRoutes      = require("./routes/customer");
const authServices        = require("./services/auth");
const authControllers     = require("./controllers/auth");
const customerControllers = require("./controllers/customer");

module.exports = ( plugin ) => {
    authRoutes(plugin);
    customerRoutes(plugin);

    authServices(plugin);

    authControllers(plugin);
    customerControllers(plugin);

    return plugin;
};