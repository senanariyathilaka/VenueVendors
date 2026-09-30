import { useEffect, useState } from "react";
import type { Venue } from "@/interfaces/Venue";
import { vendorApi } from "@/services/vendorApi";

interface SimpleCalendarProps {
  vendorVenues: Venue[];
  onVenueBlocked?: (updatedVenue: Venue) => void;
}

interface DateRange {
  venueId: number;
  venueName: string;
  start: number;
  end: number;
}

export default function SimpleCalendar({
  vendorVenues,
  onVenueBlocked,
}: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [blockedDates, setBlockedDates] = useState<DateRange[]>([]);
  const [calendarMessage, setCalendarMessage] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    if (vendorVenues.length > 0 && selectedVenueId === null) {
      setSelectedVenueId(vendorVenues[0].venueId);
    }
  }, [vendorVenues, selectedVenueId]);

  useEffect(() => {
    const ranges = vendorVenues
      .filter((venue) => venue.blockedDateFrom && venue.blockedDateTo)
      .map((venue) => ({
        venueId: venue.venueId,
        venueName: venue.venueName,
        start: new Date(venue.blockedDateFrom as string).getTime(),
        end: new Date(venue.blockedDateTo as string).getTime(),
      }));

    setBlockedDates(ranges);
  }, [vendorVenues]);

  const handleBlockedDates = async () => {
    if (!startDate || !endDate || selectedVenueId === null) {
      setCalendarMessage("Please choose a venue and both dates first.");
      return;
    }

    if (startDate > endDate) {
      setCalendarMessage("The start date cannot be after the end date.");
      return;
    }

    try {
      const updatedVenue = await vendorApi.blockVenueDates(
        selectedVenueId,
        startDate,
        endDate
      );

      const newRange: DateRange = {
        venueId: updatedVenue.venueId,
        venueName: updatedVenue.venueName,
        start: new Date(updatedVenue.blockedDateFrom as string).getTime(),
        end: new Date(updatedVenue.blockedDateTo as string).getTime(),
      };

      setBlockedDates((prev) => [
        ...prev.filter((item) => item.venueId !== selectedVenueId),
        newRange,
      ]);

      onVenueBlocked?.(updatedVenue);

      setStartDate(null);
      setEndDate(null);
      setCalendarMessage("Blocked dates saved successfully.");
    } catch (error) {
      setCalendarMessage(
        error instanceof Error ? error.message : "Unable to block venue dates."
      );
    }
  };

  const handleClick = (day: number) => {
    const selected = new Date(year, month, day);

    if (selected < today) return;

    if (!startDate || endDate) {
      setStartDate(selected);
      setEndDate(null);
      setCalendarMessage("");
      return;
    }

    if (selected < startDate) {
      setStartDate(selected);
    } else {
      setEndDate(selected);
    }

    setCalendarMessage("");
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;

    const date = new Date(year, month, day);
    return date >= startDate && date <= endDate;
  };

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    return date < today;
  };

  const days: (number | null)[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    days.push(i);
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Venue
        </label>

        <select
          value={selectedVenueId ?? ""}
          onChange={(event) => setSelectedVenueId(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
        >
          {vendorVenues.map((venue) => (
            <option key={venue.venueId} value={venue.venueId}>
              {venue.venueName}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          ←
        </button>

        <h2 className="text-lg font-bold text-slate-900">
          {currentDate.toLocaleString("default", { month: "long" })} {year}
        </h2>

        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-sm font-semibold text-slate-700">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={index} />;

          const date = new Date(year, month, day);

          const isStart =
            startDate && date.toDateString() === startDate.toDateString();

          const isEnd =
            endDate && date.toDateString() === endDate.toDateString();

          const inRange = isInRange(day);
          const past = isPast(day);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(day)}
              className={`h-10 rounded border text-sm font-semibold transition ${
                past
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "hover:bg-green-200"
              } ${inRange ? "bg-green-300" : "bg-white"} ${
                isStart || isEnd ? "bg-green-600 text-white" : "text-slate-800"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
        onClick={() => void handleBlockedDates()}
      >
        Confirm blocked dates
      </button>

      {calendarMessage && (
        <p className="mt-3 text-sm font-medium text-green-700">
          {calendarMessage}
        </p>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">
          Blocked venue periods
        </h2>

        {blockedDates.length === 0 ? (
          <p className="text-sm text-slate-500">No blocked periods yet.</p>
        ) : (
          <ul className="space-y-2">
            {blockedDates.map((item) => (
              <li key={item.venueId} className="rounded border p-3 text-sm">
                <strong>{item.venueName}</strong>
                <br />
                {new Date(item.start).toLocaleDateString()} →{" "}
                {new Date(item.end).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}