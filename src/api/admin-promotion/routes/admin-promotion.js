module.exports = {
  routes: [
    {
      method: "GET",
      path: "/admin/promotions",
      handler: "admin-promotion.find",
    },
    {
      method: "GET",
      path: "/admin/promotions/:uuid",
      handler: "admin-promotion.findOne",
    },
    {
      method: "POST",
      path: "/admin/promotions",
      handler: "admin-promotion.create",
    },
    {
      method: "PUT",
      path: "/admin/promotions/:uuid",
      handler: "admin-promotion.update",
    },
    {
      method: "DELETE",
      path: "/admin/promotions/:uuid",
      handler: "admin-promotion.delete",
    },
  ],
};
