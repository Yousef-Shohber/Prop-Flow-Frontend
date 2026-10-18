import type {
  AuditAction,
  LeaseRenewalRequestStatus,
  LeaseStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  NotificationType,
  PropertyType,
  RentalRequestStatus,
  UnitStatus,
  UserRole,
} from "./enums";

export interface ImageRef {
  url: string;
  publicId: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  roleSelected: boolean;
  ownerVerified: boolean;
  avatar: ImageRef | null;
  isActive: boolean;
  isEmailVerified: boolean;
  images?: ImageRef[];
  createdAt: string;
  updatedAt: string;
}
export interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface Property {
  id: string;
  name: string;
  description: string | null;
  propertyType: PropertyType;
  address: string;
  city: string;
  country: string;
  ownerId: string;
  images: ImageRef[];
  createdAt: string;
  updatedAt: string;
  /** Present only when a TENANT reads GET /properties/:id */
  units?: Unit[];
}

export interface Unit {
  id: string;
  unitNumber: string;
  floor: number | null;
  area: number;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  description: string | null;
  propertyId: string;
  status: UnitStatus;
  images: ImageRef[];
  createdAt: string;
  updatedAt: string;
}
export interface UnitSummary {
  id: string;
  unitNumber: string;
  propertyId: string;
}

export interface TenantSummary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface RentalRequest {
  id: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  message: string | null;
  status: RentalRequestStatus;
  rentAmount: number;
  leaseId: string | null;
  tenant?: TenantSummary;
  unit?: {
    id: string;
    unitNumber: string;
    propertyId: string;
    rentAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  unitId: string;
  unit: UnitSummary;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: LeaseStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseRenewalRequest {
  id: string;
  leaseId: string;
  tenantId: string;
  requestedEndDate: string;
  message: string | null;
  status: LeaseRenewalRequestStatus;
  createdAt: string;
  updatedAt: string;
  tenant?: TenantSummary;
  lease?: {
    id: string;
    startDate: string;
    endDate: string;
    status: LeaseStatus;
    rentAmount: number;
  };
  unit?: UnitSummary;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  images: ImageRef[];
  unitId: string;
  unit: UnitSummary;
  tenantId: string;
  status: MaintenanceStatus;
  assignedStaffId: string | null;
  scheduledDate: string | null;
  completionImages: ImageRef[];
  resolutionDescription: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface MaintenanceHistoryItem {
  id: string;
  requestId: string;
  previousStatus: MaintenanceStatus | null;
  newStatus: MaintenanceStatus;
  changedById: string;
  notes: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction | string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  /** Optional enrichment (newer backends). The UI resolves names itself when these are absent. */
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  } | null;
  entityLabel?: string | null;
  refs?: Record<string, { label: string | null; entity?: string }>;
}

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  activeLeases: number;
  expiredLeases: number;
  openMaintenanceRequests: number;
  resolvedMaintenanceRequests: number;
  avgMaintenanceResolutionHours: number | null;
  mostCommonMaintenanceCategories: {
    category: MaintenanceCategory | string;
    count: number;
  }[];
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: User;
}
