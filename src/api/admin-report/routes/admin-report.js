module.exports = {
  routes: [
    {
      method: "GET",
      path: "/admin/reports/options",
      handler: "admin-report.getOptions",
    },
    {
      method: "GET",
      path: "/admin/reports/loads",
      handler: "admin-report.getLoads",
    },
    {
      method: "GET",
      path: "/admin/reports/discounts",
      handler: "admin-report.getDiscounts",
    },
    {
      method: "GET",
      path: "/admin/reports/invoices",
      handler: "admin-report.getInvoices",
    },
    {
      method: "GET",
      path: "/admin/reports/customers",
      handler: "admin-report.getCustomers",
    },
    {
      method: "GET",
      path: "/admin/reports/shifts",
      handler: "admin-report.getShiftReports",
    },
    {
      method: "GET",
      path: "/admin/reports/shifts/:uuid/pdf",
      handler: "admin-report.downloadShiftReportPdf",
    },
  ],
};
