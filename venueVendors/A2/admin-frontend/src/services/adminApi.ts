const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_URL || "http://127.0.0.1:4000/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error(
      `Could not reach admin backend at ${GRAPHQL_URL}. Make sure admin-backend is running on port 4000.`
    );
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  if (!result.data) {
    throw new Error("No data returned from admin backend.");
  }

  return result.data;
}

export interface AdminLoginResult {
  success: boolean;
  message: string;
  token: string | null;
}

export interface VendorItem {
  id: string;
  name: string;
  email: string;
  venue: string;
}

export interface VenueItem {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  recommendedSuitability: string;
  isFeatured: boolean;
  vendorId: number | null;
  vendorName: string;
}

export interface PopularVenueReport {
  venueId: string;
  venueName: string;
  bookingCount: number;
  mostPopularDay: string;
  mostPopularTimeSlot: string;
}

export interface ActiveApplicantReport {
  hirerId: string;
  hirerName: string;
  totalApplications: number;
  successfulBookings: number;
  successRate: number;
}

export interface VenueFormInput {
  name: string;
  type: string;
  location: string;
  capacity: number;
  recommendedSuitability: string;
  vendorId: number;
}

export interface AdminDashboardData {
  vendors: VendorItem[];
  venues: VenueItem[];
  featuredVenues: VenueItem[];
  topPopularVenues: PopularVenueReport[];
  topActiveApplicants: ActiveApplicantReport[];
}

export async function adminLogin(username: string, password: string) {
  const data = await graphqlRequest<{ adminLogin: AdminLoginResult }>(
    `
      mutation AdminLogin($username: String!, $password: String!) {
        adminLogin(username: $username, password: $password) {
          success
          message
          token
        }
      }
    `,
    { username, password }
  );

  return data.adminLogin;
}

export async function getAdminDashboardData(token: string) {
  return graphqlRequest<AdminDashboardData>(
    `
      query AdminDashboardData {
        vendors { id name email venue }
        venues {
          id
          name
          type
          location
          capacity
          recommendedSuitability
          isFeatured
          vendorId
          vendorName
        }
        featuredVenues {
          id
          name
          type
          location
          capacity
          recommendedSuitability
          isFeatured
          vendorId
          vendorName
        }
        topPopularVenues {
          venueId
          venueName
          bookingCount
          mostPopularDay
          mostPopularTimeSlot
        }
        topActiveApplicants {
          hirerId
          hirerName
          totalApplications
          successfulBookings
          successRate
        }
      }
    `,
    undefined,
    token
  );
}

export async function createVenue(token: string, input: VenueFormInput) {
  const data = await graphqlRequest<{ createVenue: VenueItem }>(
    `
      mutation CreateVenue($input: VenueInput!) {
        createVenue(input: $input) {
          id name type location capacity recommendedSuitability isFeatured vendorId vendorName
        }
      }
    `,
    { input },
    token
  );

  return data.createVenue;
}

export async function updateVenue(
  token: string,
  id: string,
  input: VenueFormInput
) {
  const data = await graphqlRequest<{ updateVenue: VenueItem }>(
    `
      mutation UpdateVenue($id: ID!, $input: VenueInput!) {
        updateVenue(id: $id, input: $input) {
          id name type location capacity recommendedSuitability isFeatured vendorId vendorName
        }
      }
    `,
    { id, input },
    token
  );

  return data.updateVenue;
}

export async function deleteVenue(token: string, id: string) {
  const data = await graphqlRequest<{ deleteVenue: boolean }>(
    `mutation DeleteVenue($id: ID!) { deleteVenue(id: $id) }`,
    { id },
    token
  );

  return data.deleteVenue;
}

export async function assignVendorToVenue(
  token: string,
  venueId: string,
  vendorId: string
) {
  const data = await graphqlRequest<{ assignVendorToVenue: VenueItem }>(
    `
      mutation AssignVendorToVenue($venueId: ID!, $vendorId: ID!) {
        assignVendorToVenue(venueId: $venueId, vendorId: $vendorId) {
          id name type location capacity recommendedSuitability isFeatured vendorId vendorName
        }
      }
    `,
    { venueId, vendorId },
    token
  );

  return data.assignVendorToVenue;
}

export async function setFeaturedVenue(
  token: string,
  venueId: string,
  isFeatured: boolean
) {
  const data = await graphqlRequest<{ setFeaturedVenue: VenueItem }>(
    `
      mutation SetFeaturedVenue($venueId: ID!, $isFeatured: Boolean!) {
        setFeaturedVenue(venueId: $venueId, isFeatured: $isFeatured) {
          id name type location capacity recommendedSuitability isFeatured vendorId vendorName
        }
      }
    `,
    { venueId, isFeatured },
    token
  );

  return data.setFeaturedVenue;
}
