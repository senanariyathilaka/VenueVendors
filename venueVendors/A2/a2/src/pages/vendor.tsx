import Head from "next/head";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { useAuth } from "../Context/AuthContext";
import Calender from "@/Components/Calender";
import type { Venue } from "@/interfaces/Venue";
import { vendorApi, type VendorHirer } from "@/services/vendorApi";



interface BlockedVenueRange {
  venueId: number;
  venueName: string;
  start: number;
  end: number;
}

function renderStars(ratingValue: number) {
  const safeRating = Math.max(0, Math.min(5, ratingValue));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

export default function VendorPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  const [vendorVenues, setVendorVenues] = useState<Venue[]>([]);
  const [hirers, setHirers] = useState<VendorHirer[]>([]);
  const [selectedHirerId, setSelectedHirerId] = useState<number | null>(null);
  const [hirerComment, setHirerComment] = useState("");
  const [approved, setApproved] = useState<Record<number, boolean>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const approvedStorageKey = currentUser
    ? `vv_vendor_approved_${currentUser.id}`
    : "";

  const blockedVenueRanges = useMemo<BlockedVenueRange[]>(() => {
    return vendorVenues
      .filter((venue) => venue.blockedDateFrom && venue.blockedDateTo)
      .map((venue) => ({
        venueId: venue.venueId,
        venueName: venue.venueName,
        start: new Date(venue.blockedDateFrom as string).getTime(),
        end: new Date(venue.blockedDateTo as string).getTime(),
      }));
  }, [vendorVenues]);

  const sortedHirers = useMemo(() => {
    return [...hirers].sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return b.approvalCount - a.approvalCount;
    });
  }, [hirers]);

  const loadVendorDashboard = async (vendorId: number) => {
    setIsPageLoading(true);
    setPageError("");

    try {
      const [venuesResponse, hirersResponse] = await Promise.all([
        vendorApi.getVenues(vendorId),
        vendorApi.getHirers(),
      ]);

      setVendorVenues(venuesResponse);
      setHirers(hirersResponse);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load the vendor dashboard."
      );
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || isLoading) return;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "vendor") {
      router.replace("/hirer");
      return;
    }

    void loadVendorDashboard(currentUser.id);
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (!approvedStorageKey) return;

    const savedApproved = localStorage.getItem(approvedStorageKey);

    if (savedApproved) {
      setApproved(JSON.parse(savedApproved) as Record<number, boolean>);
    }
  }, [approvedStorageKey]);

  const handleVenueBlocked = (updatedVenue: Venue) => {
    setVendorVenues((prev) =>
      prev.map((venue) =>
        venue.venueId === updatedVenue.venueId ? updatedVenue : venue
      )
    );
  };

  const handleApproval = async (hirerId: number) => {
    if (!currentUser || approved[hirerId]) return;

    try {
      await vendorApi.approveHirer(hirerId);

      const updatedApproved = {
        ...approved,
        [hirerId]: true,
      };

      setApproved(updatedApproved);

      if (approvedStorageKey) {
        localStorage.setItem(
          approvedStorageKey,
          JSON.stringify(updatedApproved)
        );
      }

      await loadVendorDashboard(currentUser.id);
      setActionMessage("Hirer approved successfully.");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to approve hirer."
      );
    }
  };

  const handleCommentSubmit = async (
    event: FormEvent<HTMLFormElement>,
    hirerId: number
  ) => {
    event.preventDefault();

    if (!currentUser || !hirerComment.trim()) return;

    try {
      await vendorApi.addHirerComment(hirerId, hirerComment.trim());
      setHirerComment("");
      setSelectedHirerId(null);
      await loadVendorDashboard(currentUser.id);
      setActionMessage("Comment added successfully.");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to save comment."
      );
    }
  };

  if (isLoading || isPageLoading) {
    return (
      <>
        <Head>
          <title>Vendor Dashboard | Venue Guys</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-slate-50 px-6 py-12">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-700">
              Loading your vendor dashboard...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!currentUser || currentUser.role !== "vendor") {
    return null;
  }

  return (
    <div>
      <Head>
        <title>Vendor Dashboard | Venue Guys</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <section className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-lg">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Vendor dashboard
          </p>

          <h1 className="mb-4 text-4xl font-bold text-slate-900">
            Welcome {currentUser.name}
          </h1>

          {pageError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          )}

          {actionMessage && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {actionMessage}
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="mb-3 text-lg font-bold text-slate-900">
                Your venues
              </h2>

              {vendorVenues.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No venues linked to this vendor yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {vendorVenues.map((venue) => (
                    <li key={venue.venueId}>
                      <span className="font-semibold text-slate-900">
                        {venue.venueName}
                      </span>{" "}
                      - {venue.location}
                    </li>
                  ))}
                </ul>
              )}
                           
            </div>


            <button className="venueEditorButton"
              onClick={() => router.push("/venueEditor")}
            > Manage Your Venues Here!</button>

            <button className = "vendorAnalyticsButton"
              onClick={() => router.push("/vendorAnalytics")}
              >
              See Vendor Analytics!
            </button>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="mb-3 text-lg font-bold text-slate-900">
                Currently blocked venues
              </h2>

              {blockedVenueRanges.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No blocked venue periods saved yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {blockedVenueRanges.map((item) => (
                    <li key={`${item.venueId}-${item.start}`}>
                      <span className="font-semibold text-slate-900">
                        {item.venueName}
                      </span>{" "}
                      - {new Date(item.start).toLocaleDateString()} to{" "}
                      {new Date(item.end).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="mb-4 text-lg leading-8 text-slate-600">
            Select a time frame you wish for the venue to be inaccessible.
          </p>

          <Calender
            vendorVenues={vendorVenues}
            onVenueBlocked={handleVenueBlocked}
          />

          <p className="mt-8 mb-4 text-lg leading-8 text-slate-600">
            Select a hirer you would like to approve.
          </p>

          {sortedHirers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
              No hirers available yet.
            </div>
          ) : (
            <ul className="space-y-4">
              {sortedHirers.map((hirer) => (
                <li
                  key={hirer.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {hirer.name}
                      </h3>
                      <p className="text-sm text-slate-600">{hirer.email}</p>
                    </div>

                    <div className="text-right text-sm text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-900">
                          Approval count:
                        </span>{" "}
                        {hirer.approvalCount}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">
                          Reputation:
                        </span>{" "}
                        {renderStars(hirer.rating)} ({hirer.rating}/5)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Comments</p>
                    <p className="mt-1">
                      {hirer.comments?.trim()
                        ? hirer.comments
                        : "No comments have been added yet."}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHirerId(
                          selectedHirerId === hirer.id ? null : hirer.id
                        )
                      }
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {selectedHirerId === hirer.id
                        ? "Hide comment box"
                        : "Add comment"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleApproval(hirer.id)}
                      disabled={approved[hirer.id]}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {approved[hirer.id] ? "Approved" : "Approve"}
                    </button>
                  </div>

                  {selectedHirerId === hirer.id && (
                    <form
                      className="mt-4"
                      onSubmit={(event) =>
                        void handleCommentSubmit(event, hirer.id)
                      }
                    >
                      <textarea
                        className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 outline-none transition focus:border-slate-900"
                        placeholder="Enter comments about this hirer..."
                        value={hirerComment}
                        onChange={(event) => setHirerComment(event.target.value)}
                      />
                      <button
                        type="submit"
                        className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Submit comment
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}