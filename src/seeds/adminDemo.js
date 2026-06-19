const {
  CUSTOMER_LEVEL,
  DISPATCHER_SHIFT,
  FISCAL,
  FLEET,
  FLEET_LEVEL,
  LOAD,
  PROMOTION,
  ROLE,
  USER,
  VEHICLE,
} = require("../constants/models");
const roles = require("../permissions/roles");
const permissionsParser = require("../permissions");

const DEMO_DOMAIN = "demo.albarran.local";
const DEFAULT_PASSWORD = "Asdf123456";
const BRANCHES = ["bohemio", "navarrol", "lopez", "arenal", "alamo"];
const PRODUCTS = [
  { name: "Magna", price: 23.89 },
  { name: "Premium", price: 25.99 },
  { name: "Diesel", price: 24.35 },
];
const PROMOTION_TEMPLATES = [
  {
    title: "Lunes de ahorro",
    description: "Descuento por litro para cargas realizadas los lunes.",
    isActive: true,
    startsAtDaysAgo: 90,
    endsAtDaysAgo: null,
    priority: 10,
    stackable: false,
    conditions: [
      {
        type: "weekday",
        weekday: "monday",
        notes: "Aplica cada lunes.",
      },
    ],
    rewards: [
      {
        type: "discount_per_liter",
        value: 1.5,
        maxValue: 180,
        notes: "Descuento directo por litro.",
      },
    ],
  },
  {
    title: "Cliente consentido",
    description: "Beneficio para clientes que cargan combustible en su cumpleaños.",
    isActive: true,
    startsAtDaysAgo: 120,
    endsAtDaysAgo: null,
    priority: 20,
    stackable: true,
    conditions: [
      {
        type: "birthday",
        notes: "Se activa cuando la fecha coincide con el cumpleaños del cliente.",
      },
    ],
    rewards: [
      {
        type: "fixed_discount",
        value: 80,
        maxValue: 80,
        notes: "Descuento fijo de cumpleaños.",
      },
    ],
  },
  {
    title: "Tanque lleno flotilla",
    description: "Descuento fijo para cargas grandes de flotillas y clientes frecuentes.",
    isActive: true,
    startsAtDaysAgo: 75,
    endsAtDaysAgo: null,
    priority: 30,
    stackable: false,
    conditions: [
      {
        type: "liters_range",
        minLiters: 45,
        maxLiters: 90,
        notes: "Cargas entre 45 y 90 litros.",
      },
    ],
    rewards: [
      {
        type: "fixed_discount",
        value: 120,
        maxValue: 120,
        notes: "Bonificación por volumen.",
      },
    ],
  },
  {
    title: "Premium frecuente",
    description: "Multiplicador de litros para campañas de producto premium.",
    isActive: true,
    startsAtDaysAgo: 30,
    endsAtDaysAgo: null,
    priority: 40,
    stackable: true,
    conditions: [
      {
        type: "specific_date",
        specificDateDaysAgo: 0,
        notes: "Campaña demostrativa del día.",
      },
    ],
    rewards: [
      {
        type: "liters_multiplier",
        value: 1.25,
        maxValue: null,
        notes: "Multiplicador de litros acumulables.",
      },
    ],
  },
  {
    title: "Arranque de temporada",
    description: "Promoción programada para mostrar estados futuros en el panel.",
    isActive: true,
    startsAtDaysAgo: -14,
    endsAtDaysAgo: -45,
    priority: 50,
    stackable: false,
    conditions: [
      {
        type: "weekday",
        weekday: "friday",
        notes: "Promoción futura de viernes.",
      },
    ],
    rewards: [
      {
        type: "discount_per_liter",
        value: 2,
        maxValue: 250,
        notes: "Descuento por lanzamiento.",
      },
    ],
  },
  {
    title: "Campaña pausada",
    description: "Promoción inactiva para probar filtros y edición.",
    isActive: false,
    startsAtDaysAgo: 45,
    endsAtDaysAgo: null,
    priority: 90,
    stackable: false,
    conditions: [
      {
        type: "liters_range",
        minLiters: 25,
        maxLiters: 55,
        notes: "Regla pausada de rango de litros.",
      },
    ],
    rewards: [
      {
        type: "discount_per_liter",
        value: 0.75,
        maxValue: 100,
        notes: "Descuento pausado.",
      },
    ],
  },
];

