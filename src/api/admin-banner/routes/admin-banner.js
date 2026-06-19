module.exports = {
  routes: [
    {
      method: "GET",
      path: "/admin/banners",
      handler: "admin-banner.find",
    },
    {
      method: "POST",
      path: "/admin/banners",
      handler: "admin-banner.create",
    },
    {
      method: "PUT",
      path: "/admin/banners/:uuid",
      handler: "admin-banner.update",
    },
    {
      method: "DELETE",
      path: "/admin/banners/:uuid",
      handler: "admin-banner.delete",
    },
  ],
};
