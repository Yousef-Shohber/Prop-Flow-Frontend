// Enums are copied verbatim from the backend spec (Appendix A).
export const UserRole = [
  "TENANT",
  "OWNER",
  "MAINTENANCE_STAFF",
  "ADMIN",
] as const;
export const PropertyType = [
  "BUILDING",
  "VILLA",
  "STUDIO",
  "TOWNHOUSE",
  "COMMERCIAL",
  "OTHER",
] as const;
export const UnitStatus = ["AVAILABLE", "RENTED", "MAINTENANCE"] as const;
export const LeaseStatus = [
  "PENDING",
  "ACTIVE",
  "TERMINATED",
  "EXPIRED",
] as const;
export const LeaseRenewalRequestStatus = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export const RentalRequestStatus = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
] as const;
export const MaintenanceCategory = [
  "PLUMBING",
  "ELECTRICITY",
  "HVAC",
  "CARPENTRY",
  "APPLIANCES",
  "OTHER",
] as const;
export const MaintenancePriority = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const MaintenanceStatus = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;
export const NotificationType = [
  "LEASE_CREATED",
  "LEASE_ACTIVATED",
  "LEASE_TERMINATED",
  "RENTAL_REQUEST_CREATED",
  "RENTAL_REQUEST_APPROVED",
  "RENTAL_REQUEST_REJECTED",
  "RENTAL_REQUEST_CANCELLED",
  "LEASE_RENEWED",
  "LEASE_RENEWAL_REQUESTED",
  "LEASE_RENEWAL_REJECTED",
  "LEASE_RENEWAL_CANCELLED",
  "MAINTENANCE_CREATED",
  "MAINTENANCE_ASSIGNED",
  "MAINTENANCE_STARTED",
  "MAINTENANCE_RESOLVED",
  "MAINTENANCE_CLOSED",
  "MAINTENANCE_CANCELLED",
  "RENTAL_REQUEST_EXPIRED",
  "OWNER_VERIFICATION_CHANGED",
] as const;
export const AuditAction = [
  "PROPERTY_CREATED",
  "PROPERTY_UPDATED",
  "PROPERTY_DELETED",
  "UNIT_CREATED",
  "UNIT_UPDATED",
  "UNIT_DELETED",
  "LEASE_CREATED",
  "LEASE_ACTIVATED",
  "LEASE_TERMINATED",
  "LEASE_RENEWED",
  "RENTAL_REQUEST_CREATED",
  "RENTAL_REQUEST_APPROVED",
  "RENTAL_REQUEST_REJECTED",
  "RENTAL_REQUEST_CANCELLED",
  "LEASE_RENEWAL_REQUESTED",
  "LEASE_RENEWAL_REJECTED",
  "LEASE_RENEWAL_CANCELLED",
  "UNIT_STATUS_CHANGED",
  "MAINTENANCE_ASSIGNED",
  "MAINTENANCE_COMPLETED",
  "USER_STATUS_CHANGED",
  "ROLE_CHANGED",
  "OWNER_VERIFICATION_CHANGED",
] as const;

export type UserRole = (typeof UserRole)[number];
export type PropertyType = (typeof PropertyType)[number];
export type UnitStatus = (typeof UnitStatus)[number];
export type LeaseStatus = (typeof LeaseStatus)[number];
export type LeaseRenewalRequestStatus =
  (typeof LeaseRenewalRequestStatus)[number];
export type RentalRequestStatus = (typeof RentalRequestStatus)[number];
export type MaintenanceCategory = (typeof MaintenanceCategory)[number];
export type MaintenancePriority = (typeof MaintenancePriority)[number];
export type MaintenanceStatus = (typeof MaintenanceStatus)[number];
export type NotificationType = (typeof NotificationType)[number];
export type AuditAction = (typeof AuditAction)[number];

/** Frontend-only: which property types are a single rentable unit (spec §14). */
export const PROPERTY_TYPE_DEFAULTS: Record<PropertyType, "single" | "multi"> =
  {
    VILLA: "single",
    STUDIO: "single",
    TOWNHOUSE: "single",
    BUILDING: "multi",
    COMMERCIAL: "multi",
    OTHER: "multi",
  };
