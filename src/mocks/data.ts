import type {
  AppNotification,
  AuditLog,
  Lease,
  LeaseRenewalRequest,
  MaintenanceHistoryItem,
  MaintenanceRequest,
  Property,
  RentalRequest,
  Unit,
  User,
} from "@/types/models";

const uid = () => crypto.randomUUID();
const iso = (d = 0) => new Date(Date.now() + d * 86400000).toISOString();
const day = (d = 0) => iso(d).slice(0, 10);

/** Tiny inline SVG "photos" so the mock works offline. */
export function photo(
  seed: number,
  _label = "",
): { url: string; publicId: string } {
  const hues = [212, 28, 160, 340, 48, 190];
  const h = hues[seed % hues.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h} 38% 82%)'/><stop offset='1' stop-color='hsl(${h + 20} 32% 62%)'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/><g fill='hsl(${h} 30% 28%)' opacity='.55'><rect x='140' y='110' width='360' height='230' rx='10'/><path d='M120 120 320 50 520 120z'/></g><g fill='hsl(${h} 70% 92%)' opacity='.9'>${[0, 1, 2, 3].map((i) => `<rect x='${170 + i * 85}' y='145' width='52' height='52' rx='6'/><rect x='${170 + i * 85}' y='220' width='52' height='52' rx='6'/>`).join("")}</g></svg>`;
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    publicId: `mock-${seed}-${uid().slice(0, 6)}`,
  };
}

const avatar = {
  url: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#d7dbe8'/><circle cx='32' cy='25' r='12' fill='#9aa3bd'/><path d='M10 58c3-14 12-20 22-20s19 6 22 20z' fill='#9aa3bd'/></svg>")}`,
  publicId: "placeholder",
};

const mkUser = (
  p: Partial<User> & Pick<User, "email" | "firstName" | "lastName" | "role">,
): User => ({
  id: `u-${p.email.split("@")[0]}`,
  phone: "01012345678",
  roleSelected: true,
  ownerVerified: p.role === "OWNER",
  avatar,
  isActive: true,
  isEmailVerified: true,
  createdAt: iso(-90),
  updatedAt: iso(-2),
  ...p,
});

export interface Db {
  passwords: Record<string, string>;
  users: User[];
  properties: Property[];
  units: Unit[];
  rentalRequests: RentalRequest[];
  leases: Lease[];
  renewals: LeaseRenewalRequest[];
  maintenance: MaintenanceRequest[];
  history: MaintenanceHistoryItem[];
  notifications: (AppNotification & { userId: string })[];
  audit: AuditLog[];
}

