export type TripStyle =
  | 'Beach'
  | 'Adventure'
  | 'Luxury'
  | 'Family'
  | 'Romantic'
  | 'Nature'
  | 'Culture';

export interface SignatureDestination {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image: string;
}

export type ActivityCategory =
  | 'Sightseeing'
  | 'Culture'
  | 'Adventure'
  | 'Food'
  | 'Wellness'
  | 'Leisure';

export type DaySlot = 'Morning' | 'Afternoon' | 'Evening';

/** A place / experience the traveller can drop onto a day of the board. */
export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  slot: DaySlot;
  /** Cost per adult in INR (children are charged at half). */
  cost: number;
  hours: number;
  description: string;
  /** Optional photo; shown as the thumbnail when present. */
  image?: string;
  /** True when suggested live by the AI rather than from the curated catalogue. */
  aiGenerated?: boolean;
}

export type TravellerType = 'solo' | 'couple' | 'family' | 'friends';

export interface TripDraft {
  /** Optional ID for active draft tracking */
  id?: string;
  /** Canonical package ID if created from or customized from a curated package */
  packageId?: string;
  /** Empty while the traveller has asked AI to choose (see aiDestination). */
  destinationId: string;
  aiDestination: boolean;
  travellerType: TravellerType | '';
  /** Activity categories the traveller is into; used to rank ideas and AI picks. */
  interests: ActivityCategory[];
  /** Pre-fill the planner board with AI picks on arrival. */
  aiPlan: boolean;
  /** Cities / areas to visit inside the destination, in visiting order. */
  cityIds: string[];
  /** The traveller asked AI to choose the cities. */
  aiCities: boolean;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  /** Number of hotel/villa rooms requested (default: 1). */
  rooms?: number;
  /** Stay style chosen in the planner: 0 Comfort, 1 Signature, 2 Ultra Luxury. */
  stayTier: 0 | 1 | 2;
  /** Timing or seasonal preference from customizer */
  timingPreference?: string;
}

/** How the traveller reaches the destination on Day 1. */
export type ArrivalMode = 'airport' | 'address' | 'self';

/** Day 1 arrival logistics: where we pick the group up and which hotel they are dropped at. */
export interface ArrivalDetails {
  mode: ArrivalMode;
  /** Pickup address when mode is 'address'. */
  address: string;
  /** 24h "HH:MM". */
  time: string;
  /** Optional flight / train number so the driver can track arrivals. */
  flightNo: string;
  vehicle: string;
  /** Catalogue hotel id, or 'other' when the traveller has their own booking. */
  hotelId: string;
  /** Hotel name typed in when hotelId is 'other'. */
  otherHotel: string;
}

/** Last-day departure logistics: pickup from the hotel and where we drop the group. */
export interface DepartureDetails {
  /** Where the group is dropped: the airport, a custom address, or nowhere (they leave on their own). */
  mode: ArrivalMode;
  /** Drop address when mode is 'address'. */
  address: string;
  /** Time we collect the group from the hotel, 24h "HH:MM". */
  time: string;
  /** Optional flight / train number for the outbound journey. */
  flightNo: string;
  vehicle: string;
  /** Catalogue hotel id to be picked up from, or 'other'. */
  pickupHotelId: string;
  /** Pickup place typed in when pickupHotelId is 'other'. */
  otherPickup: string;
}

/** Step 2 of the flow: the kanban board. `days[i]` holds activity ids for Day i+1. */
export interface PlanState {
  signature: string;
  days: string[][];
  /** AI-suggested activities added to the ideas lane during this session. */
  extras: Activity[];
  /** Day 1 pickup and hotel drop customisation (defaults apply until edited). */
  arrival?: ArrivalDetails;
  /** Last-day pickup and drop customisation (defaults apply until edited). */
  departure?: DepartureDetails;
  /**
   * Custom start/end times (minutes from midnight) set by the traveller, keyed `${dayIndex}:${activityId}`.
   * Activities without an entry fall back to their time-of-day slot.
   */
  times?: Record<string, { start: number; end: number }>;
}

export interface CostBreakdown {
  stay: number;
  transfers: number;
  activities: number;
  service: number;
  total: number;
  perPerson: number;
  rooms: number;
}

export interface PlannedDay {
  day: number;
  items: { name: string; slot: DaySlot; category: ActivityCategory; cost: number }[];
}

export interface TripBooking {
  id: string;
  packageId?: string;
  destination: string;
  packageName: string;
  startDate: string;
  endDate: string;
  travellers: {
    adults: number;
    children: number;
  };
  totalPrice: number;
  status: 'Confirmed' | 'Preparing' | 'Completed' | 'Saved';
  bookingDate: string;
  image: string;
  tripStyle?: TripStyle;
  /** Present on trips built with the customiser. */
  itinerary?: PlannedDay[];
  /** Preserved draft configuration for resuming in planner */
  draft?: TripDraft;
  /** Preserved plan state for resuming in planner */
  plan?: PlanState;
}

export interface SavedPackageItem {
  packageId: string;
  savedAt: string;
}

export type EnquiryCategory =
  | 'general_info'
  | 'general_package'
  | 'discuss_package'
  | 'coupon_availability'
  | 'discount_eligibility'
  | 'seasonal_offers'
  | 'festive_offers'
  | 'callback_request'
  | 'coupons_discounts'
  | 'customization'
  | 'dates_availability'
  | 'other';

export interface PackageEnquiry {
  packageId: string;
  packageName: string;
  destinationId: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContactMethod: 'email' | 'phone' | 'either';
  category: EnquiryCategory;
  message?: string;
  submittedAt: string;
}

export interface EnquirySubmissionResult {
  success: boolean;
  status: 'sent' | 'unsupported_backend' | 'validation_error' | 'network_error';
  message: string;
  enquiryId?: string;
}
