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
    ],
};