export function seed(): Db {
  const admin = mkUser({
    email: "admin@demo.com",
    firstName: "Layla",
    lastName: "Hassan",
    role: "ADMIN",
  });
  const owner = mkUser({
    email: "owner@demo.com",
    firstName: "Mahmoud",
    lastName: "El-Sherif",
    role: "OWNER",
  });
  const owner2 = mkUser({
    email: "owner2@demo.com",
    firstName: "Hala",
    lastName: "Mansour",
    role: "OWNER",
    ownerVerified: false,
  });
  const tenant = mkUser({
    email: "tenant@demo.com",
    firstName: "Youssef",
    lastName: "Adel",
    role: "TENANT",
  });
  const tenant2 = mkUser({
    email: "tenant2@demo.com",
    firstName: "Sara",
    lastName: "Fathy",
    role: "TENANT",
  });
  const staff = mkUser({
    email: "staff@demo.com",
    firstName: "Karim",
    lastName: "Nabil",
    role: "MAINTENANCE_STAFF",
  });
  const users = [admin, owner, owner2, tenant, tenant2, staff];
  const passwords = Object.fromEntries(
    users.map((u) => [u.email, "demo12345"]),
  );

  const mkProp = (
    i: number,
    name: string,
    type: Property["propertyType"],
    city: string,
    address: string,
    ownerId: string,
  ): Property => ({
    id: uid(),
    name,
    description: "A quiet location close to services and transport.",
    propertyType: type,
    address,
    city,
    country: "Egypt",
    ownerId,
    images: [photo(i, name), photo(i + 1, name)],
    createdAt: iso(-60 + i),
    updatedAt: iso(-3),
  });
  const properties = [
    mkProp(
      0,
      "Nile Tower",
      "BUILDING",
      "Mansoura",
      "12 Al-Gomhoria St.",
      owner.id,
    ),
    mkProp(
      1,
      "Jasmine Villa",
      "VILLA",
      "New Cairo",
      "5th Settlement, District 3",
      owner.id,
    ),
    mkProp(
      2,
      "Al-Salam Building",
      "BUILDING",
      "Tanta",
      "7 Al-Bahr St.",
      owner2.id,
    ),
    mkProp(
      3,
      "Zahraa Studio",
      "STUDIO",
      "Alexandria",
      "Smouha, Fawzy Moaz St.",
      owner.id,
    ),
  ];
  const statuses: Unit["status"][] = [
    "AVAILABLE",
    "RENTED",
    "AVAILABLE",
    "MAINTENANCE",
    "AVAILABLE",
    "RENTED",
    "AVAILABLE",
    "AVAILABLE",
  ];
  const units: Unit[] = [];
  properties.forEach((p, pi) => {
    const n = p.propertyType === "BUILDING" ? 6 : 1;
    for (let i = 0; i < n; i++) {
      units.push({
        id: uid(),
        unitNumber:
          p.propertyType === "BUILDING"
            ? `${(i % 3) + 1}${i < 3 ? "A" : "B"}`
            : "1",
        floor: p.propertyType === "BUILDING" ? (i % 3) + 1 : 0,
        area: 70 + i * 12 + pi * 9,
        rentAmount: 4500 + i * 900 + pi * 700,
        bedrooms: 1 + (i % 3),
        bathrooms: 1 + (i % 2),
        description: "A bright unit with good finishing.",
        propertyId: p.id,
        status: statuses[(i + pi) % statuses.length],
        images: [photo(pi * 3 + i, `Unit ${i + 1}`)],
        createdAt: iso(-50 + i),
        updatedAt: iso(-2),
      });
    }
  });
  const rentedOf = (pid: string) =>
    units.filter((u) => u.propertyId === pid && u.status === "RENTED");
  const leases: Lease[] = [];
  rentedOf(properties[0].id)
    .slice(0, 1)
    .forEach((u) =>
      leases.push({
        id: uid(),
        tenantId: tenant.id,
        unitId: u.id,
        unit: { id: u.id, unitNumber: u.unitNumber, propertyId: u.propertyId },
        startDate: day(-120),
        endDate: day(245),
        rentAmount: u.rentAmount,
        status: "ACTIVE",
        notes: null,
        createdAt: iso(-125),
        updatedAt: iso(-120),
      }),
    );
  const avail = units.filter((u) => u.status === "AVAILABLE");
  leases.push({
    id: uid(),
    tenantId: tenant2.id,
    unitId: avail[0].id,
    unit: {
      id: avail[0].id,
      unitNumber: avail[0].unitNumber,
      propertyId: avail[0].propertyId,
    },
    startDate: day(10),
    endDate: day(375),
    rentAmount: avail[0].rentAmount,
    status: "PENDING",
    notes: "Lease awaiting activation.",
    createdAt: iso(-3),
    updatedAt: iso(-3),
  });
  leases.push({
    id: uid(),
    tenantId: tenant2.id,
    unitId: units[1].id,
    unit: {
      id: units[1].id,
      unitNumber: units[1].unitNumber,
      propertyId: units[1].propertyId,
    },
    startDate: day(-500),
    endDate: day(-135),
    rentAmount: units[1].rentAmount,
    status: "EXPIRED",
    notes: null,
    createdAt: iso(-505),
    updatedAt: iso(-135),
  });

  const mkRR = (
    u: Unit,
    t: User,
    status: RentalRequest["status"],
    a: number,
    b: number,
  ): RentalRequest => ({
    id: uid(),
    tenantId: t.id,
    unitId: u.id,
    startDate: day(a),
    endDate: day(b),
    message: "Interested in the unit. I can visit at any time.",
    status,
    rentAmount: u.rentAmount,
    leaseId: null,
    tenant: {
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phone,
    },
    unit: {
      id: u.id,
      unitNumber: u.unitNumber,
      propertyId: u.propertyId,
      rentAmount: u.rentAmount,
    },
    createdAt: iso(-2),
    updatedAt: iso(-2),
  });
  const rentalRequests = [
    mkRR(avail[1], tenant, "PENDING", 14, 380),
    mkRR(avail[2], tenant, "REJECTED", -30, 300),
    mkRR(avail[1], tenant2, "PENDING", 20, 385),
    mkRR(avail[3] ?? avail[2], tenant, "EXPIRED", -90, -10),
  ];

  const active = leases[0];
  const renewals: LeaseRenewalRequest[] = [
    {
      id: uid(),
      leaseId: active.id,
      tenantId: tenant.id,
      requestedEndDate: day(610),
      message: "I would like to extend the lease for another year.",
      status: "PENDING",
      createdAt: iso(-1),
      updatedAt: iso(-1),
      tenant: {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        phone: tenant.phone,
      },
      lease: {
        id: active.id,
        startDate: active.startDate,
        endDate: active.endDate,
        status: "ACTIVE",
        rentAmount: active.rentAmount,
      },
      unit: active.unit,
    },
  ];

  const mkM = (
    title: string,
    cat: MaintenanceRequest["category"],
    pri: MaintenanceRequest["priority"],
    status: MaintenanceRequest["status"],
    extra: Partial<MaintenanceRequest> = {},
  ): MaintenanceRequest => ({
    id: uid(),
    title,
    description:
      "The problem started two days ago and is getting worse. Photos of the current state are attached.",
    category: cat,
    priority: pri,
    images: [photo(7, title)],
    unitId: active.unitId,
    unit: active.unit,
    tenantId: tenant.id,
    status,
    assignedStaffId: null,
    scheduledDate: null,
    completionImages: [],
    resolutionDescription: null,
    resolvedAt: null,
    createdAt: iso(-4),
    updatedAt: iso(-1),
    ...extra,
  });
  const maintenance = [
    mkM("Water leak under the kitchen sink", "PLUMBING", "HIGH", "OPEN"),
    mkM("Bedroom air conditioner not working", "HVAC", "MEDIUM", "ASSIGNED", {
      assignedStaffId: staff.id,
      scheduledDate: day(2),
    }),
    mkM(
      "Living room power keeps tripping",
      "ELECTRICITY",
      "URGENT",
      "IN_PROGRESS",
      { assignedStaffId: staff.id, scheduledDate: day(0) },
    ),
    mkM(
      "Balcony door does not close properly",
      "CARPENTRY",
      "LOW",
      "RESOLVED",
      {
        assignedStaffId: staff.id,
        resolutionDescription: "Hinges adjusted and the lock replaced.",
        completionImages: [photo(9, "done")],
        resolvedAt: iso(-1),
      },
    ),
  ];
  const history: MaintenanceHistoryItem[] = [
    {
      id: uid(),
      requestId: maintenance[1].id,
      previousStatus: "OPEN",
      newStatus: "ASSIGNED",
      changedById: owner.id,
      notes: "Please arrive in the morning.",
      createdAt: iso(-3),
    },
    {
      id: uid(),
      requestId: maintenance[2].id,
      previousStatus: "OPEN",
      newStatus: "ASSIGNED",
      changedById: owner.id,
      notes: null,
      createdAt: iso(-3),
    },
    {
      id: uid(),
      requestId: maintenance[2].id,
      previousStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
      changedById: staff.id,
      notes: "Started the inspection.",
      createdAt: iso(-1),
    },
    {
      id: uid(),
      requestId: maintenance[3].id,
      previousStatus: "OPEN",
      newStatus: "ASSIGNED",
      changedById: owner.id,
      notes: null,
      createdAt: iso(-3),
    },
    {
      id: uid(),
      requestId: maintenance[3].id,
      previousStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
      changedById: staff.id,
      notes: null,
      createdAt: iso(-2),
    },
    {
      id: uid(),
      requestId: maintenance[3].id,
      previousStatus: "IN_PROGRESS",
      newStatus: "RESOLVED",
      changedById: staff.id,
      notes: null,
      createdAt: iso(-1),
    },
  ];

  const note = (
    userId: string,
    type: AppNotification["type"],
    title: string,
    message: string,
    ent: string | null,
    id: string | null,
    read = false,
    d = -1,
  ): AppNotification & { userId: string } => ({
    id: uid(),
    userId,
    type,
    title,
    message,
    isRead: read,
    relatedEntityType: ent,
    relatedEntityId: id,
    createdAt: iso(d),
  });
  const notifications = [
    note(
      tenant.id,
      "RENTAL_REQUEST_REJECTED",
      "Rental request rejected",
      "Your rental request was rejected.",
      "RentalRequest",
      rentalRequests[1].id,
      false,
      -0.2,
    ),
    note(
      tenant.id,
      "MAINTENANCE_STARTED",
      "Maintenance started",
      "Work has started on your request.",
      "MaintenanceRequest",
      maintenance[2].id,
      false,
      -1,
    ),
    note(
      tenant.id,
      "LEASE_ACTIVATED",
      "Lease activated",
      "Your lease is now active.",
      "Lease",
      active.id,
      true,
      -30,
    ),
    note(
      owner.id,
      "LEASE_RENEWAL_REQUESTED",
      "Renewal requested",
      "A tenant asked to extend a lease.",
      "LeaseRenewalRequest",
      renewals[0].id,
      false,
      -1,
    ),
    note(
      owner.id,
      "MAINTENANCE_CREATED",
      "New maintenance request",
      "A tenant reported a problem.",
      "MaintenanceRequest",
      maintenance[0].id,
      false,
      -4,
    ),
    note(
      owner.id,
      "RENTAL_REQUEST_CREATED",
      "New rental request",
      "A tenant requested a unit.",
      "RentalRequest",
      rentalRequests[0].id,
      true,
      -2,
    ),
    note(
      staff.id,
      "MAINTENANCE_ASSIGNED",
      "Maintenance assigned",
      "A request was assigned to you.",
      "MaintenanceRequest",
      maintenance[1].id,
      false,
      -3,
    ),
  ];
  const audit: AuditLog[] = [
    {
      id: uid(),
      userId: owner.id,
      action: "UNIT_UPDATED",
      entity: "Unit",
      entityId: units[0].id,
      metadata: {
        propertyId: units[0].propertyId,
        changes: {
          rentAmount: { before: 4200, after: 4500 },
          bedrooms: { before: 1, after: 2 },
        },
      },
      ipAddress: "197.55.10.4",
      createdAt: iso(-2),
    },
    {
      id: uid(),
      userId: owner.id,
      action: "RENTAL_REQUEST_APPROVED",
      entity: "RentalRequest",
      entityId: rentalRequests[0].id,
      metadata: { leaseId: leases[0].id },
      ipAddress: "197.55.10.4",
      createdAt: iso(-3),
    },
    {
      id: uid(),
      userId: admin.id,
      action: "OWNER_VERIFICATION_CHANGED",
      entity: "User",
      entityId: owner.id,
      metadata: { ownerVerified: true },
      ipAddress: "41.32.9.18",
      createdAt: iso(-20),
    },
    {
      id: uid(),
      userId: admin.id,
      action: "ROLE_CHANGED",
      entity: "User",
      entityId: tenant.id,
      metadata: {
        previousRole: "TENANT",
        role: "TENANT",
        source: "SELF_SELECTION",
      },
      ipAddress: "41.32.9.18",
      createdAt: iso(-25),
    },
  ];
  return {
    passwords,
    users,
    properties,
    units,
    rentalRequests,
    leases,
    renewals,
    maintenance,
    history,
    notifications,
    audit,
  };
}
export { uid, iso, day, avatar };

