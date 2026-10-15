import {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { Lease, User } from "@/types/models";
import {
  AR,
  avatar,
  day,
  iso,
  localize,
  photo,
  seed,
  uid,
  type Db,
} from "./data";

/**
 * Development-only backend. Enabled with VITE_MOCK=true; it never ships in production bundles.
 * Demo logins (password demo12345): admin@demo.com, owner@demo.com, owner2@demo.com, tenant@demo.com, tenant2@demo.com, staff@demo.com
 */
export function installMockAdapter(api: AxiosInstance) {
  const db: Db = seed();
  const SESSION = "pf-mock-session";
  const wait = () =>
    new Promise((r) => setTimeout(r, 140 + Math.random() * 160));

  const lang = () => document.documentElement.lang;
  const loc = (s: string) => (lang() === "ar" ? (AR[s] ?? s) : s); // search matches what the user sees
  const respond = (
    config: InternalAxiosRequestConfig,
    status: number,
    body: unknown,
  ): AxiosResponse => ({
    data: body,
    status,
    statusText: String(status),
    headers: {},
    config,
    request: {},
  });
  const ok = (
    config: InternalAxiosRequestConfig,
    data: unknown,
    meta?: unknown,
    status = 200,
  ) =>
    respond(config, status, {
      success: true,
      data: localize(data, lang()),
      ...(meta ? { meta } : {}),
    });
  class Fail extends Error {
    constructor(
      public status: number,
      public code: string,
      public details?: string[],
    ) {
      super(code);
    }
  }
  const fail = (status: number, code: string, details?: string[]) => {
    throw new Fail(status, code, details);
  };

  const userOf = (config: InternalAxiosRequestConfig): User => {
    const h = String(config.headers?.get?.("Authorization") ?? "");
    const id = h.replace("Bearer mock-", "");
    const u = db.users.find((x) => x.id === id);
    if (!u) fail(401, "UNAUTHORIZED");
    return u!;
  };
  const page = <T extends Record<string, any>>(
    rows: T[],
    q: Record<string, any>,
    defSort = "createdAt",
  ) => {
    const limit = Math.min(100, Number(q.limit) || 20);
    const p = Math.max(1, Number(q.page) || 1);
    const sortBy = q.sortBy || defSort;
    const dir = (q.sortOrder || "DESC") === "ASC" ? 1 : -1;
    const sorted = [...rows].sort(
      (a, b) =>
        (a[sortBy] > b[sortBy] ? 1 : a[sortBy] < b[sortBy] ? -1 : 0) * dir,
    );
    return {
      data: sorted.slice((p - 1) * limit, p * limit),
      meta: {
        page: p,
        limit,
        total: rows.length,
        totalPages: Math.max(1, Math.ceil(rows.length / limit)),
      },
    };
  };
  const body = (c: InternalAxiosRequestConfig): Record<string, any> => {
    if (c.data instanceof FormData) {
      const o: Record<string, any> = {};
      c.data.forEach((v, k) => {
        if (!(v instanceof File)) o[k] = v;
      });
      return o;
    }
    try {
      return typeof c.data === "string" ? JSON.parse(c.data) : (c.data ?? {});
    } catch {
      return {};
    }
  };
  const files = (c: InternalAxiosRequestConfig, field: string) =>
    c.data instanceof FormData
      ? (c.data.getAll(field).filter((f) => f instanceof File) as File[])
      : [];
  const ownerPropIds = (u: User) =>
    db.properties
      .filter((p) => (u.role === "ADMIN" ? true : p.ownerId === u.id))
      .map((p) => p.id);
  const unitOwnerId = (unitId: string) =>
    db.properties.find(
      (p) => p.id === db.units.find((x) => x.id === unitId)?.propertyId,
    )?.ownerId;
  const visibleUnit = (u: User, unit: (typeof db.units)[number]) => {
    if (u.role === "TENANT") {
      const owner = db.users.find(
        (x) =>
          x.id === db.properties.find((p) => p.id === unit.propertyId)?.ownerId,
      );
      return unit.status === "AVAILABLE" && !!owner?.ownerVerified;
    }
    return u.role === "ADMIN" || ownerPropIds(u).includes(unit.propertyId);
  };
  const syncUnit = (unitId: string, status: "AVAILABLE" | "RENTED") => {
    const x = db.units.find((u) => u.id === unitId);
    if (x && x.status !== "MAINTENANCE") x.status = status;
  };
  const push = (
    userId: string,
    type: any,
    title: string,
    message: string,
    ent: string,
    id: string,
  ) =>
    db.notifications.unshift({
      id: uid(),
      userId,
      type,
      title,
      message,
      isRead: false,
      relatedEntityType: ent,
      relatedEntityId: id,
      createdAt: iso(),
    });

  const handlers: [
    string,
    RegExp,
    (
      c: InternalAxiosRequestConfig,
      m: RegExpMatchArray,
      q: Record<string, any>,
    ) => unknown,
  ][] = [];
  const route = (
    method: string,
    pattern: string,
    fn: (
      c: InternalAxiosRequestConfig,
      m: RegExpMatchArray,
      q: Record<string, any>,
    ) => unknown,
  ) => handlers.push([method, new RegExp(`^${pattern}$`), fn]);

  /* ---------- auth ---------- */
  route("POST", "/auth/login", (c) => {
    const b = body(c);
    const u = db.users.find(
      (x) => x.email.toLowerCase() === String(b.email).toLowerCase(),
    );
    if (!u || db.passwords[u.email] !== b.password)
      fail(401, "INVALID_CREDENTIALS");
    if (!u!.isActive) fail(403, "ACCOUNT_DEACTIVATED");
    if (!u!.isEmailVerified) fail(403, "EMAIL_NOT_VERIFIED");
    sessionStorage.setItem(SESSION, u!.id);
    return { accessToken: `mock-${u!.id}`, expiresIn: 900, user: u };
  });
  route("POST", "/auth/refresh", () => {
    const id = sessionStorage.getItem(SESSION);
    if (!id || !db.users.find((u) => u.id === id))
      fail(401, "INVALID_REFRESH_TOKEN");
    return { accessToken: `mock-${id}`, expiresIn: 900 };
  });
  route("POST", "/auth/logout", () => {
    sessionStorage.removeItem(SESSION);
    return { message: "ok" };
  });
  route("POST", "/auth/register", (c) => {
    const b = body(c);
    if (db.users.some((u) => u.email === b.email))
      fail(409, "EMAIL_ALREADY_REGISTERED");
    db.users.push({
      id: uid(),
      email: b.email,
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phone ?? null,
      role: b.role,
      roleSelected: true,
      ownerVerified: false,
      avatar,
      isActive: true,
      isEmailVerified: false,
      createdAt: iso(),
      updatedAt: iso(),
    });
    db.passwords[b.email] = b.password;
    return { message: "OTP sent" };
  });
  route("POST", "/auth/verify-email", (c) => {
    const b = body(c);
    if (b.otp !== "123456") fail(400, "INVALID_OTP");
    const u = db.users.find((x) => x.email === b.email);
    if (u) u.isEmailVerified = true;
    return { message: "verified" };
  });
  route("POST", "/auth/resend-verification-otp", () => ({ message: "sent" }));
  route("POST", "/auth/forgot-password", () => ({ message: "sent" }));
  route("POST", "/auth/reset-password", (c) => {
    const b = body(c);
    if (b.otp !== "123456") fail(400, "INVALID_OTP");
    db.passwords[b.email] = b.newPassword;
    return { message: "done" };
  });
  route("POST", "/auth/change-password", (c) => {
    const u = userOf(c);
    const b = body(c);
    if (db.passwords[u.email] !== b.currentPassword)
      fail(400, "CURRENT_PASSWORD_INCORRECT");
    if (b.currentPassword === b.newPassword) fail(400, "PASSWORD_UNCHANGED");
    db.passwords[u.email] = b.newPassword;
    return { message: "Password changed. Other devices were signed out." };
  });

  /* ---------- users ---------- */
  route("GET", "/users/me", (c) => userOf(c));
  route("PATCH", "/users/me", (c) =>
    Object.assign(userOf(c), body(c), { updatedAt: iso() }),
  );
  route("PATCH", "/users/me/role", (c) => {
    const u = userOf(c);
    if (u.roleSelected) fail(409, "ROLE_ALREADY_SELECTED");
    u.role = body(c).role;
    u.roleSelected = true;
    return u;
  });
  route("POST", "/users/me/avatar", (c) => {
    const u = userOf(c);
    u.avatar = photo(4, "me");
    return u;
  });
  route("DELETE", "/users/me/avatar", (c) => {
    const u = userOf(c);
    u.avatar = avatar;
    return u;
  });
  route("GET", "/users/directory", (c, _m, q) => {
    userOf(c);
    const s = String(q.search ?? "").toLowerCase();
    return page(
      db.users
        .filter(
          (u) =>
            u.isActive &&
            u.role === q.role &&
            (!s ||
              `${loc(u.firstName)} ${loc(u.lastName)} ${u.email}`
                .toLowerCase()
                .includes(s)),
        )
        .map(({ id, firstName, lastName, email, role }) => ({
          id,
          firstName,
          lastName,
          email,
          role,
        })),
      q,
    );
  });
  route("GET", "/users", (c, _m, q) => {
    if (userOf(c).role !== "ADMIN") fail(403, "INSUFFICIENT_ROLE");
    return page(
      db.users.filter(
        (u) =>
          (!q.role || u.role === q.role) &&
          (q.isActive === undefined ||
            String(u.isActive) === String(q.isActive)),
      ),
      q,
    );
  });
  route("PATCH", "/users/([^/]+)/status", (c, m) => {
    const me = userOf(c);
    const u = db.users.find((x) => x.id === m[1])!;
    if (u.id === me.id) fail(422, "CANNOT_DEACTIVATE_SELF");
    u.isActive = body(c).isActive;
    return u;
  });
  route("PATCH", "/users/([^/]+)/role", (c, m) => {
    const me = userOf(c);
    const u = db.users.find((x) => x.id === m[1])!;
    if (u.id === me.id) fail(422, "CANNOT_CHANGE_OWN_ROLE");
    u.role = body(c).role;
    u.ownerVerified = false;
    u.roleSelected = true;
    return u;
  });
  route("PATCH", "/users/([^/]+)/owner-verification", (c, m) => {
    userOf(c);
    const u = db.users.find((x) => x.id === m[1])!;
    if (u.role !== "OWNER") fail(422, "USER_NOT_OWNER");
    u.ownerVerified = body(c).ownerVerified;
    push(
      u.id,
      "OWNER_VERIFICATION_CHANGED",
      "Verification updated",
      u.ownerVerified
        ? "Your account was verified."
        : "Verification was removed.",
      "User",
      u.id,
    );
    return u;
  });

  /* ---------- properties ---------- */
  route("GET", "/properties", (c, _m, q) => {
    const u = userOf(c);
    const s = String(q.search ?? "").toLowerCase();
    const rows = db.properties.filter((p) => {
      if (u.role === "TENANT") {
        if (!db.users.find((x) => x.id === p.ownerId)?.ownerVerified)
          return false;
      } else if (u.role === "OWNER" && p.ownerId !== u.id) return false;
      return (
        (!s || `${loc(p.name)} ${loc(p.address)}`.toLowerCase().includes(s)) &&
        (!q.city ||
          loc(p.city).toLowerCase().includes(String(q.city).toLowerCase())) &&
        (!q.propertyType || p.propertyType === q.propertyType)
      );
    });
    return page(rows, q);
  });
  route("GET", "/properties/([^/]+)", (c, m) => {
    const u = userOf(c);
    const p = db.properties.find((x) => x.id === m[1]);
    if (!p) fail(404, "PROPERTY_NOT_FOUND");
    if (u.role === "OWNER" && p!.ownerId !== u.id)
      fail(403, "INSUFFICIENT_ROLE");
    return u.role === "TENANT"
      ? {
          ...p,
          units: db.units.filter(
            (x) => x.propertyId === p!.id && x.status === "AVAILABLE",
          ),
        }
      : p;
  });
  route("POST", "/properties", (c) => {
    const u = userOf(c);
    const b = body(c);
    const p = {
      id: uid(),
      name: b.name,
      description: b.description ?? null,
      propertyType: b.propertyType,
      address: b.address,
      city: b.city,
      country: b.country ?? "مصر",
      ownerId: u.role === "ADMIN" ? b.ownerId : u.id,
      images: [],
      createdAt: iso(),
      updatedAt: iso(),
    };
    db.properties.unshift(p as any);
    if (b.unit)
      db.units.push({
        id: uid(),
        unitNumber: "1",
        floor: b.unit.floor ?? null,
        area: b.unit.area,
        rentAmount: b.unit.rentAmount,
        bedrooms: b.unit.bedrooms,
        bathrooms: b.unit.bathrooms,
        description: b.unit.description ?? null,
        propertyId: p.id,
        status: "AVAILABLE",
        images: [],
        createdAt: iso(),
        updatedAt: iso(),
      });
    return p;
  });
  route("PATCH", "/properties/([^/]+)", (c, m) =>
    Object.assign(db.properties.find((x) => x.id === m[1])!, body(c), {
      updatedAt: iso(),
    }),
  );
  route("DELETE", "/properties/([^/]+)", (_c, m) => {
    if (db.units.some((u) => u.propertyId === m[1] && u.status === "RENTED"))
      fail(409, "PROPERTY_HAS_RENTED_UNITS");
    db.properties = db.properties.filter((p) => p.id !== m[1]);
    db.units = db.units.filter((u) => u.propertyId !== m[1]);
    return { message: "deleted" };
  });
  route("POST", "/properties/([^/]+)/images", (c, m) => {
    const p = db.properties.find((x) => x.id === m[1])!;
    files(c, "images").forEach((f, i) =>
      p.images.push(photo(p.images.length + i + 2, f.name)),
    );
    return p;
  });
  route("DELETE", "/properties/([^/]+)/images", (c, m) => {
    const p = db.properties.find((x) => x.id === m[1])!;
    p.images = p.images.filter((i) => i.publicId !== body(c).publicId);
    return p;
  });

  /* ---------- units ---------- */
  route("GET", "/units", (c, _m, q) => {
    const u = userOf(c);
    const rows = db.units.filter(
      (x) =>
        visibleUnit(u, x) &&
        (u.role === "TENANT" || !q.status || x.status === q.status) &&
        (!q.propertyId || x.propertyId === q.propertyId) &&
        (!q.bedrooms || x.bedrooms === Number(q.bedrooms)) &&
        (!q.minArea || x.area >= Number(q.minArea)) &&
        (!q.maxArea || x.area <= Number(q.maxArea)) &&
        (!q.minPrice || x.rentAmount >= Number(q.minPrice)) &&
        (!q.maxPrice || x.rentAmount <= Number(q.maxPrice)),
    );
    return page(rows, q);
  });
  route("GET", "/units/([^/]+)", (c, m) => {
    const u = userOf(c);
    const x = db.units.find((y) => y.id === m[1]);
    if (!x) fail(404, "UNIT_NOT_FOUND");
    if (
      u.role === "TENANT" &&
      !visibleUnit(u, x!) &&
      !db.leases.some((l) => l.unitId === x!.id && l.tenantId === u.id)
    )
      fail(404, "UNIT_NOT_FOUND");
    return x;
  });
  route("POST", "/properties/([^/]+)/units", (c, m) => {
    userOf(c);
    const b = body(c);
    if (
      db.units.some(
        (x) => x.propertyId === m[1] && x.unitNumber === b.unitNumber,
      )
    )
      fail(409, "UNIT_NUMBER_TAKEN");
    const x = {
      id: uid(),
      unitNumber: b.unitNumber,
      floor: b.floor ?? null,
      area: b.area,
      rentAmount: b.rentAmount,
      bedrooms: b.bedrooms,
      bathrooms: b.bathrooms,
      description: b.description ?? null,
      propertyId: m[1],
      status: "AVAILABLE" as const,
      images: [],
      createdAt: iso(),
      updatedAt: iso(),
    };
    db.units.push(x);
    return x;
  });
  route("PATCH", "/units/([^/]+)", (c, m) => {
    const x = db.units.find((y) => y.id === m[1])!;
    if (x.status === "RENTED") fail(409, "UNIT_RENTED");
    return Object.assign(x, body(c), { updatedAt: iso() });
  });
  route("PATCH", "/units/([^/]+)/status", (c, m) => {
    const x = db.units.find((y) => y.id === m[1])!;
    if (x.status === "RENTED") fail(409, "UNIT_STATUS_TRANSITION_INVALID");
    x.status = body(c).status;
    return x;
  });
  route("DELETE", "/units/([^/]+)", (_c, m) => {
    const x = db.units.find((y) => y.id === m[1])!;
    if (x.status === "RENTED") fail(409, "UNIT_RENTED");
    if (db.leases.some((l) => l.unitId === x.id)) fail(409, "UNIT_HAS_LEASES");
    db.units = db.units.filter((y) => y.id !== x.id);
    return { message: "deleted" };
  });
  route("POST", "/units/([^/]+)/images", (c, m) => {
    const x = db.units.find((y) => y.id === m[1])!;
    files(c, "images").forEach((f, i) =>
      x.images.push(photo(x.images.length + i + 3, f.name)),
    );
    return x;
  });
  route("DELETE", "/units/([^/]+)/images", (c, m) => {
    const x = db.units.find((y) => y.id === m[1])!;
    x.images = x.images.filter((i) => i.publicId !== body(c).publicId);
    return x;
  });

  /* ---------- rental requests ---------- */
  const scopeRR = (u: User) =>
    db.rentalRequests.filter((r) =>
      u.role === "TENANT"
        ? r.tenantId === u.id
        : u.role === "ADMIN" || ownerPropIds(u).includes(r.unit!.propertyId),
    );
  route("GET", "/rental-requests", (c, _m, q) =>
    page(
      scopeRR(userOf(c)).filter(
        (r) =>
          (!q.status || r.status === q.status) &&
          (!q.unitId || r.unitId === q.unitId),
      ),
      q,
    ),
  );
  route("GET", "/rental-requests/([^/]+)", (c, m) => {
    const r = scopeRR(userOf(c)).find((x) => x.id === m[1]);
    if (!r) fail(404, "RENTAL_REQUEST_NOT_FOUND");
    return r;
  });
  route("POST", "/rental-requests", (c) => {
    const u = userOf(c);
    const b = body(c);
    const unit = db.units.find((x) => x.id === b.unitId);
    if (!unit || unit.status !== "AVAILABLE") fail(409, "UNIT_NOT_AVAILABLE");
    if (
      db.rentalRequests.some(
        (r) =>
          r.tenantId === u.id &&
          r.unitId === unit!.id &&
          r.status === "PENDING",
      )
    )
      fail(409, "RENTAL_REQUEST_DUPLICATE_PENDING");
    if (b.endDate <= b.startDate) fail(400, "INVALID_DATE_RANGE");
    const r = {
      id: uid(),
      tenantId: u.id,
      unitId: unit!.id,
      startDate: b.startDate,
      endDate: b.endDate,
      message: b.message ?? null,
      status: "PENDING" as const,
      rentAmount: unit!.rentAmount,
      leaseId: null,
      tenant: {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
      },
      unit: {
        id: unit!.id,
        unitNumber: unit!.unitNumber,
        propertyId: unit!.propertyId,
        rentAmount: unit!.rentAmount,
      },
      createdAt: iso(),
      updatedAt: iso(),
    };
    db.rentalRequests.unshift(r);
    const oid = unitOwnerId(unit!.id);
    if (oid)
      push(
        oid,
        "RENTAL_REQUEST_CREATED",
        "New rental request",
        "A tenant requested a unit.",
        "RentalRequest",
        r.id,
      );
    return r;
  });
  route("POST", "/rental-requests/([^/]+)/(approve|reject|cancel)", (c, m) => {
    userOf(c);
    const r = db.rentalRequests.find((x) => x.id === m[1])!;
    if (r.status !== "PENDING") fail(409, "RENTAL_REQUEST_NOT_PENDING");
    if (m[2] === "approve") {
      const unit = db.units.find((x) => x.id === r.unitId)!;
      const lease: Lease = {
        id: uid(),
        tenantId: r.tenantId,
        unitId: r.unitId,
        unit: {
          id: unit.id,
          unitNumber: unit.unitNumber,
          propertyId: unit.propertyId,
        },
        startDate: r.startDate,
        endDate: r.endDate,
        rentAmount: r.rentAmount,
        status: "PENDING",
        notes: null,
        createdAt: iso(),
        updatedAt: iso(),
      };
      db.leases.unshift(lease);
      r.status = "APPROVED";
      r.leaseId = lease.id;
      push(
        r.tenantId,
        "RENTAL_REQUEST_APPROVED",
        "Request approved",
        "Your request was approved.",
        "RentalRequest",
        r.id,
      );
    } else r.status = m[2] === "reject" ? "REJECTED" : "CANCELLED";
    return r;
  });

  /* ---------- leases ---------- */
  const scopeLeases = (u: User) =>
    db.leases.filter((l) =>
      u.role === "TENANT"
        ? l.tenantId === u.id
        : u.role === "ADMIN" || ownerPropIds(u).includes(l.unit.propertyId),
    );
  route("GET", "/leases", (c, _m, q) =>
    page(
      scopeLeases(userOf(c)).filter(
        (l) =>
          (!q.status || l.status === q.status) &&
          (!q.unitId || l.unitId === q.unitId) &&
          (!q.tenantId || l.tenantId === q.tenantId),
      ),
      q,
    ),
  );
  route("GET", "/leases/([^/]+)", (c, m) => {
    const l = scopeLeases(userOf(c)).find((x) => x.id === m[1]);
    if (!l) fail(404, "LEASE_NOT_FOUND");
    return l;
  });
  route("POST", "/leases", (c) => {
    userOf(c);
    const b = body(c);
    const unit = db.units.find((x) => x.id === b.unitId);
    if (!unit || unit.status !== "AVAILABLE") fail(409, "UNIT_NOT_AVAILABLE");
    if (b.endDate <= b.startDate) fail(400, "INVALID_DATE_RANGE");
    const l: Lease = {
      id: uid(),
      tenantId: b.tenantId,
      unitId: unit!.id,
      unit: {
        id: unit!.id,
        unitNumber: unit!.unitNumber,
        propertyId: unit!.propertyId,
      },
      startDate: b.startDate,
      endDate: b.endDate,
      rentAmount: unit!.rentAmount,
      status: "PENDING",
      notes: b.notes ?? null,
      createdAt: iso(),
      updatedAt: iso(),
    };
    db.leases.unshift(l);
    push(
      b.tenantId,
      "LEASE_CREATED",
      "Lease created",
      "A lease was created for you.",
      "Lease",
      l.id,
    );
    return l;
  });
  route("PATCH", "/leases/([^/]+)", (c, m) => {
    const l = db.leases.find((x) => x.id === m[1])!;
    if (l.status !== "PENDING") fail(409, "LEASE_NOT_PENDING");
    return Object.assign(l, body(c), { updatedAt: iso() });
  });
  route("POST", "/leases/([^/]+)/activate", (_c, m) => {
    const l = db.leases.find((x) => x.id === m[1])!;
    if (l.status !== "PENDING") fail(409, "LEASE_NOT_PENDING");
    if (l.startDate > day(0)) fail(422, "LEASE_NOT_STARTED");
    if (l.endDate < day(0)) fail(422, "LEASE_PERIOD_ENDED");
    l.status = "ACTIVE";
    syncUnit(l.unitId, "RENTED");
    push(
      l.tenantId,
      "LEASE_ACTIVATED",
      "Lease activated",
      "Your lease is now active.",
      "Lease",
      l.id,
    );
    return l;
  });
  route("POST", "/leases/([^/]+)/terminate", (_c, m) => {
    const l = db.leases.find((x) => x.id === m[1])!;
    if (l.status !== "PENDING" && l.status !== "ACTIVE")
      fail(409, "LEASE_NOT_TERMINABLE");
    l.status = "TERMINATED";
    syncUnit(l.unitId, "AVAILABLE");
    return l;
  });
  route("POST", "/leases/([^/]+)/renew", (c, m) => {
    const l = db.leases.find((x) => x.id === m[1])!;
    const e = body(c).endDate;
    if (e <= l.endDate) fail(400, "RENEWAL_END_NOT_AFTER_CURRENT");
    l.endDate = e;
    return l;
  });

  /* ---------- renewals ---------- */
  const scopeRen = (u: User) =>
    db.renewals.filter((r) =>
      u.role === "TENANT"
        ? r.tenantId === u.id
        : u.role === "ADMIN" || ownerPropIds(u).includes(r.unit!.propertyId),
    );
  route("GET", "/lease-renewal-requests", (c, _m, q) =>
    page(
      scopeRen(userOf(c)).filter(
        (r) =>
          (!q.status || r.status === q.status) &&
          (!q.leaseId || r.leaseId === q.leaseId),
      ),
      q,
    ),
  );
  route("GET", "/lease-renewal-requests/([^/]+)", (c, m) => {
    const r = scopeRen(userOf(c)).find((x) => x.id === m[1]);
    if (!r) fail(404, "RENEWAL_REQUEST_NOT_FOUND");
    return r;
  });
  route("POST", "/lease-renewal-requests", (c) => {
    const u = userOf(c);
    const b = body(c);
    const l = db.leases.find((x) => x.id === b.leaseId)!;
    if (db.renewals.some((r) => r.leaseId === l.id && r.status === "PENDING"))
      fail(409, "RENEWAL_REQUEST_DUPLICATE_PENDING");
    if (b.endDate <= l.endDate) fail(400, "RENEWAL_END_NOT_AFTER_CURRENT");
    const r = {
      id: uid(),
      leaseId: l.id,
      tenantId: u.id,
      requestedEndDate: b.endDate,
      message: b.message ?? null,
      status: "PENDING" as const,
      createdAt: iso(),
      updatedAt: iso(),
      tenant: {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
      },
      lease: {
        id: l.id,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        rentAmount: l.rentAmount,
      },
      unit: l.unit,
    };
    db.renewals.unshift(r);
    return r;
  });
  route(
    "POST",
    "/lease-renewal-requests/([^/]+)/(approve|reject|cancel)",
    (c, m) => {
      const r = db.renewals.find((x) => x.id === m[1])!;
      if (r.status !== "PENDING") fail(409, "RENEWAL_REQUEST_NOT_PENDING");
      if (m[2] === "approve") {
        const e = body(c).endDate ?? r.requestedEndDate;
        const l = db.leases.find((x) => x.id === r.leaseId)!;
        if (e <= l.endDate) fail(400, "RENEWAL_END_NOT_AFTER_CURRENT");
        l.endDate = e;
        r.status = "APPROVED";
      } else r.status = m[2] === "reject" ? "REJECTED" : "CANCELLED";
      return r;
    },
  );

  /* ---------- maintenance ---------- */
  const scopeM = (u: User) =>
    db.maintenance.filter((m) =>
      u.role === "TENANT"
        ? m.tenantId === u.id
        : u.role === "MAINTENANCE_STAFF"
          ? m.assignedStaffId === u.id
          : u.role === "ADMIN" || ownerPropIds(u).includes(m.unit.propertyId),
    );
  const getM = (c: InternalAxiosRequestConfig, id: string) => {
    const m = scopeM(userOf(c)).find((x) => x.id === id);
    if (!m) fail(404, "MAINTENANCE_NOT_FOUND");
    return m!;
  };
  const step = (
    m: ReturnType<typeof getM>,
    to: any,
    by: User,
    notes?: string,
  ) => {
    db.history.push({
      id: uid(),
      requestId: m.id,
      previousStatus: m.status,
      newStatus: to,
      changedById: by.id,
      notes: notes ?? null,
      createdAt: iso(),
    });
    m.status = to;
    m.updatedAt = iso();
    return m;
  };
  route("GET", "/maintenance", (c, _m, q) =>
    page(
      scopeM(userOf(c)).filter(
        (m) =>
          (!q.status || m.status === q.status) &&
          (!q.priority || m.priority === q.priority) &&
          (!q.category || m.category === q.category),
      ),
      q,
    ),
  );
  route("GET", "/maintenance/([^/]+)/history", (c, m) => {
    getM(c, m[1]);
    return db.history.filter((h) => h.requestId === m[1]);
  });
  route("GET", "/maintenance/([^/]+)", (c, m) => getM(c, m[1]));
  route("POST", "/maintenance", (c) => {
    const u = userOf(c);
    const b = body(c);
    const l = db.leases.find(
      (x) =>
        x.tenantId === u.id && x.unitId === b.unitId && x.status === "ACTIVE",
    );
    if (!l) fail(400, "NO_ACTIVE_LEASE");
    const m = {
      id: uid(),
      title: b.title,
      description: b.description,
      category: b.category,
      priority: b.priority,
      images: files(c, "images").map((f, i) => photo(i + 5, f.name)),
      unitId: l!.unitId,
      unit: l!.unit,
      tenantId: u.id,
      status: "OPEN" as const,
      assignedStaffId: null,
      scheduledDate: null,
      completionImages: [],
      resolutionDescription: null,
      resolvedAt: null,
      createdAt: iso(),
      updatedAt: iso(),
    };
    db.maintenance.unshift(m);
    const oid = unitOwnerId(l!.unitId);
    if (oid)
      push(
        oid,
        "MAINTENANCE_CREATED",
        "New maintenance request",
        "A tenant reported a problem.",
        "MaintenanceRequest",
        m.id,
      );
    return m;
  });
  route("POST", "/maintenance/([^/]+)/images", (c, m) => {
    const r = getM(c, m[1]);
    if (r.status !== "OPEN") fail(409, "MAINTENANCE_INVALID_STATE");
    files(c, "images").forEach((f, i) =>
      r.images.push(photo(r.images.length + i + 5, f.name)),
    );
    return r;
  });
  route("DELETE", "/maintenance/([^/]+)/images", (c, m) => {
    const r = getM(c, m[1]);
    if (r.status !== "OPEN") fail(409, "MAINTENANCE_INVALID_STATE");
    r.images = r.images.filter((i) => i.publicId !== body(c).publicId);
    return r;
  });
  route("POST", "/maintenance/([^/]+)/assign", (c, m) => {
    const u = userOf(c);
    const r = getM(c, m[1]);
    if (r.status !== "OPEN") fail(409, "MAINTENANCE_INVALID_STATE");
    const b = body(c);
    r.assignedStaffId = b.assignedStaffId;
    r.scheduledDate = b.scheduledDate ?? null;
    push(
      b.assignedStaffId,
      "MAINTENANCE_ASSIGNED",
      "Maintenance assigned",
      "A request was assigned to you.",
      "MaintenanceRequest",
      r.id,
    );
    return step(r, "ASSIGNED", u, b.notes);
  });
  route("POST", "/maintenance/([^/]+)/start", (c, m) => {
    const u = userOf(c);
    const r = getM(c, m[1]);
    if (r.status !== "ASSIGNED") fail(409, "MAINTENANCE_INVALID_STATE");
    return step(r, "IN_PROGRESS", u, body(c).notes);
  });
  route("POST", "/maintenance/([^/]+)/complete", (c, m) => {
    const u = userOf(c);
    const r = getM(c, m[1]);
    if (r.status !== "IN_PROGRESS") fail(409, "MAINTENANCE_INVALID_STATE");
    const b = body(c);
    r.resolutionDescription = b.resolutionDescription;
    r.completionImages = files(c, "completionImages").map((f, i) =>
      photo(i + 9, f.name),
    );
    r.resolvedAt = iso();
    return step(r, "RESOLVED", u, b.notes);
  });
  route("POST", "/maintenance/([^/]+)/close", (c, m) => {
    const u = userOf(c);
    const r = getM(c, m[1]);
    if (r.status !== "RESOLVED") fail(409, "MAINTENANCE_INVALID_STATE");
    return step(r, "CLOSED", u, body(c).notes);
  });
  route("POST", "/maintenance/([^/]+)/cancel", (c, m) => {
    const u = userOf(c);
    const r = getM(c, m[1]);
    if (r.status !== "OPEN" && r.status !== "ASSIGNED")
      fail(409, "MAINTENANCE_INVALID_STATE");
    return step(r, "CANCELLED", u, body(c).notes);
  });
  route("DELETE", "/maintenance/([^/]+)/completion-images", (c, m) => {
    const r = getM(c, m[1]);
    r.completionImages = r.completionImages.filter(
      (i) => i.publicId !== body(c).publicId,
    );
    return r;
  });

  /* ---------- notifications / audit / analytics ---------- */
  route("GET", "/notifications", (c, _m, q) => {
    const u = userOf(c);
    const mine = db.notifications.filter((n) => n.userId === u.id);
    const rows = q.unread === "true" ? mine.filter((n) => !n.isRead) : mine;
    const res = page(
      rows.map(({ userId: _u, ...n }) => n),
      q,
    );
    return {
      ...res,
      meta: { ...res.meta, unreadCount: mine.filter((n) => !n.isRead).length },
    };
  });
  route("PATCH", "/notifications/read-all", (c) => {
    const u = userOf(c);
    db.notifications.forEach((n) => {
      if (n.userId === u.id) n.isRead = true;
    });
    return { updated: true };
  });
  route("PATCH", "/notifications/([^/]+)/read", (c, m) => {
    const n = db.notifications.find(
      (x) => x.id === m[1] && x.userId === userOf(c).id,
    );
    if (!n) fail(404, "NOTIFICATION_NOT_FOUND");
    n!.isRead = true;
    return n;
  });
  route("GET", "/audit-logs", (c, _m, q) => {
    if (userOf(c).role !== "ADMIN") fail(403, "INSUFFICIENT_ROLE");
    return page(
      db.audit.filter(
        (a) =>
          (!q.action || a.action === q.action) &&
          (!q.entity || a.entity === q.entity) &&
          (!q.userId || a.userId === q.userId),
      ),
      q,
    );
  });
  route("GET", "/analytics/dashboard", (c) => {
    const u = userOf(c);
    const props = ownerPropIds(u);
    const units = db.units.filter((x) => props.includes(x.propertyId));
    const ms = db.maintenance.filter((m) => props.includes(m.unit.propertyId));
    const occ = units.filter((x) => x.status === "RENTED").length;
    const cats: Record<string, number> = {};
    ms.forEach((m) => {
      cats[m.category] = (cats[m.category] ?? 0) + 1;
    });
    return {
      totalProperties: props.length,
      totalUnits: units.length,
      occupiedUnits: occ,
      availableUnits: units.filter((x) => x.status === "AVAILABLE").length,
      occupancyRate: units.length
        ? Math.round((occ / units.length) * 1000) / 10
        : 0,
      activeLeases: db.leases.filter(
        (l) => l.status === "ACTIVE" && props.includes(l.unit.propertyId),
      ).length,
      expiredLeases: db.leases.filter(
        (l) => l.status === "EXPIRED" && props.includes(l.unit.propertyId),
      ).length,
      openMaintenanceRequests: ms.filter(
        (m) => !["RESOLVED", "CLOSED", "CANCELLED"].includes(m.status),
      ).length,
      resolvedMaintenanceRequests: ms.filter(
        (m) => m.status === "RESOLVED" || m.status === "CLOSED",
      ).length,
      avgMaintenanceResolutionHours: 31.5,
      mostCommonMaintenanceCategories: Object.entries(cats)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    };
  });

  api.defaults.adapter = async (config) => {
    await wait();
    const url = (config.url ?? "")
      .replace(config.baseURL ?? "", "")
      .replace(/^.*\/api\/v1/, "")
      .split("?")[0];
    const method = (config.method ?? "get").toUpperCase();
    const q = { ...(config.params ?? {}) };
    try {
      for (const [m, re, fn] of handlers) {
        if (m !== method) continue;
        const match = re.exec(url);
        if (!match) continue;
        const out = fn(config, match, q) as any;
        if (
          out &&
          typeof out === "object" &&
          "data" in out &&
          "meta" in out &&
          Array.isArray(out.data)
        )
          return ok(config, out.data, out.meta);
        return ok(config, out);
      }
      throw new Fail(404, "NOT_FOUND");
    } catch (e) {
      const f = e instanceof Fail ? e : new Fail(500, "INTERNAL_ERROR");
      const res = respond(config, f.status, {
        success: false,
        statusCode: f.status,
        error: f.code,
        code: f.code,
        message: f.code,
        details: f.details,
        path: url,
        timestamp: iso(),
      });
      throw new AxiosError(f.code, String(f.status), config, {}, res);
    }
  };
}
