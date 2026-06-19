"use strict";

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { DISPATCHER_SHIFT, LOAD } = require("../constants/models");

const LOGO_PATH = path.resolve(process.cwd(), "public/uploads/MARCA_ALBARRAN_GASOLINERAS_WHITE_07958a949c.png");

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
};

const roundMoney = (value) => parseFloat(toNumber(value).toFixed(2));

const formatDateTime = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  const pad = (number) => String(number).padStart(2, "0");

  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const formatMoney = (value) => `$${toNumber(value).toFixed(2)}`;

const formatPersonName = (person) => {
  if (!person) {
    return "-";
  }

  return [person.name, person.lastName].filter(Boolean).join(" ").trim() || person.email || "-";
};

const drawReportHeader = (doc) => {
  const startX = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const headerY = doc.page.margins.top;
  const headerHeight = 58;

  doc.save();
  doc.rect(startX, headerY, width, headerHeight).fill("#121E84");
  doc.restore();

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, startX + 16, headerY + 12, {
      fit: [190, 34],
      align: "left",
      valign: "center",
    });
  } else {
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("Albarrán Gasolineras", startX + 16, headerY + 20);
  }

  doc.fillColor("#171717");
  doc.y = headerY + headerHeight + 18;
};

const getShiftLoads = async (shiftId) => {
  const loads = await strapi.db.query(LOAD).findMany({
    where: {
      shift: shiftId,
    },
    select: ["uuid", "date", "quantity", "price", "discount", "total", "product", "promotionTitle"],
    orderBy: {
      date: "asc",
    },
  });

  return loads.map((item) => {
    const quantity = toNumber(item.quantity);
    const price = toNumber(item.price);
    const discount = toNumber(item.discount);
    const subtotal = quantity * price;
    const discountTotal = discount * quantity;
    const total = toNumber(item.total, subtotal - discountTotal);

    return {
      uuid: item.uuid,
      date: item.date,
      product: item.product || "-",
      quantity,
      price,
      subtotal,
      discount,
      discountTotal,
      total,
      promotionTitle: item.promotionTitle || null,
    };
  });
};

const buildShiftTotals = (loads) => {
  const totals = loads.reduce((accumulator, row) => {
    accumulator.loadsCount += 1;
    accumulator.quantity += row.quantity;
    accumulator.subtotal += row.subtotal;
    accumulator.discountTotal += row.discountTotal;
    accumulator.total += row.total;
    return accumulator;
  }, {
    loadsCount: 0,
    quantity: 0,
    subtotal: 0,
    discountTotal: 0,
    total: 0,
  });

  return {
    loadsCount: totals.loadsCount,
    quantity: roundMoney(totals.quantity),
    subtotal: roundMoney(totals.subtotal),
    discountTotal: roundMoney(totals.discountTotal),
    total: roundMoney(totals.total),
  };
};