/** English is the source language of the demo data; these are the Arabic renderings used when the UI language is Arabic. */
export const AR: Record<string, string> = {
  Layla: "ليلى",
  Hassan: "حسن",
  Mahmoud: "محمود",
  "El-Sherif": "الشريف",
  Hala: "هالة",
  Mansour: "منصور",
  Youssef: "يوسف",
  Adel: "عادل",
  Sara: "سارة",
  Fathy: "فتحي",
  Karim: "كريم",
  Nabil: "نبيل",
  "Nile Tower": "برج النيل",
  "Jasmine Villa": "فيلا الياسمين",
  "Al-Salam Building": "عمارة السلام",
  "Zahraa Studio": "استوديو الزهراء",
  Mansoura: "المنصورة",
  "New Cairo": "القاهرة الجديدة",
  Tanta: "طنطا",
  Alexandria: "الإسكندرية",
  Egypt: "مصر",
  "12 Al-Gomhoria St.": "شارع الجمهورية 12",
  "5th Settlement, District 3": "التجمع الخامس، الحي الثالث",
  "7 Al-Bahr St.": "شارع البحر 7",
  "Smouha, Fawzy Moaz St.": "سموحة، شارع فوزي معاذ",
  "A quiet location close to services and transport.":
    "عقار في موقع هادئ وقريب من الخدمات والمواصلات.",
  "A bright unit with good finishing.": "وحدة مشمسة بتشطيب جيد.",
  "Interested in the unit. I can visit at any time.":
    "مهتم بالوحدة وأستطيع المعاينة في أي وقت.",
  "Lease awaiting activation.": "العقد بانتظار التفعيل.",
  "I would like to extend the lease for another year.":
    "أرغب بتمديد العقد سنة إضافية.",
  "The problem started two days ago and is getting worse. Photos of the current state are attached.":
    "المشكلة بدأت منذ يومين وتزداد سوءًا. مرفق صور توضح الوضع الحالي.",
  "Water leak under the kitchen sink": "تسريب مياه أسفل حوض المطبخ",
  "Bedroom air conditioner not working": "عطل في تكييف غرفة النوم",
  "Living room power keeps tripping": "كهرباء الصالة تفصل باستمرار",
  "Balcony door does not close properly": "باب الشرفة لا يُغلق جيدًا",
  "Hinges adjusted and the lock replaced.": "تم ضبط المفصلات واستبدال القفل.",
  "Please arrive in the morning.": "يرجى الحضور صباحًا.",
  "Started the inspection.": "بدأت الفحص.",
};
export function localize<T>(value: T, lang: string): T {
  if (lang !== "ar") return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return v.startsWith("data:") ? v : (AR[v] ?? v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>).map(([k, x]) => [
          k,
          walk(x),
        ]),
      );
    return v;
  };
  return walk(value) as T;
}
