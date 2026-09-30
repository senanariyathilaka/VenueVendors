import Head from "next/head";
import { useEffect, useState } from "react";
import { Header } from "@/Components/Header";
import { Footer } from "@/Components/Footer";
import useFadeInHook from "@/Components/useFadeInHook";
import { venueApi } from "@/services/venueEditor";
import { vendorApi } from "@/services/vendorApi";
import type { Venue } from "@/interfaces/Venue";
import { useAuth } from "@/Context/AuthContext";

interface VenueData {
  name: string;
  type: string;
  location: string;
  capacity: number;
  recommendedSuitability: string;
}

interface VenueBooking {
  id: number;
  eventName: string;
  expectedGuests: number;
  bookingStart: string;
  bookingEnd: string;
  durationHours: number;
  status: string;
  hirerName: string;
  hirerEmail: string;
}

const PREDEFINED_SUITABILITY_OPTIONS = [
  "Wedding",
  "Birthday",
  "Dinner",
  "Classical Music",
  "Rock Concert",
  "Tennis",
  "Corporate",
  "Networking",
  "Workshop",
  "Conference",
  "Launch",
  "Cocktail",
  "Community",
  "Engagement",
  "Formal",
];

export default function VenueEditor() {
  const { ref, isVisible } = useFadeInHook();
  const { currentUser } = useAuth();

  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [venueLocation, setVenueLocation] = useState("");
  const [venueCapacity, setVenueCapacity] = useState(0);
  const [venueSuitability, setVenueSuitability] = useState<string[]>([]);
  const [showCreateKeywords, setShowCreateKeywords] = useState(false);

  const [venueErrors, setVenueErrors] = useState({
    name: "",
    type: "",
    location: "",
    capacity: "",
    suitability: "",
  });

  const [venues, setVenues] = useState<Venue[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  const [editingVenueId, setEditingVenueId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState(0);
  const [editSuitability, setEditSuitability] = useState<string[]>([]);

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null
  );

  const [venueBookings, setVenueBookings] = useState<
    Record<number, VenueBooking[]>
  >({});

  const toggleKeyword = (
    keyword: string,
    currentValues: string[],
    setValues: (values: string[]) => void
  ) => {
    if (currentValues.includes(keyword)) {
      setValues(currentValues.filter((item) => item !== keyword));
    } else {
      setValues([...currentValues, keyword]);
    }
  };

  const validateVenueForm = () => {
    const errors = {
      name: "",
      type: "",
      location: "",
      capacity: "",
      suitability: "",
    };

    if (!venueName.trim()) {
      errors.name = "Venue name is required.";
    }

    if (!venueType.trim()) {
      errors.type = "Venue type is required.";
    }

    if (!venueLocation.trim()) {
      errors.location = "Venue location is required.";
    }

    if (!venueCapacity || venueCapacity <= 0) {
      errors.capacity = "Capacity must be greater than 0.";
    }

    if (venueSuitability.length === 0) {
      errors.suitability = "Select at least one suitability keyword.";
    }

    setVenueErrors(errors);

    return !Object.values(errors).some((message) => message !== "");
  };

  const loadVendorVenues = async (vendorId: number) => {
    setIsPageLoading(true);
    setPageError("");

    try {
      const venuesResponse = await vendorApi.getVenues(vendorId);
      setVenues(venuesResponse);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Cannot load venues. Please try again."
      );
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadVenueBookings = async (venueId: number) => {
    try {
      const bookings = await venueApi.getVenueBookings(venueId);

      setVenueBookings((prev) => ({
        ...prev,
        [venueId]: bookings,
      }));
    } catch (error) {
      console.error("Error loading venue bookings:", error);
    }
  };

  const handleVenueClick = (venueId: number) => {
    const newSelectedVenueId = selectedVenueId === venueId ? null : venueId;

    setSelectedVenueId(newSelectedVenueId);
    setSelectedBookingId(null);

    if (newSelectedVenueId) {
      void loadVenueBookings(newSelectedVenueId);
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setEditingVenueId(venue.venueId);
    setSelectedVenueId(venue.venueId);

    setEditName(venue.venueName);
    setEditType(venue.type);
    setEditLocation(venue.location);
    setEditCapacity(venue.capacity);

    setEditSuitability(
      venue.recommendedSuitability
        ? venue.recommendedSuitability.split(", ").filter(Boolean)
        : []
    );
  };

  const handleSaveVenue = async (venueId: number) => {
    try {
      const updatedVenue = await venueApi.updateVenue(venueId, {
        name: editName,
        type: editType,
        location: editLocation,
        capacity: editCapacity,
        recommendedSuitability: editSuitability.join(", "),
      });

      setVenues((prev) =>
        prev.map((venue) => (venue.venueId === venueId ? updatedVenue : venue))
      );

      setEditingVenueId(null);
    } catch (error) {
      console.error("Error updating venue:", error);
    }
  };

  const handleDeleteVenue = async (venueId: number) => {
    try {
      await venueApi.deleteVenue(venueId);

      setVenues((prev) => prev.filter((venue) => venue.venueId !== venueId));

      setEditingVenueId(null);
      setSelectedVenueId(null);
    } catch (error) {
      console.error("Error deleting venue:", error);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    void loadVendorVenues(currentUser.id);
  }, [currentUser]);

  const handleCreateVenue = async () => {
    if (!currentUser?.id) return;

    if (!validateVenueForm()) return;

    const newVenue: VenueData = {
      name: venueName.trim(),
      type: venueType.trim(),
      location: venueLocation.trim(),
      capacity: venueCapacity,
      recommendedSuitability: venueSuitability.join(", "),
    };

    try {
      const createdVenue = await venueApi.createVenue(
        currentUser.id,
        newVenue
      );

      setVenues((prev) => [...prev, createdVenue]);

      setVenueName("");
      setVenueType("");
      setVenueLocation("");
      setVenueCapacity(0);
      setVenueSuitability([]);
      setShowCreateKeywords(false);

      setVenueErrors({
        name: "",
        type: "",
        location: "",
        capacity: "",
        suitability: "",
      });
    } catch (error) {
      console.error("Error creating venue:", error);
    }
  };

  const handleApproveBooking = async (venueId: number, bookingId: number) => {
    try {
      await venueApi.updateBookingStatus(venueId, bookingId, "Approved");
      await loadVenueBookings(venueId);
    } catch (error) {
      console.error("Error approving booking:", error);
    }
  };

  const handleRejectBooking = async (venueId: number, bookingId: number) => {
    try {
      await venueApi.deleteBooking(venueId, bookingId);
      setSelectedBookingId(null);
      await loadVenueBookings(venueId);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  return (
    <div className="venue-editor-page">
      <Head>
        <title>Venue Editor</title>
      </Head>

      <Header />

      <main className="venue-editor-content">
        <div ref={ref} className={`fade-in ${isVisible ? "visible" : ""}`}>
          <section className="venue-editor-header">
            <p className="venue-editor-label">Vendor venue management</p>
            <h1>Manage your venues</h1>
            <p>
              Create venues, edit details, assign suitability keywords, and
              manage booking requests from hirers.
            </p>
          </section>

          <section className="response-field">
            <div className="venue-form">
              <h2>Create a new venue</h2>

              <input
                className="venue-name"
                type="text"
                placeholder="Venue Name"
                value={venueName}
                onChange={(e) => {
                  setVenueName(e.target.value);
                  setVenueErrors((prev) => ({ ...prev, name: "" }));
                }}
              />
              {venueErrors.name && (
                <p className="form-error">{venueErrors.name}</p>
              )}

              <input
                className="venue-type"
                type="text"
                placeholder="Venue Type"
                value={venueType}
                onChange={(e) => {
                  setVenueType(e.target.value);
                  setVenueErrors((prev) => ({ ...prev, type: "" }));
                }}
              />
              {venueErrors.type && (
                <p className="form-error">{venueErrors.type}</p>
              )}

              <input
                className="venue-location"
                type="text"
                placeholder="Venue Location"
                value={venueLocation}
                onChange={(e) => {
                  setVenueLocation(e.target.value);
                  setVenueErrors((prev) => ({ ...prev, location: "" }));
                }}
              />
              {venueErrors.location && (
                <p className="form-error">{venueErrors.location}</p>
              )}

              <input
                className="venue-capacity"
                type="number"
                placeholder="Venue Capacity"
                value={venueCapacity}
                onChange={(e) => {
                  setVenueCapacity(Number(e.target.value));
                  setVenueErrors((prev) => ({ ...prev, capacity: "" }));
                }}
              />
              {venueErrors.capacity && (
                <p className="form-error">{venueErrors.capacity}</p>
              )}

              <div className="keywords-box">
                <button
                  type="button"
                  className="keywords-dropdown-button"
                  onClick={() => setShowCreateKeywords((prev) => !prev)}
                >
                  {showCreateKeywords
                    ? "Hide suitability keywords"
                    : "Select suitability keywords"}
                </button>

                {venueSuitability.length > 0 && (
                  <div className="keyword-list">
                    {venueSuitability.map((keyword) => (
                      <span key={keyword} className="keyword-pill">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {showCreateKeywords && (
                  <div className="keyword-list">
                    {PREDEFINED_SUITABILITY_OPTIONS.map((option) => (
                      <label key={option} className="keyword-checkbox">
                        <input
                          type="checkbox"
                          checked={venueSuitability.includes(option)}
                          onChange={() => {
                            toggleKeyword(
                              option,
                              venueSuitability,
                              setVenueSuitability
                            );
                            setVenueErrors((prev) => ({
                              ...prev,
                              suitability: "",
                            }));
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {venueErrors.suitability && (
                <p className="form-error">{venueErrors.suitability}</p>
              )}

              <button
                onClick={handleCreateVenue}
                className="create-venue-button"
              >
                Create Venue
              </button>
            </div>
          </section>

          <section className="venue-list">
            <div className="venues">
              <h2>Existing venues</h2>
              <p className="venue-list-subtitle">
                Click a venue to view details, bookings, and management options.
              </p>

              {isPageLoading && <p>Loading venues...</p>}
              {pageError && <p>{pageError}</p>}

              {!isPageLoading && venues.length === 0 ? (
                <p>No venues found.</p>
              ) : (
                venues.map((venue) => (
                  <div
                    key={venue.venueId}
                    className="venue-card"
                    onClick={() => handleVenueClick(venue.venueId)}
                  >
                    {editingVenueId === venue.venueId ? (
                      <div
                        className="venue-edit-form"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />

                        <input
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                        />

                        <input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                        />

                        <input
                          type="number"
                          value={editCapacity}
                          onChange={(e) =>
                            setEditCapacity(Number(e.target.value))
                          }
                        />

                        <div className="keywords-box">
                          <p className="keywords-title">
                            Edit suitability keywords
                          </p>

                          <div className="keyword-list">
                            {PREDEFINED_SUITABILITY_OPTIONS.map((option) => (
                              <label key={option} className="keyword-checkbox">
                                <input
                                  type="checkbox"
                                  checked={editSuitability.includes(option)}
                                  onChange={() =>
                                    toggleKeyword(
                                      option,
                                      editSuitability,
                                      setEditSuitability
                                    )
                                  }
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          className="save-button"
                          onClick={() => handleSaveVenue(venue.venueId)}
                        >
                          Save
                        </button>

                        <button
                          className="cancel-button"
                          onClick={() => setEditingVenueId(null)}
                        >
                          Cancel
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDeleteVenue(venue.venueId)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3>{venue.venueName}</h3>

                        {selectedVenueId === venue.venueId && (
                          <div className="venue-details">
                            <p>Type: {venue.type}</p>
                            <p>Location: {venue.location}</p>
                            <p>Capacity: {venue.capacity}</p>

                            <div className="keywords-box">
                              <p className="keywords-title">Keywords</p>

                              {venue.recommendedSuitability ? (
                                <div className="keyword-list">
                                  {venue.recommendedSuitability
                                    .split(", ")
                                    .filter(Boolean)
                                    .map((keyword) => (
                                      <span
                                        key={keyword}
                                        className="keyword-pill"
                                      >
                                        {keyword}
                                      </span>
                                    ))}
                                </div>
                              ) : (
                                <p>No keywords set.</p>
                              )}
                            </div>

                            <button
                              className="edit-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVenue(venue);
                              }}
                            >
                              Edit
                            </button>

                            <h4>Bookings</h4>

                            {venueBookings[venue.venueId]?.length ? (
                              venueBookings[venue.venueId].map((booking) => (
                                <div
                                  key={booking.id}
                                  className="booking-card"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBookingId(
                                      selectedBookingId === booking.id
                                        ? null
                                        : booking.id
                                    );
                                  }}
                                >
                                  <h4>{booking.hirerName}</h4>

                                  {selectedBookingId === booking.id && (
                                    <div className="booking-details">
                                      <p>Event: {booking.eventName}</p>
                                      <p>Email: {booking.hirerEmail}</p>
                                      <p>Guests: {booking.expectedGuests}</p>
                                      <p>
                                        Start:{" "}
                                        {new Date(
                                          booking.bookingStart
                                        ).toLocaleString()}
                                      </p>
                                      <p>
                                        End:{" "}
                                        {new Date(
                                          booking.bookingEnd
                                        ).toLocaleString()}
                                      </p>
                                      <p>Status: {booking.status}</p>

                                      <div
                                        style={{
                                          display: "flex",
                                          gap: "10px",
                                          marginTop: "10px",
                                        }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveBooking(
                                              venue.venueId,
                                              booking.id
                                            );
                                          }}
                                          style={{
                                            backgroundColor: "#28a745",
                                            color: "white",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Accept
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRejectBooking(
                                              venue.venueId,
                                              booking.id
                                            );
                                          }}
                                          style={{
                                            backgroundColor: "#dc3545",
                                            color: "white",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p>No bookings for this venue.</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}