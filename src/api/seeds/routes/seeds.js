module.exports = {
    routes: [
      {
        method: "POST",
        path: "/seeds",
        handler: "seeds.generateSeeds",
        config: {
            policies: [],
            auth: false,
          },
      },
      {
        method: "POST",
        path: "/seeds/admin-demo",
        handler: "seeds.generateAdminDemoSeeds",
        config: {
            policies: [],
            auth: false,
          },
      },
    ],
};
