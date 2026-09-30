import jsPDF from "jspdf";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  ActiveApplicantReport,
  assignVendorToVenue,
  createVenue,
  deleteVenue,
  getAdminDashboardData,
  PopularVenueReport,
  setFeaturedVenue,
  updateVenue,
  VendorItem,
  VenueFormInput,
  VenueItem,
} from "@/services/adminApi";

const EMPTY_VENUE_FORM: VenueFormInput = {
  name: "",
  type: "",
  location: "",
  capacity: 1,
  recommendedSuitability: "",
  vendorId: 1,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { adminUser, adminToken, isReady, logoutAdmin } = useAdminAuth();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [featuredVenues, setFeaturedVenues] = useState<VenueItem[]>([]);
  const [topPopularVenues, setTopPopularVenues] = useState<PopularVenueReport[]>([]);
  const [topActiveApplicants, setTopActiveApplicants] = useState<ActiveApplicantReport[]>([]);

  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [venueForm, setVenueForm] = useState<VenueFormInput>(EMPTY_VENUE_FORM);
  const [vendorSelections, setVendorSelections] = useState<Record<string, string>>({});

  const vendorOptions = useMemo(() => vendors, [vendors]);

  const loadDashboard = useCallback(async () => {
    if (!adminToken) return;

    try {
      setIsLoading(true);
      setPageError("");

      const data = await getAdminDashboardData(adminToken);

      setVendors(data.vendors);
      setVenues(data.venues);
      setFeaturedVenues(data.featuredVenues);
      setTopPopularVenues(data.topPopularVenues);
      setTopActiveApplicants(data.topActiveApplicants);

      const nextSelections: Record<string, string> = {};
      data.venues.forEach((venue) => {
        nextSelections[venue.id] = venue.vendorId !== null ? String(venue.vendorId) : "";
      });
      setVendorSelections(nextSelections);

      if (!venueForm.vendorId && data.vendors[0]) {
        setVenueForm((current) => ({
          ...current,
          vendorId: Number(data.vendors[0].id),
        }));
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load admin dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, venueForm.vendorId]);

  useEffect(() => {
    if (!isReady) return;

    if (!adminUser || !adminToken) {
      router.replace("/login");
      return;
    }

    void loadDashboard();
  }, [adminUser, adminToken, isReady, router, loadDashboard]);

  const resetVenueForm = () => {
    setEditingVenueId(null);
    setVenueForm({
      ...EMPTY_VENUE_FORM,
      vendorId: vendorOptions[0] ? Number(vendorOptions[0].id) : 1,
    });
  };

  const startEditVenue = (venue: VenueItem) => {
    setEditingVenueId(venue.id);
    setVenueForm({
      name: venue.name,
      type: venue.type,
      location: venue.location,
      capacity: venue.capacity,
      recommendedSuitability: venue.recommendedSuitability,
      vendorId: venue.vendorId ?? (vendorOptions[0] ? Number(vendorOptions[0].id) : 1),
    });
    setPageSuccess("");
    setPageError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVenueSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToken) return;

    if (
      !venueForm.name.trim() ||
      !venueForm.type.trim() ||
      !venueForm.location.trim() ||
      !venueForm.recommendedSuitability.trim() ||
      !venueForm.vendorId ||
      venueForm.capacity < 1
    ) {
      setPageError("Please complete all venue fields before saving.");
      setPageSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      setPageError("");
      setPageSuccess("");

      if (editingVenueId) {
        await updateVenue(adminToken, editingVenueId, venueForm);
        setPageSuccess("Venue updated successfully.");
      } else {
        await createVenue(adminToken, venueForm);
        setPageSuccess("Venue created successfully.");
      }

      resetVenueForm();
      await loadDashboard();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save venue.");
      setPageSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!adminToken) return;

    if (!window.confirm("Are you sure you want to delete this venue?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      setPageError("");
      setPageSuccess("");

      await deleteVenue(adminToken, venueId);
      if (editingVenueId === venueId) resetVenueForm();
      setPageSuccess("Venue deleted successfully.");
      await loadDashboard();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete venue.");
      setPageSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureToggle = async (venue: VenueItem) => {
    if (!adminToken) return;

    try {
      setIsSubmitting(true);
      setPageError("");
      setPageSuccess("");

      await setFeaturedVenue(adminToken, venue.id, !venue.isFeatured);
      setPageSuccess(!venue.isFeatured ? `${venue.name} is now featured.` : `${venue.name} is no longer featured.`);
      await loadDashboard();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update featured venue.");
      setPageSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignVendor = async (venueId: string) => {
    if (!adminToken) return;

    const selectedVendorId = vendorSelections[venueId];
    if (!selectedVendorId) {
      setPageError("Please choose a vendor before assigning.");
      setPageSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      setPageError("");
      setPageSuccess("");

      await assignVendorToVenue(adminToken, venueId, selectedVendorId);
      setPageSuccess("Vendor reassigned successfully.");
      await loadDashboard();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to reassign vendor.");
      setPageSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadReportPdf = () => {
    const pdf = new jsPDF();
    const marginLeft = 14;
    let y = 18;

    pdf.setFontSize(18);
    pdf.text("Venue Vendors Admin Report", marginLeft, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString("en-AU")}`, marginLeft, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.text(`Total vendors: ${vendors.length}`, marginLeft, y);
    y += 7;
    pdf.text(`Total venues: ${venues.length}`, marginLeft, y);
    y += 7;
    pdf.text(`Featured venues: ${featuredVenues.length}`, marginLeft, y);
    y += 12;

    pdf.setFontSize(14);
    pdf.text("Top 3 Popular Venues", marginLeft, y);
    y += 8;
    pdf.setFontSize(10);

    if (topPopularVenues.length === 0) {
      pdf.text("No popular venue report data available.", marginLeft, y);
      y += 8;
    } else {
      topPopularVenues.forEach((item, index) => {
        pdf.text(
          `${index + 1}. ${item.venueName} - ${item.bookingCount} bookings, ${item.mostPopularDay}, ${item.mostPopularTimeSlot}`,
          marginLeft,
          y
        );
        y += 7;
      });
    }

    y += 8;
    pdf.setFontSize(14);
    pdf.text("Top Active Applicants", marginLeft, y);
    y += 8;
    pdf.setFontSize(10);

    if (topActiveApplicants.length === 0) {
      pdf.text("No active applicant report data available.", marginLeft, y);
      y += 8;
    } else {
      topActiveApplicants.forEach((item, index) => {
        pdf.text(
          `${index + 1}. ${item.hirerName} - ${item.totalApplications} applications, ${item.successfulBookings} successful, ${item.successRate}% success rate`,
          marginLeft,
          y
        );
        y += 7;
      });
    }

    y += 8;
    pdf.setFontSize(14);
    pdf.text("Featured Venues", marginLeft, y);
    y += 8;
    pdf.setFontSize(10);

    if (featuredVenues.length === 0) {
      pdf.text("No featured venues selected.", marginLeft, y);
    } else {
      featuredVenues.forEach((venue) => {
        if (y > 280) {
          pdf.addPage();
          y = 18;
        }
        pdf.text(`${venue.name} (${venue.location}) - managed by ${venue.vendorName}`, marginLeft, y);
        y += 7;
      });
    }

    pdf.save("venue-vendors-admin-report.pdf");
  };

  if (!isReady) return null;

  return (
    <div className="page-shell">
      <div className="card" style={{ maxWidth: 1280, margin: "0 auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#2563eb", fontWeight: 800, fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" }}>Separate admin dashboard</p>
            <h1 style={{ marginTop: 8, marginBottom: 6, fontSize: 36, color: "#0f172a" }}>Welcome, {adminUser?.username}</h1>
            <p className="helper-text" style={{ margin: 0 }}>Manage venues, featured listings, vendor assignments, and admin reports.</p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="button-primary" onClick={downloadReportPdf}>Download report PDF</button>
            <button className="button-secondary" onClick={() => { logoutAdmin(); router.push("/login"); }}>Sign out</button>
          </div>
        </div>

        {pageError ? <div className="error-box" style={{ marginBottom: 20 }}>{pageError}</div> : null}
        {pageSuccess ? <div className="success-box" style={{ marginBottom: 20 }}>{pageSuccess}</div> : null}
        {isLoading ? <div className="success-box" style={{ marginBottom: 20 }}>Loading admin dashboard...</div> : null}

        <div className="grid-three" style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 20, background: "#eff6ff" }}><p className="helper-text" style={{ marginTop: 0 }}>Vendors</p><h2 style={{ margin: 0, fontSize: 34 }}>{vendors.length}</h2></div>
          <div className="card" style={{ padding: 20, background: "#ecfeff" }}><p className="helper-text" style={{ marginTop: 0 }}>Venues</p><h2 style={{ margin: 0, fontSize: 34 }}>{venues.length}</h2></div>
          <div className="card" style={{ padding: 20, background: "#f0fdf4" }}><p className="helper-text" style={{ marginTop: 0 }}>Featured venues</p><h2 style={{ margin: 0, fontSize: 34 }}>{featuredVenues.length}</h2></div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>{editingVenueId ? "Edit venue" : "Create a new venue"}</h2>
              <p className="helper-text" style={{ margin: 0 }}>This covers admin venue CRUD for the HD admin dashboard.</p>
            </div>
            {editingVenueId ? <button type="button" className="button-secondary" onClick={resetVenueForm}>Cancel edit</button> : null}
          </div>

          <form onSubmit={handleVenueSubmit}>
            <div className="grid-two" style={{ marginBottom: 16 }}>
              <div><label className="label">Venue name</label><input className="input" value={venueForm.name} onChange={(event) => setVenueForm((current) => ({ ...current, name: event.target.value }))} placeholder="Enter venue name" /></div>
              <div><label className="label">Venue type</label><input className="input" value={venueForm.type} onChange={(event) => setVenueForm((current) => ({ ...current, type: event.target.value }))} placeholder="e.g. Wedding, Corporate" /></div>
              <div><label className="label">Location</label><input className="input" value={venueForm.location} onChange={(event) => setVenueForm((current) => ({ ...current, location: event.target.value }))} placeholder="Enter location" /></div>
              <div><label className="label">Capacity</label><input className="input" type="number" min={1} value={venueForm.capacity} onChange={(event) => setVenueForm((current) => ({ ...current, capacity: Number(event.target.value) }))} /></div>
              <div><label className="label">Vendor</label><select className="select" value={venueForm.vendorId} onChange={(event) => setVenueForm((current) => ({ ...current, vendorId: Number(event.target.value) }))}>{vendorOptions.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>
              <div><label className="label">Recommended suitability</label><input className="input" value={venueForm.recommendedSuitability} onChange={(event) => setVenueForm((current) => ({ ...current, recommendedSuitability: event.target.value }))} placeholder="Wedding, Birthday, Corporate" /></div>
            </div>
            <button className="button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editingVenueId ? "Update venue" : "Create venue"}</button>
          </form>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>All venues</h2>
          {venues.length === 0 ? <p className="helper-text">No venues available.</p> : (
            <div style={{ display: "grid", gap: 12 }}>
              {venues.map((venue) => (
                <div key={venue.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                    <div><strong>{venue.name}</strong><p className="helper-text" style={{ margin: "6px 0" }}>{venue.location} · {venue.type}</p></div>
                    <div style={{ background: venue.isFeatured ? "#dcfce7" : "#f1f5f9", color: venue.isFeatured ? "#166534" : "#334155", borderRadius: 999, padding: "8px 12px", fontWeight: 700, height: "fit-content" }}>{venue.isFeatured ? "Featured" : "Not featured"}</div>
                  </div>
                  <p style={{ marginBottom: 6 }}>Capacity: {venue.capacity}</p>
                  <p style={{ marginBottom: 6 }}>Recommended suitability: {venue.recommendedSuitability}</p>
                  <p style={{ marginBottom: 14 }}>Managed by: {venue.vendorName}</p>

                  <div className="grid-two" style={{ alignItems: "end", marginBottom: 12 }}>
                    <div><label className="label">Assign vendor</label><select className="select" value={vendorSelections[venue.id] ?? ""} onChange={(event) => setVendorSelections((current) => ({ ...current, [venue.id]: event.target.value }))}><option value="">Select a vendor</option>{vendorOptions.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>
                    <button type="button" className="button-secondary" onClick={() => handleAssignVendor(venue.id)} disabled={isSubmitting}>Reassign vendor</button>
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button type="button" className="button-secondary" onClick={() => startEditVenue(venue)}>Edit venue</button>
                    <button type="button" className="button-secondary" onClick={() => handleFeatureToggle(venue)} disabled={isSubmitting}>{venue.isFeatured ? "Unfeature venue" : "Feature venue"}</button>
                    <button type="button" className="button-secondary" onClick={() => handleDeleteVenue(venue.id)} disabled={isSubmitting}>Delete venue</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid-two" style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Featured venues</h2>
            {featuredVenues.length === 0 ? <p className="helper-text">No featured venues selected yet.</p> : (
              <div style={{ display: "grid", gap: 12 }}>{featuredVenues.map((venue) => <div key={venue.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}><strong>{venue.name}</strong><p className="helper-text" style={{ margin: "6px 0" }}>{venue.location} · {venue.type}</p><p>Managed by: {venue.vendorName}</p></div>)}</div>
            )}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>All vendors</h2>
            {vendors.length === 0 ? <p className="helper-text">No vendors available.</p> : (
              <div style={{ display: "grid", gap: 12 }}>{vendors.map((vendor) => <div key={vendor.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}><strong>{vendor.name}</strong><p className="helper-text" style={{ margin: "6px 0" }}>{vendor.email}</p><p style={{ margin: 0 }}>Current venue label: {vendor.venue || "None"}</p></div>)}</div>
            )}
          </div>
        </div>

        <div className="grid-two">
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Top 3 popular venues</h2>
            {topPopularVenues.length === 0 ? <p className="helper-text">No venue report data available.</p> : (
              <div style={{ display: "grid", gap: 12 }}>{topPopularVenues.map((item) => <div key={item.venueId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}><strong>{item.venueName}</strong><p>Bookings: {item.bookingCount}</p><p>Most popular day: {item.mostPopularDay}</p><p>Most popular time slot: {item.mostPopularTimeSlot}</p></div>)}</div>
            )}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Top active applicants</h2>
            {topActiveApplicants.length === 0 ? <p className="helper-text">No applicant report data available.</p> : (
              <div style={{ display: "grid", gap: 12 }}>{topActiveApplicants.map((item) => <div key={item.hirerId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}><strong>{item.hirerName}</strong><p>Applications: {item.totalApplications}</p><p>Successful bookings: {item.successfulBookings}</p><p>Success rate: {item.successRate}%</p></div>)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