const ADMINS = [
  ["admin@inprodi.com.mx", "Inprodi", "Admin"],
  [`admin.operaciones@${DEMO_DOMAIN}`, "Mariana", "Operaciones"],
  [`admin.finanzas@${DEMO_DOMAIN}`, "Ricardo", "Finanzas"],
];

const CUSTOMERS = [
  ["cliente01", "Andrea", "Morales", "3310001001"],
  ["cliente02", "Carlos", "Rivas", "3310001002"],
  ["cliente03", "Fernanda", "Lopez", "3310001003"],
  ["cliente04", "Jorge", "Mendoza", "3310001004"],
  ["cliente05", "Sofia", "Ramirez", "3310001005"],
  ["cliente06", "Luis", "Castillo", "3310001006"],
  ["cliente07", "Paola", "Sanchez", "3310001007"],
  ["cliente08", "Miguel", "Navarro", "3310001008"],
  ["cliente09", "Daniela", "Ortega", "3310001009"],
  ["cliente10", "Roberto", "Campos", "3310001010"],
  ["cliente11", "Valeria", "Vega", "3310001011"],
  ["cliente12", "Hector", "Fuentes", "3310001012"],
  ["cliente13", "Natalia", "Aguilar", "3310001013"],
  ["cliente14", "Emilio", "Carrillo", "3310001014"],
  ["cliente15", "Camila", "Paredes", "3310001015"],
  ["cliente16", "Alonso", "Ibarra", "3310001016"],
  ["cliente17", "Regina", "Cortes", "3310001017"],
  ["cliente18", "Diego", "Salazar", "3310001018"],
];

const DISPATCHERS = [
  ["despachador01", "Martin", "Arias"],
  ["despachador02", "Gloria", "Nieto"],
  ["despachador03", "Oscar", "Robles"],
  ["despachador04", "Teresa", "Padilla"],
  ["despachador05", "Ivan", "Bravo"],
  ["despachador06", "Lidia", "Soto"],
];

const VEHICLES = [
  ["Nissan", "Versa", "Sense", 2021, "Blanco"],
  ["Toyota", "Corolla", "LE", 2022, "Gris"],
  ["Mazda", "CX-5", "i Sport", 2020, "Azul"],
  ["Volkswagen", "Jetta", "Comfortline", 2023, "Negro"],
  ["Chevrolet", "Aveo", "LT", 2021, "Rojo"],
  ["Ford", "Ranger", "XLT", 2022, "Plata"],
];

const FLEETS = [
  { name: "Logistica Tapatia", code: "ALBDEMO001" },
  { name: "Servicios Metropolitanos", code: "ALBDEMO002" },
  { name: "Reparto Empresarial", code: "ALBDEMO003" },
];

const toMoney = (value) => parseFloat(Number(value || 0).toFixed(2));

