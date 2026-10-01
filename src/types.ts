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

/** Step 1 of the flow: what the traveller tells us before planning. */
export interface TripDraft {
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
  /** Stay style chosen in the planner: 0 Comfort, 1 Signature, 2 Ultra Luxury. */
  stayTier: 0 | 1 | 2;
}

/** Step 2 of the flow: the kanban board. `days[i]` holds activity ids for Day i+1. */
export interface PlanState {
  signature: string;
  days: string[][];
  /** AI-suggested activities added to the ideas lane during this session. */
  extras: Activity[];
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
  destination: string;
  packageName: string;
  startDate: string;
  endDate: string;
  travellers: {
    adults: number;
    children: number;
  };
  totalPrice: number;
  status: 'Confirmed' | 'Preparing' | 'Completed';
  bookingDate: string;
  image: string;
  tripStyle?: TripStyle;
  /** Present on trips built with the customiser. */
  itinerary?: PlannedDay[];
}
