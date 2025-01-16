module.exports = {
    routes: [
      {
        method: "GET",
        path: "/customer/branches/:branch",
        handler: "branch.findOne",
      },
    ],
};