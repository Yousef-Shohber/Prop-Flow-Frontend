import type { UserRole } from "@/types/enums";

/** All paths live here. Dynamic ones are functions. */
export const paths = {
  landing: "/",
  login: "/login",
  register: "/register",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  chooseRole: "/choose-role",
  terms: "/terms",
  privacy: "/privacy",
  forbidden: "/403",
  home: "/home",
  dashboard: "/dashboard",
  properties: "/properties",
  propertyNew: "/properties/new",
  property: (id: string) => `/properties/${id}`,
  propertyEdit: (id: string) => `/properties/${id}/edit`,
  unitNew: (propertyId: string) => `/properties/${propertyId}/units/new`,
  units: "/units",
  unit: (id: string) => `/units/${id}`,
  unitEdit: (id: string) => `/units/${id}/edit`,
  rentalRequests: "/rental-requests",
  rentalRequestNew: (unitId?: string) =>
    unitId ? `/rental-requests/new?unitId=${unitId}` : "/rental-requests/new",
  rentalRequest: (id: string) => `/rental-requests/${id}`,
  leases: "/leases",
  leaseNew: "/leases/new",
  lease: (id: string) => `/leases/${id}`,
  leaseContract: (id: string) => `/leases/${id}/contract`,
  leaseEdit: (id: string) => `/leases/${id}/edit`,
  renewals: "/lease-renewal-requests",
  renewal: (id: string) => `/lease-renewal-requests/${id}`,
  maintenance: "/maintenance",
  maintenanceNew: "/maintenance/new",
  maintenanceItem: (id: string) => `/maintenance/${id}`,
  notifications: "/notifications",
  profile: "/profile",
  users: "/users",
  auditLogs: "/audit-logs",
  timeline: "/timeline",
  rentRoll: "/reports/rent-roll",
  help: "/help",
} as const;

/** Everyone lands on the Welcome / Overview page first; the analytics dashboard stays one click away (owners, admins). */
export const ROLE_HOME: Record<UserRole, string> = {
  TENANT: paths.home,
  OWNER: paths.home,
  ADMIN: paths.home,
  MAINTENANCE_STAFF: paths.home,
};