const buildShiftReportPdf = async ({
  dispatcher,
  shift,
  loads,
}) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 36,
  });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  drawReportHeader(doc);

  doc.fontSize(14).text("Corte de Despachos por Turno", { align: "left" });
  doc.moveDown(0.4);
  doc.fontSize(10).text(`Despachador: ${formatPersonName(dispatcher)}`);
  doc.text(`Sucursal: ${shift.branch || "-"}`);
  doc.text(`Inicio de turno: ${formatDateTime(shift.startedAt)}`);
  doc.text(`Fin de turno: ${formatDateTime(shift.endedAt)}`);
  doc.moveDown(0.6);

  const columns = [
    { key: "date", title: "Hora del despacho", width: 90, align: "left" },
    { key: "quantity", title: "Litros", width: 60, align: "right" },
    { key: "price", title: "Precio", width: 58, align: "right" },
    { key: "subtotal", title: "Subtotal", width: 66, align: "right" },
    { key: "discount", title: "Descuento/litro", width: 82, align: "right" },
    { key: "discountTotal", title: "Descuento total", width: 78, align: "right" },
    { key: "total", title: "Total", width: 58, align: "right" },
  ];

  const startX = doc.page.margins.left;
  const headerY = doc.y;

  let cursorX = startX;
  doc.fontSize(9).font("Helvetica-Bold");
  columns.forEach((column) => {
    doc.text(column.title, cursorX, headerY, {
      width: column.width,
      align: column.align,
    });
    cursorX += column.width;
  });

  let rowY = headerY + 16;
  doc.moveTo(startX, rowY - 4).lineTo(startX + columns.reduce((total, column) => total + column.width, 0), rowY - 4).stroke();

  doc.font("Helvetica");
  loads.forEach((row) => {
    if (rowY > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      rowY = doc.page.margins.top;
      cursorX = startX;
      doc.fontSize(9).font("Helvetica-Bold");
      columns.forEach((column) => {
        doc.text(column.title, cursorX, rowY, {
          width: column.width,
          align: column.align,
        });
        cursorX += column.width;
      });
      rowY += 16;
      doc.moveTo(startX, rowY - 4).lineTo(startX + columns.reduce((total, column) => total + column.width, 0), rowY - 4).stroke();
      doc.font("Helvetica");
    }

    const normalizedRow = {
      date: formatDateTime(row.date),
      quantity: row.quantity.toFixed(2),
      price: formatMoney(row.price),
      subtotal: formatMoney(row.subtotal),
      discount: formatMoney(row.discount),
      discountTotal: formatMoney(row.discountTotal),
      total: formatMoney(row.total),
    };

    cursorX = startX;
    columns.forEach((column) => {
      doc.text(normalizedRow[column.key], cursorX, rowY, {
        width: column.width,
        align: column.align,
      });
      cursorX += column.width;
    });

    rowY += 15;
  });

  const totals = buildShiftTotals(loads);

  rowY += 4;
  doc.moveTo(startX, rowY).lineTo(startX + columns.reduce((total, column) => total + column.width, 0), rowY).stroke();
  rowY += 6;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text(
    `Totales -> Litros: ${totals.quantity.toFixed(2)} | Subtotal: ${formatMoney(totals.subtotal)} | Descuento total: ${formatMoney(totals.discountTotal)} | Total: ${formatMoney(totals.total)}`,
    startX,
    rowY
  );

  doc.end();

  return done;
};

const buildShiftReportFileName = ({ dispatcher, shift }) => {
  const endedAt = shift.endedAt ? new Date(shift.endedAt) : new Date();
  const safeName = formatPersonName(dispatcher)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  return `corte_turno_${safeName || "despachador"}_${endedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`;
};

const formatShiftReport = async (shift) => {
  const loads = await getShiftLoads(shift.id);
  const totals = buildShiftTotals(loads);

  return {
    uuid: shift.uuid,
    branch: shift.branch || null,
    startedAt: shift.startedAt,
    endedAt: shift.endedAt || null,
    status: shift.status,
    dispatcher: shift.dispatcher
      ? {
          uuid: shift.dispatcher.uuid,
          name: formatPersonName(shift.dispatcher),
          email: shift.dispatcher.email || null,
        }
      : null,
    loads: loads.map((load) => ({
      uuid: load.uuid,
      date: load.date,
      product: load.product,
      quantity: roundMoney(load.quantity),
      price: roundMoney(load.price),
      subtotal: roundMoney(load.subtotal),
      discount: roundMoney(load.discount),
      discountTotal: roundMoney(load.discountTotal),
      total: roundMoney(load.total),
      promotionTitle: load.promotionTitle,
    })),
    totals,
  };
};

const findShiftWithDispatcherByUuid = async (uuid) =>
  strapi.db.query(DISPATCHER_SHIFT).findOne({
    where: {
      uuid,
    },
    select: ["id", "uuid", "branch", "startedAt", "endedAt", "status"],
    populate: {
      dispatcher: {
        select: ["uuid", "name", "lastName", "email"],
      },
    },
  });

module.exports = {
  buildShiftReportFileName,
  buildShiftReportPdf,
  buildShiftTotals,
  findShiftWithDispatcherByUuid,
  formatShiftReport,
  getShiftLoads,
};
