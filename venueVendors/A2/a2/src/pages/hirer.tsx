import Head from "next/head";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import { useRouter } from "next/router";
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { useAuth } from "../Context/AuthContext";
import {
  createHirerApplication,
  fetchHirerApplications,
  fetchHirerHistory,
  fetchHirerPreferences,
  fetchHirerProfile,
  fetchVenues,
  saveHirerPreferences,
  updateHirerProfile,
  type HiringHistoryItemApi,
  type SavedApplicationApi,
  type VenueApi,
} from "@/services/hirerService";

interface HirerProfileState {
  name: string;
  phone: string;
  email: string;
  dateJoined: string;
}

interface ProfileErrors {
  name?: string;
  phone?: string;
}

interface ApplicationFormState {
  venueId: string;
  eventName: string;
  expectedGuests: string;
  eventDate: string;
  eventTime: string;
  durationHours: string;
}

interface ApplicationErrors {
  venueId?: string;
  eventName?: string;
  expectedGuests?: string;
  eventDate?: string;
  eventTime?: string;
  durationHours?: string;
}

interface StoredDocument {
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  uploadedAt: string;
}

interface CredibilityDocumentsState {
  isBusinessApplicant: boolean;
  abn: string;
  driversLicense: StoredDocument | null;
  insuranceCertificate: StoredDocument | null;
  businessRegistration: StoredDocument | null;
}

interface DocumentErrors {
  driversLicense?: string;
  insuranceCertificate?: string;
  businessRegistration?: string;
  abn?: string;
}

type DocumentFieldKey =
  | "driversLicense"
  | "insuranceCertificate"
  | "businessRegistration";

const NAME_REGEX = /^[A-Za-z\s'-]{2,}$/;
const PHONE_REGEX = /^[\d\s()+-]{8,20}$/;
const ABN_REGEX = /^\d{11}$/;

const getDocumentsKey = (email: string) => `vv_hirer_documents_${email}`;

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, rating));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

function formatBlockedDate(dateValue: string | null) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBlockedPeriodText(venue: VenueApi) {
  if (!venue.blockedDateFrom || !venue.blockedDateTo) {
    return "";
  }

  return `${formatBlockedDate(venue.blockedDateFrom)} to ${formatBlockedDate(
    venue.blockedDateTo
  )}`;
}

function doesBookingOverlapBlockedPeriod(
  venue: VenueApi,
  bookingStart: Date,
  durationHours: number
) {
  if (!venue.blockedDateFrom || !venue.blockedDateTo) {
    return false;
  }

  const bookingEnd = new Date(
    bookingStart.getTime() + durationHours * 60 * 60 * 1000
  );
  const blockedStart = new Date(venue.blockedDateFrom);
  blockedStart.setHours(0, 0, 0, 0);

  const blockedEnd = new Date(venue.blockedDateTo);
  blockedEnd.setHours(23, 59, 59, 999);

  return bookingStart <= blockedEnd && bookingEnd >= blockedStart;
}

function hasAllowedExtension(fileName: string, extensions: string[]) {
  const lowerName = fileName.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension));
}

function isCompliantJpgDocument(document: StoredDocument | null) {
  if (!document || document.fileSize <= 0) return false;

  return (
    document.fileType === "image/jpeg" ||
    hasAllowedExtension(document.fileName, [".jpg", ".jpeg"])
  );
}

function isCompliantPdfDocument(document: StoredDocument | null) {
  if (!document || document.fileSize <= 0) return false;

  return (
    document.fileType === "application/pdf" ||
    hasAllowedExtension(document.fileName, [".pdf"])
  );
}

