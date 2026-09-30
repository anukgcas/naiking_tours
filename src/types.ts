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
  /** True when suggested live by the AI rather than from the curated catalogue. */
  aiGenerated?: boolean;
}

/** Step 1 of the flow: what the traveller tells us before planning. */
export interface TripDraft {
  destinationId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  /** Budget per adult in INR. 0 = not chosen yet. */
  budgetPerPerson: number;
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
  budgetTotal: number;
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
