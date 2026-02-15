/**
 * Maps a customer status to the correct URL prefix for navigation.
 * Used throughout the app to ensure customers are viewed via their
 * type-specific routes (e.g., /prospects/view/:id, /formers/view/:id).
 * 
 * @param id - Customer ID or legacy_client_id
 * @param status - Customer status
 * @param legacyClientId - Optional legacy_client_id for converted dependents
 */
export function getCustomerViewUrl(
  id: number | string, 
  status?: string, 
  legacyClientId?: number | null
): string {
  // Use legacy_client_id if available and different from id
  // This ensures converted dependents (971 records) use their old system ID in URLs
  const displayId = legacyClientId && legacyClientId !== id ? legacyClientId : id;
  
  switch (status) {
    case "Prospect":
      return `/prospects/view/${displayId}`;
    case "Former":
      return `/formers/view/${displayId}`;
    case "Deceased":
      return `/deceaseds/view/${displayId}`;
    case "Client":
    default:
      return `/clients/view/${displayId}`;
  }
}
