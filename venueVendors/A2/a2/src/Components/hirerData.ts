export interface VenueOption {
  id: string;
  name: string;
  location: string;
  capacity: number;
  price: string;
  suitability: string[];
  description: string;
  image: string;
  managedBy: string;
}

export interface HiringHistoryItem {
  id: string;
  venueName: string;
  location: string;
  eventName: string;
  hireDate: string;
  rating: number;
}

export const SAMPLE_VENUES: VenueOption[] = [
  {
    id: "venue-1",
    name: "Riverside Loft",
    location: "Southbank",
    capacity: 120,
    price: "$2,400",
    suitability: ["Corporate", "Networking", "Workshop"],
    description:
      "Modern riverside venue with city views, AV setup, and flexible seating.",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    managedBy: "Luca Bennett",
  },
  {
    id: "venue-2",
    name: "Garden Pavilion",
    location: "Richmond",
    capacity: 180,
    price: "$3,100",
    suitability: ["Wedding", "Birthday", "Engagement"],
    description:
      "Open garden venue with a covered pavilion and warm decorative lighting.",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    managedBy: "Chloe Adams",
  },
  {
    id: "venue-3",
    name: "Studio 9 Events",
    location: "Docklands",
    capacity: 90,
    price: "$1,950",
    suitability: ["Corporate", "Workshop", "Launch"],
    description:
      "Compact industrial studio ideal for product launches and workshops.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    managedBy: "Ethan Ali",
  },
  {
    id: "venue-4",
    name: "Oak Hall",
    location: "Carlton",
    capacity: 250,
    price: "$4,200",
    suitability: ["Wedding", "Formal", "Conference"],
    description:
      "Large hall with stage lighting, banquet tables, and flexible floor plans.",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    managedBy: "Luca Bennett",
  },
  {
    id: "venue-5",
    name: "Skyline Terrace",
    location: "Melbourne CBD",
    capacity: 140,
    price: "$3,450",
    suitability: ["Networking", "Cocktail", "Corporate"],
    description:
      "Rooftop venue with skyline views, premium catering area, and outdoor seating.",
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    managedBy: "Chloe Adams",
  },
  {
    id: "venue-6",
    name: "Harbour Function Room",
    location: "Port Melbourne",
    capacity: 200,
    price: "$3,850",
    suitability: ["Birthday", "Wedding", "Community"],
    description:
      "Waterfront function room with large open floor space and catering access.",
    image:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    managedBy: "Ethan Ali",
  },
];

export const SAMPLE_HISTORY_BY_EMAIL: Record<string, HiringHistoryItem[]> = {
  "mia.hirer@venuevendors.com": [
    {
      id: "history-1",
      venueName: "Oak Hall",
      location: "Carlton",
      eventName: "Winter Gala Dinner",
      hireDate: "2025-07-14",
      rating: 5,
    },
    {
      id: "history-2",
      venueName: "Skyline Terrace",
      location: "Melbourne CBD",
      eventName: "Startup Networking Night",
      hireDate: "2025-10-22",
      rating: 4,
    },
    {
      id: "history-3",
      venueName: "Garden Pavilion",
      location: "Richmond",
      eventName: "Family Engagement Party",
      hireDate: "2026-01-18",
      rating: 4,
    },
  ],
  "noah.hirer@venuevendors.com": [
    {
      id: "history-4",
      venueName: "Studio 9 Events",
      location: "Docklands",
      eventName: "Team Planning Workshop",
      hireDate: "2025-11-05",
      rating: 4,
    },
    {
      id: "history-5",
      venueName: "Riverside Loft",
      location: "Southbank",
      eventName: "Client Meetup",
      hireDate: "2026-02-09",
      rating: 5,
    },
  ],
};