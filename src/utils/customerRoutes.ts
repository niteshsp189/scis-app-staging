/**
 * Maps a customer status to the correct URL prefix for navigation.
 * Used throughout the app to ensure customers are viewed via their
 * type-specific routes (e.g., /prospects/view/:id, /formers/view/:id).
 */
export function getCustomerViewUrl(id: number | string, status?: string): string {
  switch (status) {
    case "Prospect":
      return `/prospects/view/${id}`;
    case "Former":
      return `/formers/view/${id}`;
    case "Deceased":
      return `/deceaseds/view/${id}`;
    case "Client":
    default:
      return `/clients/view/${id}`;
  }
}
