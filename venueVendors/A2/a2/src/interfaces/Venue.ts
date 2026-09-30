export interface Venue {
  venueId: number;
  venueName: string;
  type: string;
  location: string;
  capacity: number;
  blockedDateFrom: string | null;
  blockedDateTo: string | null;
  recommendedSuitability: string;
  isFeatured: boolean;
}
