import { paths } from "@/routes/paths";
import type { AppNotification } from "@/types/models";

/** relatedEntityType -> route (spec §12). Anything unknown simply is not clickable. */
export function notificationTarget(
  n: Pick<AppNotification, "relatedEntityType" | "relatedEntityId">,
): string | null {
  const id = n.relatedEntityId;
  switch (n.relatedEntityType) {
    case "Lease":
      return id ? paths.lease(id) : null;
    case "RentalRequest":
      return id ? paths.rentalRequest(id) : null;
    case "MaintenanceRequest":
      return id ? paths.maintenanceItem(id) : null;
    case "LeaseRenewalRequest":
      return id ? paths.renewal(id) : null;
    case "User":
      return paths.profile;
    default:
      return null;
  }
}