const dateDaysAgo = (daysAgo, hour = 9, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const dateOnlyDaysAgo = (daysAgo) => dateDaysAgo(daysAgo).toISOString().slice(0, 10);

const findRole = (name) =>
  strapi.query(ROLE).findOne({
    where: {
      name,
    },
  });

const ensureRole = async (name) => {
  const roleConfig = roles[name];
  const existingRole = await findRole(name);
  const role =
    existingRole ||
    (await strapi.entityService.create(ROLE, {
      data: {
        name,
        description: roleConfig.meta.description,
        type: roleConfig.meta.type,
      },
    }));
  const permissionsObject = permissionsParser(name);
  const permissions = [];

  Object.entries(permissionsObject).forEach(([typeName, type]) => {
    Object.entries(type.controllers).forEach(([controllerName, controller]) => {
      Object.entries(controller).forEach(([actionName, action]) => {
        if (action.enabled) {
          const actionID = `${typeName}.${controllerName}.${actionName}`;
          permissions.push(
            (async () => {
              const existingPermission = await strapi
                .query("plugin::users-permissions.permission")
                .findOne({
                  where: {
                    action: actionID,
                    role: role.id,
                  },
                });

              if (!existingPermission) {
                await strapi.query("plugin::users-permissions.permission").create({
                  data: {
                    action: actionID,
                    role: role.id,
                  },
                });
              }
            })()
          );
        }
      });
    });
  });

  await Promise.all(permissions);

  return role;
};

const upsertUser = async ({ email, roleId, type, name, lastName, phone, branch = null }) => {
  const existingUser = await strapi.query(USER).findOne({
    where: {
      email,
    },
  });
  const data = {
    username: email,
    email,
    password: DEFAULT_PASSWORD,
    confirmed: true,
    blocked: false,
    role: roleId,
    name,
    lastName,
    phone,
    provider: "local",
    type,
    ...(branch !== null && { branch }),
  };

  if (existingUser) {
    return strapi.entityService.update(USER, existingUser.id, {
      data,
    });
  }

  return strapi.entityService.create(USER, {
    data,
  });
};

const findOne = (model, where) =>
  strapi.query(model).findOne({
    where,
  });

const createIfMissing = async (model, where, data) => {
  const existing = await findOne(model, where);

  if (existing) {
    return existing;
  }

  return strapi.entityService.create(model, {
    data,
  });
};

const deleteManyByIds = async (model, ids) => {
  for (const id of ids) {
    await strapi.entityService.delete(model, id);
  }
};

const cleanupDemoLoadsAndShifts = async ({ customers, dispatchers }) => {
  const customerIds = customers.map((item) => item.id);
  const dispatcherIds = dispatchers.map((item) => item.id);
  const demoLoads = await strapi.db.query(LOAD).findMany({
    where: {
      $or: [
        {
          customer: {
            id: {
              $in: customerIds,
            },
          },
        },
        {
          dispatcher: {
            id: {
              $in: dispatcherIds,
            },
          },
        },
      ],
    },
    select: ["id"],
  });
  const demoShifts = await strapi.db.query(DISPATCHER_SHIFT).findMany({
    where: {
      dispatcher: {
        id: {
          $in: dispatcherIds,
        },
      },
    },
    select: ["id"],
  });

  await deleteManyByIds(LOAD, demoLoads.map((item) => item.id));
  await deleteManyByIds(DISPATCHER_SHIFT, demoShifts.map((item) => item.id));
};

const createLevels = async () => {
  const customerLevels = [
    ["Bronce", 0, 250, 1],
    ["Plata", 250, 750, 1.25],
    ["Oro", 750, 1500, 1.6],
    ["Platino", 1500, 999999, 2],
  ];
  const fleetLevels = [
    ["Flotilla Inicial", 0, 1000, 1.4],
    ["Flotilla Pro", 1000, 3000, 1.8],
    ["Flotilla Elite", 3000, 999999, 2.25],
  ];

  for (const [name, min, max, discount] of customerLevels) {
    await createIfMissing(CUSTOMER_LEVEL, { name }, { name, min, max, discount });
  }

  for (const [name, min, max, discount] of fleetLevels) {
    await createIfMissing(FLEET_LEVEL, { name }, { name, min, max, discount });
  }
};

const createCustomerEntities = async (customers) => {
  const fiscalsByCustomerId = new Map();
  const vehiclesByCustomerId = new Map();

  for (let index = 0; index < customers.length; index++) {
    const customer = customers[index];
    const fiscal = await createIfMissing(
      FISCAL,
      {
        rfc: `DEMO${String(index + 1).padStart(6, "0")}A1`,
      },
      {
        legalName: `${customer.name} ${customer.lastName} Servicios SA de CV`,
        rfc: `DEMO${String(index + 1).padStart(6, "0")}A1`,
        cp: `44${String(100 + index).padStart(3, "0")}`,
        regime: "601 - General de Ley Personas Morales",
        user: customer.id,
      }
    );
    const vehicleTemplate = VEHICLES[index % VEHICLES.length];
    const vehicle = await createIfMissing(
      VEHICLE,
      {
        plates: `DEM-${String(index + 1).padStart(3, "0")}`,
      },
      {
        brand: vehicleTemplate[0],
        model: vehicleTemplate[1],
        version: vehicleTemplate[2],
        year: vehicleTemplate[3],
        color: vehicleTemplate[4],
        plates: `DEM-${String(index + 1).padStart(3, "0")}`,
        insurancePolicy: `POL-DEMO-${String(index + 1).padStart(4, "0")}`,
        insuranceExpiration: dateDaysAgo(-120).toISOString().slice(0, 10),
        insuranceCompany: "Seguros Demo",
        isDefault: true,
        user: customer.id,
      }
    );

    fiscalsByCustomerId.set(customer.id, fiscal);
    vehiclesByCustomerId.set(customer.id, vehicle);
  }

  return {
    fiscalsByCustomerId,
    vehiclesByCustomerId,
  };
};

const createFleets = async (customers) => {
  const fleets = [];

  for (let index = 0; index < FLEETS.length; index++) {
    const fleetTemplate = FLEETS[index];
    const members = customers.slice(index * 6, index * 6 + 8);
    const existingFleet = await findOne(FLEET, {
      code: fleetTemplate.code,
    });
    const data = {
      name: fleetTemplate.name,
      code: fleetTemplate.code,
      owner: members[0].id,
      users: members.map((member) => member.id),
    };
    const fleet = existingFleet
      ? await strapi.entityService.update(FLEET, existingFleet.id, { data })
      : await strapi.entityService.create(FLEET, { data });

    fleets.push(fleet);
  }

  return fleets;
};

const resolveTemplateDate = (template, field) => {
  const daysAgo = template[field];

  if (daysAgo === null || daysAgo === undefined) {
    return null;
  }

  return dateOnlyDaysAgo(daysAgo);
};

const resolvePromotionComponentDate = (item) => {
  const { specificDateDaysAgo, ...component } = item;

  if (specificDateDaysAgo !== undefined) {
    component.specificDate = dateOnlyDaysAgo(specificDateDaysAgo);
  }

  return component;
};

const createPromotions = async () => {
  const promotions = [];

  for (const template of PROMOTION_TEMPLATES) {
    const existingPromotion = await findOne(PROMOTION, {
      title: template.title,
    });
    const data = {
      title: template.title,
      description: template.description,
      isActive: template.isActive,
      startsAt: resolveTemplateDate(template, "startsAtDaysAgo"),
      endsAt: resolveTemplateDate(template, "endsAtDaysAgo"),
      timezone: "America/Mexico_City",
      priority: template.priority,
      stackable: template.stackable,
      conditions: template.conditions.map(resolvePromotionComponentDate),
      rewards: template.rewards,
    };
    const promotion = existingPromotion
      ? await strapi.entityService.update(PROMOTION, existingPromotion.id, { data })
      : await strapi.entityService.create(PROMOTION, { data });

    promotions.push(promotion);
  }

  return promotions;
};

const getLoadPromotionPool = (promotions) => {
  const preferredTitles = ["Lunes de ahorro", "Tanque lleno flotilla", "Premium frecuente", "Cliente consentido"];

  return preferredTitles
    .map((title) => promotions.find((promotion) => promotion.title === title))
    .filter(Boolean)
    .map((promotion) => ({
      uuid: promotion.uuid,
      title: promotion.title,
    }));
};

const createShiftsAndLoads = async ({
  customers,
  dispatchers,
  fiscalsByCustomerId,
  vehiclesByCustomerId,
  fleets,
  promotions,
}) => {
  const shifts = [];
  const loads = [];
  const loadPromotionPool = getLoadPromotionPool(promotions);

  for (let day = 59; day >= 0; day--) {
    const branch = BRANCHES[day % BRANCHES.length];
    const dispatcher = dispatchers[day % dispatchers.length];
    const shiftStart = dateDaysAgo(day, day % 2 === 0 ? 7 : 14, 0);
    const shiftEnd = new Date(shiftStart);
    shiftEnd.setHours(shiftStart.getHours() + 8);

    const shift = await strapi.entityService.create(DISPATCHER_SHIFT, {
      data: {
        dispatcher: dispatcher.id,
        branch,
        startedAt: shiftStart,
        endedAt: day === 0 ? null : shiftEnd,
        status: day === 0 ? "active" : "closed",
      },
    });
    shifts.push(shift);

    const loadsForDay = 2 + (day % 4);

    for (let loadIndex = 0; loadIndex < loadsForDay; loadIndex++) {
      const customer = customers[(day + loadIndex * 3) % customers.length];
      const product = PRODUCTS[(day + loadIndex) % PRODUCTS.length];
      const quantity = toMoney(18 + ((day * 7 + loadIndex * 11) % 56) + loadIndex * 0.75);
      const discount = toMoney(((day + loadIndex) % 5 === 0 ? 2.1 : (day + loadIndex) % 3 === 0 ? 1.5 : 1) + (loadIndex % 2) * 0.15);
      const subtotal = toMoney(quantity * product.price);
      const total = toMoney(Math.max(subtotal - quantity * discount, 0));
      const date = new Date(shiftStart);
      date.setMinutes(15 + loadIndex * 72);
      const withFiscal = (day + loadIndex) % 3 !== 1;
      const withFleet = (day + loadIndex) % 4 === 0;
      const promotion = discount > 1.4 && loadPromotionPool.length
        ? loadPromotionPool[(day + loadIndex) % loadPromotionPool.length]
        : null;

      loads.push(
        await strapi.entityService.create(LOAD, {
          data: {
            customer: customer.id,
            dispatcher: dispatcher.id,
            shift: shift.id,
            product: product.name,
            quantity,
            price: product.price,
            total,
            discount,
            promotionUuid: promotion?.uuid || null,
            promotionTitle: promotion?.title || null,
            date: date.toISOString(),
            fiscal: withFiscal ? fiscalsByCustomerId.get(customer.id)?.id : null,
            vehicle: vehiclesByCustomerId.get(customer.id)?.id || null,
            fleet: withFleet ? fleets[(day + loadIndex) % fleets.length]?.id : null,
            branch,
          },
        })
      );
    }
  }

  return {
    shifts,
    loads,
  };
};

const generateAdminDemoSeeds = async () => {
  console.log("Generating admin dashboard demo seeds...");

  const [adminRole, customerRole, dispatcherRole] = await Promise.all([
    ensureRole("public"),
    ensureRole("admin"),
    ensureRole("customer"),
    ensureRole("dispatcher"),
  ]).then(([, admin, customer, dispatcher]) => [admin, customer, dispatcher]);

  await createLevels();

  const admins = [];
  for (const [email, name, lastName] of ADMINS) {
    admins.push(
      await upsertUser({
        email,
        roleId: adminRole.id,
        type: "admin",
        name,
        lastName,
        phone: "3300000000",
      })
    );
  }

  const customers = [];
  for (const [slug, name, lastName, phone] of CUSTOMERS) {
    customers.push(
      await upsertUser({
        email: `${slug}@${DEMO_DOMAIN}`,
        roleId: customerRole.id,
        type: "customer",
        name,
        lastName,
        phone,
      })
    );
  }

  const dispatchers = [];
  for (let index = 0; index < DISPATCHERS.length; index++) {
    const [slug, name, lastName] = DISPATCHERS[index];
    dispatchers.push(
      await upsertUser({
        email: `${slug}@${DEMO_DOMAIN}`,
        roleId: dispatcherRole.id,
        type: "dispatcher",
        name,
        lastName,
        phone: `33200020${String(index).padStart(2, "0")}`,
        branch: BRANCHES[index % BRANCHES.length],
      })
    );
  }

  await cleanupDemoLoadsAndShifts({ customers, dispatchers });

  const customerEntities = await createCustomerEntities(customers);
  const fleets = await createFleets(customers);
  const promotions = await createPromotions();
  const { shifts, loads } = await createShiftsAndLoads({
    customers,
    dispatchers,
    fleets,
    promotions,
    ...customerEntities,
  });

  return {
    message: "ADMIN DEMO SEEDS GENERATED SUCCESSFULLY!",
    credentials: {
      email: "admin@inprodi.com.mx",
      password: DEFAULT_PASSWORD,
    },
    createdOrUpdated: {
      admins: admins.length,
      customers: customers.length,
      dispatchers: dispatchers.length,
      fleets: fleets.length,
      promotions: promotions.length,
      shifts: shifts.length,
      loads: loads.length,
    },
  };
};

module.exports = generateAdminDemoSeeds;