function calculateCredibilityScore(documents: CredibilityDocumentsState) {
  const hasLicense = isCompliantJpgDocument(documents.driversLicense);
  const hasInsurance = isCompliantPdfDocument(documents.insuranceCertificate);
  const hasValidBusinessRegistration = isCompliantPdfDocument(
    documents.businessRegistration
  );
  const hasValidAbn = ABN_REGEX.test(documents.abn.replace(/\s/g, ""));

  if (!hasLicense) {
    return 0;
  }

  let validEvidenceCount = 0;
  let requiredEvidenceCount = 2;

  if (hasLicense) validEvidenceCount += 1;
  if (hasInsurance) validEvidenceCount += 1;

  if (documents.isBusinessApplicant) {
    requiredEvidenceCount = 3;

    if (hasValidBusinessRegistration && hasValidAbn) {
      validEvidenceCount += 1;
    }
  }

  return Math.max(
    0,
    Math.min(5, Math.round((validEvidenceCount / requiredEvidenceCount) * 5))
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

function getSelectedFileValidationMessage(
  file: File,
  expectedType: "jpg" | "pdf"
) {
  if (file.size <= 0) {
    return "The selected file is empty. Please choose a valid file.";
  }

  if (expectedType === "jpg") {
    const isValidImage =
      file.type === "image/jpeg" ||
      hasAllowedExtension(file.name, [".jpg", ".jpeg"]);

    if (!isValidImage) {
      return "Please upload the driver's license as a JPG file.";
    }
  }

  if (expectedType === "pdf") {
    const isValidPdf =
      file.type === "application/pdf" ||
      hasAllowedExtension(file.name, [".pdf"]);

    if (!isValidPdf) {
      return "Please upload this document as a PDF file.";
    }
  }

  return "";
}

interface DocumentUploadFieldProps {
  label: string;
  accept: string;
  selectedDocument: StoredDocument | null;
  error?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function DocumentUploadField({
  label,
  accept,
  selectedDocument,
  error,
  inputRef,
  onFileChange,
  onRemove,
}: DocumentUploadFieldProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-3 text-sm font-semibold text-slate-800">{label}</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
        >
          Choose file
        </button>

        <span className="max-w-full break-all text-sm text-slate-600">
          {selectedDocument ? selectedDocument.fileName : "No file chosen"}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {selectedDocument && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-900">
            {selectedDocument.fileName}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {(selectedDocument.fileSize / 1024).toFixed(1)} KB
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={selectedDocument.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open file
            </a>

            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HirerPage() {
  const router = useRouter();
  const { currentUser, isLoading, refreshProfile } = useAuth();


  const driversLicenseInputRef = useRef<HTMLInputElement | null>(null);
  const insuranceCertificateInputRef = useRef<HTMLInputElement | null>(null);
  const businessRegistrationInputRef = useRef<HTMLInputElement | null>(null);

  const [pageError, setPageError] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [profile, setProfile] = useState<HirerProfileState>({
    name: "",
    phone: "",
    email: "",
    dateJoined: "",
  });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [allVenues, setAllVenues] = useState<VenueApi[]>([]);
  const [visibleVenues, setVisibleVenues] = useState<VenueApi[]>([]);
  const [isVenueLoading, setIsVenueLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCapacity, setSearchCapacity] = useState("");
  const [searchSuitability, setSearchSuitability] = useState("");

  const [preferredVenueIds, setPreferredVenueIds] = useState<number[]>([]);
  const [preferredMessage, setPreferredMessage] = useState("");
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>({
    venueId: "",
    eventName: "",
    expectedGuests: "",
    eventDate: "",
    eventTime: "",
    durationHours: "",
  });
  const [applicationErrors, setApplicationErrors] = useState<ApplicationErrors>(
    {}
  );
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applications, setApplications] = useState<SavedApplicationApi[]>([]);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  const [history, setHistory] = useState<HiringHistoryItemApi[]>([]);

  const [documents, setDocuments] = useState<CredibilityDocumentsState>({
    isBusinessApplicant: false,
    abn: "",
    driversLicense: null,
    insuranceCertificate: null,
    businessRegistration: null,
  });
  const [documentErrors, setDocumentErrors] = useState<DocumentErrors>({});
  const [documentMessage, setDocumentMessage] = useState("");

  const documentsStorageKey = currentUser
    ? getDocumentsKey(currentUser.email)
    : "";

  const credibilityScore = useMemo(() => {
    return calculateCredibilityScore(documents);
  }, [documents]);

  const averageRating = useMemo(() => {
    if (history.length === 0) return 0;

    const total = history.reduce((sum, item) => sum + item.rating, 0);
    return Number((total / history.length).toFixed(1));
  }, [history]);

  const preferredVenues = useMemo(() => {
    const venueMap = new Map(allVenues.map((venue) => [venue.id, venue]));

    return preferredVenueIds
      .map((venueId) => venueMap.get(venueId))
      .filter((venue): venue is VenueApi => Boolean(venue));
  }, [allVenues, preferredVenueIds]);

  const featuredVenues = useMemo(() => {
    return allVenues.filter((venue) => venue.isFeatured);
  }, [allVenues]);

  const getDocumentInputRef = (field: DocumentFieldKey) => {
    if (field === "driversLicense") return driversLicenseInputRef;
    if (field === "insuranceCertificate") return insuranceCertificateInputRef;
    return businessRegistrationInputRef;
  };

  const resetDocumentInput = (field: DocumentFieldKey) => {
    const inputRef = getDocumentInputRef(field);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const loadDashboardData = async () => {
    if (!currentUser || currentUser.role !== "hirer") return;

    setIsPageLoading(true);
    setPageError("");

    try {
      const [
        fetchedProfile,
        fetchedVenues,
        fetchedPreferences,
        fetchedApplications,
        fetchedHistory,
      ] = await Promise.all([
        fetchHirerProfile(currentUser.id),
        fetchVenues(),
        fetchHirerPreferences(currentUser.id),
        fetchHirerApplications(currentUser.id),
        fetchHirerHistory(currentUser.id),
      ]);

      setProfile({
        name: fetchedProfile.name,
        phone: fetchedProfile.phone || "",
        email: fetchedProfile.email,
        dateJoined: fetchedProfile.dateJoined
          ? new Date(fetchedProfile.dateJoined).toLocaleDateString()
          : "",
      });

      setAllVenues(fetchedVenues);
      setVisibleVenues(fetchedVenues);
      setPreferredVenueIds(fetchedPreferences.map((item) => item.venueId));
      setApplications(fetchedApplications);
      setHistory(fetchedHistory);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load the hirer dashboard."
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

    if (currentUser.role !== "hirer") {
      router.replace("/vendor");
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "hirer") return;

    void loadDashboardData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "hirer" || !documentsStorageKey) {
      return;
    }

    const storedDocuments = localStorage.getItem(documentsStorageKey);

    if (storedDocuments) {
      try {
        setDocuments(
          JSON.parse(storedDocuments) as CredibilityDocumentsState
        );
      } catch {
        localStorage.removeItem(documentsStorageKey);
      }
    }
  }, [currentUser, documentsStorageKey]);

  useEffect(() => {
    if (
      preferredVenues.length > 0 &&
      !preferredVenues.some(
        (venue) => String(venue.id) === applicationForm.venueId
      )
    ) {
      setApplicationForm((prev) => ({
        ...prev,
        venueId: String(preferredVenues[0].id),
      }));
    }

    if (preferredVenues.length === 0 && applicationForm.venueId) {
      setApplicationForm((prev) => ({
        ...prev,
        venueId: "",
      }));
    }
  }, [preferredVenues, applicationForm.venueId]);

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setProfileErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    setProfileMessage("");
  };

  const validateProfile = () => {
    const errors: ProfileErrors = {};

    if (!profile.name.trim()) {
      errors.name = "Please enter your name.";
    } else if (!NAME_REGEX.test(profile.name.trim())) {
      errors.name = "Enter a valid name.";
    }

    if (profile.phone.trim() && !PHONE_REGEX.test(profile.phone.trim())) {
      errors.phone = "Enter a valid phone number.";
    }

    return errors;
  };

  const handleProfileSave = async () => {
    if (!currentUser || currentUser.role !== "hirer") return;

    const validationErrors = validateProfile();

    if (Object.keys(validationErrors).length > 0) {
      setProfileErrors(validationErrors);
      setProfileMessage("");
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await updateHirerProfile(currentUser.id, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      });

      const updatedProfile = response.profile;

      setProfile({
        name: updatedProfile.name,
        phone: updatedProfile.phone || "",
        email: updatedProfile.email,
        dateJoined: updatedProfile.dateJoined
          ? new Date(updatedProfile.dateJoined).toLocaleDateString()
          : profile.dateJoined,
      });

      await refreshProfile("hirer", currentUser.id);
      setProfileErrors({});
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage("");
      setProfileErrors({
        phone:
          error instanceof Error
            ? error.message
            : "Unable to update profile.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsVenueLoading(true);
    setPreferredMessage("");

    try {
      const filteredVenues = await fetchVenues({
        name: searchName,
        location: searchLocation,
        suitability: searchSuitability,
        capacity: searchCapacity,
      });

      setVisibleVenues(filteredVenues);
    } catch (error) {
      setPreferredMessage(
        error instanceof Error ? error.message : "Unable to search venues."
      );
    } finally {
      setIsVenueLoading(false);
    }
  };

  const handleSearchReset = async () => {
    setSearchName("");
    setSearchLocation("");
    setSearchCapacity("");
    setSearchSuitability("");
    setPreferredMessage("");
    setIsVenueLoading(true);

    try {
      const fetchedVenues = await fetchVenues();
      setAllVenues(fetchedVenues);
      setVisibleVenues(fetchedVenues);
    } catch (error) {
      setPreferredMessage(
        error instanceof Error ? error.message : "Unable to reset venues."
      );
    } finally {
      setIsVenueLoading(false);
    }
  };

  const togglePreferredVenue = (venueId: number) => {
    const updatedPreferred = preferredVenueIds.includes(venueId)
      ? preferredVenueIds.filter((id) => id !== venueId)
      : [...preferredVenueIds, venueId];

    setPreferredVenueIds(updatedPreferred);
    setPreferredMessage(
      preferredVenueIds.includes(venueId)
        ? "Venue removed from your preferred list. Save the ranking to keep the change."
        : "Venue added to your preferred list. Save the ranking to keep the change."
    );
  };

  const movePreferredVenue = (index: number, direction: "up" | "down") => {
    const updated = [...preferredVenueIds];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= updated.length) return;

    [updated[index], updated[targetIndex]] = [
      updated[targetIndex],
      updated[index],
    ];

    setPreferredVenueIds(updated);
    setPreferredMessage("Preference order updated. Save the ranking to keep it.");
  };

  const handleSavePreferences = async () => {
    if (!currentUser || currentUser.role !== "hirer") return;

    setIsSavingPreferences(true);

    try {
      await saveHirerPreferences(currentUser.id, preferredVenueIds);
      setPreferredMessage("Preferred venue ranking saved successfully.");
    } catch (error) {
      setPreferredMessage(
        error instanceof Error
          ? error.message
          : "Unable to save preferred venues."
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleApplicationChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setApplicationForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setApplicationErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    setApplicationMessage("");
  };

  const validateApplication = () => {
    const errors: ApplicationErrors = {};
    const selectedVenue = allVenues.find(
      (venue) => String(venue.id) === applicationForm.venueId
    );
    const guests = Number(applicationForm.expectedGuests);
    const duration = Number(applicationForm.durationHours);

    if (!applicationForm.venueId) {
      errors.venueId = "Select a preferred venue first.";
    }

    if (!applicationForm.eventName.trim()) {
      errors.eventName = "Please enter an event name.";
    } else if (applicationForm.eventName.trim().length < 3) {
      errors.eventName = "Event name must be at least 3 characters.";
    }

    if (!applicationForm.expectedGuests) {
      errors.expectedGuests = "Please enter the expected number of guests.";
    } else if (!Number.isInteger(guests) || guests <= 0) {
      errors.expectedGuests = "Enter a valid guest number.";
    } else if (selectedVenue && guests > selectedVenue.capacity) {
      errors.expectedGuests =
        "Expected guests cannot exceed the selected venue capacity.";
    }

    if (!applicationForm.eventDate) {
      errors.eventDate = "Please select a date.";
    }

    if (!applicationForm.eventTime) {
      errors.eventTime = "Please select a time.";
    }

    if (!applicationForm.durationHours) {
      errors.durationHours = "Please enter the duration.";
    } else if (Number.isNaN(duration) || duration <= 0) {
      errors.durationHours = "Enter a valid duration in hours.";
    }

    if (applicationForm.eventDate && applicationForm.eventTime) {
      const selectedDateTime = new Date(
        `${applicationForm.eventDate}T${applicationForm.eventTime}`
      );
      const now = new Date();

      if (selectedDateTime < now) {
        errors.eventDate = "Please choose a future date and time.";
      }

      if (
        selectedVenue &&
        !Number.isNaN(duration) &&
        duration > 0 &&
        doesBookingOverlapBlockedPeriod(selectedVenue, selectedDateTime, duration)
      ) {
        errors.eventDate = `This venue is blocked from ${getBlockedPeriodText(
          selectedVenue
        )}. Please choose another date or venue.`;
      }
    }

    return errors;
  };

  const handleApplicationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "hirer") return;

    const validationErrors = validateApplication();

    if (Object.keys(validationErrors).length > 0) {
      setApplicationErrors(validationErrors);
      setApplicationMessage("");
      return;
    }

    setIsSubmittingApplication(true);

    try {
      const response = await createHirerApplication(currentUser.id, {
        venueId: Number(applicationForm.venueId),
        eventName: applicationForm.eventName.trim(),
        expectedGuests: Number(applicationForm.expectedGuests),
        eventDate: applicationForm.eventDate,
        eventTime: applicationForm.eventTime,
        durationHours: Number(applicationForm.durationHours),
      });

      setApplications((prev) => [response.application, ...prev]);
      setApplicationErrors({});
      setApplicationMessage("Application submitted successfully.");

      setApplicationForm({
        venueId: preferredVenueIds[0] ? String(preferredVenueIds[0]) : "",
        eventName: "",
        expectedGuests: "",
        eventDate: "",
        eventTime: "",
        durationHours: "",
      });
    } catch (error) {
      setApplicationMessage("");
      setApplicationErrors({
        venueId:
          error instanceof Error
            ? error.message
            : "Unable to submit application.",
      });
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleDocumentToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;

    if (!checked) {
      resetDocumentInput("businessRegistration");
    }

    setDocuments((prev) => ({
      ...prev,
      isBusinessApplicant: checked,
      abn: checked ? prev.abn : "",
      businessRegistration: checked ? prev.businessRegistration : null,
    }));

    setDocumentErrors((prev) => ({
      ...prev,
      abn: undefined,
      businessRegistration: undefined,
    }));

    setDocumentMessage("");
  };

  const handleAbnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDocuments((prev) => ({
      ...prev,
      abn: event.target.value,
    }));

    setDocumentErrors((prev) => ({
      ...prev,
      abn: undefined,
    }));
  };

  const handleDocumentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field: DocumentFieldKey,
    expectedType: "jpg" | "pdf"
  ) => {
    const inputElement = event.target;
    const file = inputElement.files?.[0];

    if (!file) return;

    const validationMessage = getSelectedFileValidationMessage(
      file,
      expectedType
    );

    if (validationMessage) {
      setDocumentErrors((prev) => ({
        ...prev,
        [field]: validationMessage,
      }));
      setDocumentMessage("");
      inputElement.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      const savedDocument: StoredDocument = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      setDocuments((prev) => ({
        ...prev,
        [field]: savedDocument,
      }));

      setDocumentErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));

      setDocumentMessage("");
    } catch {
      setDocumentErrors((prev) => ({
        ...prev,
        [field]: "The selected file could not be read.",
      }));
    } finally {
      inputElement.value = "";
    }
  };

  const removeStoredDocument = (field: DocumentFieldKey) => {
    setDocuments((prev) => ({
      ...prev,
      [field]: null,
    }));

    resetDocumentInput(field);

    setDocumentErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));

    setDocumentMessage("");
  };

  const validateDocumentsBeforeSave = () => {
    const errors: DocumentErrors = {};

    if (
      documents.driversLicense &&
      !isCompliantJpgDocument(documents.driversLicense)
    ) {
      errors.driversLicense =
        "Driver's license must be a non-empty JPG document.";
    }

    if (
      documents.insuranceCertificate &&
      !isCompliantPdfDocument(documents.insuranceCertificate)
    ) {
      errors.insuranceCertificate =
        "Insurance certificate must be a non-empty PDF document.";
    }

    if (documents.isBusinessApplicant) {
      const cleanedAbn = documents.abn.replace(/\s/g, "");

      if (!cleanedAbn) {
        errors.abn = "Please enter the ABN number.";
      } else if (!ABN_REGEX.test(cleanedAbn)) {
        errors.abn = "Enter a valid 11-digit ABN.";
      }

      if (!isCompliantPdfDocument(documents.businessRegistration)) {
        errors.businessRegistration =
          "Upload the business registration certificate as a non-empty PDF.";
      }
    }

    return errors;
  };

  const handleDocumentSave = () => {
    if (!currentUser || !documentsStorageKey) return;

    const validationErrors = validateDocumentsBeforeSave();

    if (Object.keys(validationErrors).length > 0) {
      setDocumentErrors(validationErrors);
      setDocumentMessage("");
      return;
    }

    localStorage.setItem(documentsStorageKey, JSON.stringify(documents));
    setDocumentErrors({});
    setDocumentMessage(
      `Documents saved successfully. Current credibility score: ${credibilityScore}/5 stars.`
    );
  };

  if (isLoading || isPageLoading) {
    return (
      <>
        <Head>
          <title>Hirer Dashboard | Venue Guys</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-slate-50 px-6 py-12">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-700">
              Loading your hirer dashboard...
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!currentUser || currentUser.role !== "hirer") {
    return null;
  }

  return (
    <>
      <Head>
        <title>Hirer Dashboard | Venue Guys</title>
        <meta
          name="description"
          content="Hirer dashboard for profile, venue search, rankings, applications, reputation, and credibility documents"
        />
      </Head>

      <Header />

      <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-7xl">

          <section className="mb-8 rounded-2xl bg-white p-6 shadow-lg md:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Hirer dashboard
            </p>

            <h1 className="text-4xl font-bold text-slate-900">
              Welcome, {profile.name || currentUser.name}
            </h1>

            {pageError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            )}
          </section>

          <section className="mb-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">
                Your profile
              </h2>

              {profileMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {profileMessage}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="hirer-name"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Name
                  </label>
                  <input
                    id="hirer-name"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  {profileErrors.name && (
                    <p className="mt-2 text-sm text-red-600">
                      {profileErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="hirer-phone"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Phone number
                  </label>
                  <input
                    id="hirer-phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  {profileErrors.phone && (
                    <p className="mt-2 text-sm text-red-600">
                      {profileErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="hirer-email"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>
                  <input
                    id="hirer-email"
                    value={profile.email}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hirer-date-joined"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Date joined
                  </label>
                  <input
                    id="hirer-date-joined"
                    value={profile.dateJoined || "Not available"}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Password is hidden for security and is not shown on the
                dashboard.
              </p>

              <button
                type="button"
                onClick={() => void handleProfileSave()}
                disabled={isSavingProfile}
                className="mt-6 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSavingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Hiring reputation</h2>

              <div className="mb-6 rounded-xl bg-slate-800 p-5">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Average rating
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {history.length > 0 ? averageRating : "No rating"}
                </p>
                <p className="mt-2 text-sm text-yellow-300">
                  {history.length > 0
                    ? renderStars(Math.round(averageRating))
                    : ""}
                </p>
              </div>

              <p className="text-sm text-slate-300">
                Your rating is based on the historical list of venues you have
                hired and the scores given by previous vendors.
              </p>
            </div>
          </section>

          <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-slate-900">
                  Credibility documents
                </h2>
                <p className="mt-3 text-slate-600">
                  Upload compliant supporting documents to strengthen your
                  credibility. Driver&apos;s license must be JPG. Insurance and
                  business registration documents must be PDF.
                </p>
              </div>

              <div className="w-full max-w-[250px] rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Credibility score
                </p>
                <p className="mt-2 text-4xl font-bold">{credibilityScore}/5</p>
                <p className="mt-2 text-lg text-amber-300">
                  {renderStars(credibilityScore)}
                </p>
              </div>
            </div>

            {documentMessage && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {documentMessage}
              </div>
            )}

            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={documents.isBusinessApplicant}
                  onChange={handleDocumentToggle}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-semibold text-slate-900">
                    I am applying on behalf of a business or organisation
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    If selected, enter the ABN and upload the business name
                    registration certificate.
                  </span>
                </span>
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <DocumentUploadField
                label="Driver's license (JPG)"
                accept=".jpg,.jpeg,image/jpeg"
                selectedDocument={documents.driversLicense}
                error={documentErrors.driversLicense}
                inputRef={driversLicenseInputRef}
                onFileChange={(event) =>
                  void handleDocumentUpload(event, "driversLicense", "jpg")
                }
                onRemove={() => removeStoredDocument("driversLicense")}
              />

              <DocumentUploadField
                label="Public liability insurance certificate (PDF)"
                accept=".pdf,application/pdf"
                selectedDocument={documents.insuranceCertificate}
                error={documentErrors.insuranceCertificate}
                inputRef={insuranceCertificateInputRef}
                onFileChange={(event) =>
                  void handleDocumentUpload(
                    event,
                    "insuranceCertificate",
                    "pdf"
                  )
                }
                onRemove={() => removeStoredDocument("insuranceCertificate")}
              />
            </div>

            {documents.isBusinessApplicant && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      ABN number
                    </label>
                    <input
                      value={documents.abn}
                      onChange={handleAbnChange}
                      placeholder="Enter 11-digit ABN"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    />
                    {documentErrors.abn && (
                      <p className="mt-2 text-sm text-red-600">
                        {documentErrors.abn}
                      </p>
                    )}
                  </div>

                  <DocumentUploadField
                    label="Business name registration certificate (PDF)"
                    accept=".pdf,application/pdf"
                    selectedDocument={documents.businessRegistration}
                    error={documentErrors.businessRegistration}
                    inputRef={businessRegistrationInputRef}
                    onFileChange={(event) =>
                      void handleDocumentUpload(
                        event,
                        "businessRegistration",
                        "pdf"
                      )
                    }
                    onRemove={() =>
                      removeStoredDocument("businessRegistration")
                    }
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleDocumentSave}
                className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Save documents
              </button>

              <p className="text-sm text-slate-600">
                No valid driver&apos;s license means the score stays at 0 stars.
              </p>
            </div>
          </section>


          <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Admin selected
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Featured venues
              </h2>
              <p className="mt-2 text-slate-600">
                These venues have been selected by the admin team to appear as
                featured options for hirers.
              </p>
            </div>

            {featuredVenues.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-500">
                No featured venues have been selected yet.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {featuredVenues.map((venue) => {
                  const blockedPeriod = getBlockedPeriodText(venue);

                  return (
                    <article
                      key={venue.id}
                      className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {venue.name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {venue.location} · {venue.type}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-700 px-3 py-1 text-sm font-semibold text-white">
                          Featured
                        </span>
                      </div>

                      <p className="text-sm text-slate-700">
                        Capacity: {venue.capacity} · Managed by: {venue.managedBy}
                      </p>

                      {blockedPeriod ? (
                        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                          Blocked period: {blockedPeriod}
                        </p>
                      ) : (
                        <p className="mt-3 rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-800">
                          No blocked period listed.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Search available venues
                </h2>
                <p className="mt-2 text-slate-600">
                  Search by venue name, location, capacity, and recommended
                  suitability.
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => void handleSearchSubmit(event)}
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Venue name
                </label>
                <input
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder="e.g. Oak Hall"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Location
                </label>
                <input
                  value={searchLocation}
                  onChange={(event) => setSearchLocation(event.target.value)}
                  placeholder="e.g. Carlton"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Minimum capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={searchCapacity}
                  onChange={(event) => setSearchCapacity(event.target.value)}
                  placeholder="e.g. 120"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Suitability
                </label>
                <select
                  value={searchSuitability}
                  onChange={(event) => setSearchSuitability(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                >
                  <option value="">All suitability</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Networking">Networking</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Formal">Formal</option>
                  <option value="Conference">Conference</option>
                  <option value="Launch">Launch</option>
                  <option value="Cocktail">Cocktail</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isVenueLoading}
                  className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isVenueLoading ? "Searching..." : "Search venues"}
                </button>

                <button
                  type="button"
                  onClick={() => void handleSearchReset()}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Reset filters
                </button>
              </div>
            </form>

            {visibleVenues.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                No venues found.
              </div>
            ) : (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {visibleVenues.map((venue) => {
                  const isPreferred = preferredVenueIds.includes(venue.id);
                  const suitabilityItems = venue.recommendedSuitability
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
                  const blockedPeriod = getBlockedPeriodText(venue);

                  return (
                    <article
                      key={venue.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {venue.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {venue.location}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {venue.isFeatured && (
                            <span className="rounded-full bg-blue-700 px-3 py-1 text-sm font-semibold text-white">
                              Featured
                            </span>
                          )}

                          <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                            {venue.type}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {suitabilityItems.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mb-5 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p>
                          <span className="font-semibold text-slate-800">
                            Capacity:
                          </span>{" "}
                          {venue.capacity}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Managed by:
                          </span>{" "}
                          {venue.managedBy}
                        </p>
                      </div>

                      {blockedPeriod ? (
                        <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                          Blocked by vendor: {blockedPeriod}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => togglePreferredVenue(venue.id)}
                        className={`rounded-lg px-5 py-3 font-semibold transition ${
                          isPreferred
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-slate-900 text-white hover:bg-slate-700"
                        }`}
                      >
                        {isPreferred
                          ? "Remove from preferred"
                          : "Add to preferred"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            {preferredMessage && (
              <p className="mt-6 text-sm font-medium text-green-700">
                {preferredMessage}
              </p>
            )}
          </section>

          <section className="mb-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  Preferred venues ranking
                </h2>

                <button
                  type="button"
                  onClick={() => void handleSavePreferences()}
                  disabled={isSavingPreferences}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSavingPreferences ? "Saving..." : "Save ranking"}
                </button>
              </div>

              {preferredVenues.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  No preferred venues have been saved.
                </div>
              ) : (
                <div className="space-y-4">
                  {preferredVenues.map((venue, index) => (
                    <div
                      key={venue.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                            Preference #{index + 1}
                          </p>
                          <h3 className="text-lg font-bold text-slate-900">
                            {venue.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {venue.location}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => togglePreferredVenue(venue.id)}
                          className="text-sm font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => movePreferredVenue(index, "up")}
                          disabled={index === 0}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Move up
                        </button>

                        <button
                          type="button"
                          onClick={() => movePreferredVenue(index, "down")}
                          disabled={index === preferredVenues.length - 1}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Move down
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Apply for a venue
              </h2>

              {applicationMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {applicationMessage}
                </div>
              )}

              <form
                className="space-y-5"
                onSubmit={(event) => void handleApplicationSubmit(event)}
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Preferred venue
                  </label>
                  <select
                    name="venueId"
                    value={applicationForm.venueId}
                    onChange={handleApplicationChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  >
                    <option value="">Select a venue</option>
                    {preferredVenues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.location}
                      </option>
                    ))}
                  </select>
                  {applicationErrors.venueId && (
                    <p className="mt-2 text-sm text-red-600">
                      {applicationErrors.venueId}
                    </p>
                  )}
                </div>

                {applicationForm.venueId && (() => {
                  const selectedVenue = allVenues.find(
                    (venue) => String(venue.id) === applicationForm.venueId
                  );
                  const blockedPeriod = selectedVenue
                    ? getBlockedPeriodText(selectedVenue)
                    : "";

                  return blockedPeriod ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      This venue is blocked from {blockedPeriod}. Applications
                      during this period will not be accepted.
                    </div>
                  ) : null;
                })()}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Event name
                  </label>
                  <input
                    name="eventName"
                    value={applicationForm.eventName}
                    onChange={handleApplicationChange}
                    placeholder="Enter your event name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  {applicationErrors.eventName && (
                    <p className="mt-2 text-sm text-red-600">
                      {applicationErrors.eventName}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Expected guests
                    </label>
                    <input
                      name="expectedGuests"
                      type="number"
                      min="1"
                      value={applicationForm.expectedGuests}
                      onChange={handleApplicationChange}
                      placeholder="e.g. 100"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    />
                    {applicationErrors.expectedGuests && (
                      <p className="mt-2 text-sm text-red-600">
                        {applicationErrors.expectedGuests}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Duration (hours)
                    </label>
                    <input
                      name="durationHours"
                      type="number"
                      min="1"
                      value={applicationForm.durationHours}
                      onChange={handleApplicationChange}
                      placeholder="e.g. 4"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    />
                    {applicationErrors.durationHours && (
                      <p className="mt-2 text-sm text-red-600">
                        {applicationErrors.durationHours}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Event date
                    </label>
                    <input
                      name="eventDate"
                      type="date"
                      value={applicationForm.eventDate}
                      onChange={handleApplicationChange}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    />
                    {applicationErrors.eventDate && (
                      <p className="mt-2 text-sm text-red-600">
                        {applicationErrors.eventDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Event time
                    </label>
                    <input
                      name="eventTime"
                      type="time"
                      value={applicationForm.eventTime}
                      onChange={handleApplicationChange}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    />
                    {applicationErrors.eventTime && (
                      <p className="mt-2 text-sm text-red-600">
                        {applicationErrors.eventTime}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingApplication}
                  className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSubmittingApplication
                    ? "Submitting..."
                    : "Submit application"}
                </button>
              </form>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Submitted applications
              </h2>

              {applications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  No applications submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {application.eventName}
                        </h3>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                          {application.status}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-800">
                            Venue:
                          </span>{" "}
                          {application.venueName}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Location:
                          </span>{" "}
                          {application.location}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Guests:
                          </span>{" "}
                          {application.expectedGuests}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Date:
                          </span>{" "}
                          {application.eventDate}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Time:
                          </span>{" "}
                          {application.eventTime}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Duration:
                          </span>{" "}
                          {application.durationHours} hours
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Hiring history
              </h2>

              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                  No past hiring history available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {item.venueName}
                        </h3>
                        <span className="text-sm font-semibold text-amber-500">
                          {renderStars(item.rating)}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-800">
                            Location:
                          </span>{" "}
                          {item.location}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Event:
                          </span>{" "}
                          {item.eventName}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Date of hire:
                          </span>{" "}
                          {item.hireDate}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">
                            Rating:
                          </span>{" "}
                          {item.rating}/5
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
