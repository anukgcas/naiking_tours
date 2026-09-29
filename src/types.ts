export type TripStyle =
  | 'Beach'
  | 'Adventure'
  | 'Luxury'
  | 'Family'
  | 'Romantic'
  | 'Nature'
  | 'Culture';

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  subtitle: string;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
  mealsIncluded: string[];
  stay: string;
  highlight: string;
}

export interface TourPackage {
  id: string;
  name: string;
  destination: string;
  country: string;
  badge?: 'Popular' | 'Best Seller' | 'Signature' | 'Limited';
  duration: string;
  daysCount: number;
  nightsCount: number;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  originalPrice?: number;
  shortHighlight: string;
  description: string;
  tripStyle: TripStyle;
  featuredImage: string;
  gallery: string[];
  hotel: {
    name: string;
    tier: string;
    description: string;
    amenities: string[];
  };
  transport: {
    type: string;
    details: string;
  };
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
}

export interface SignatureDestination {
  id: string;
  name: string;
  country: string;
  tagline: string;
  packageCount: number;
  startingPrice: number;
  image: string;
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
  status: 'Confirmed' | 'Preparing' | 'Completed';
  bookingDate: string;
  image: string;
  tripStyle?: TripStyle;
}

export interface TripSearchState {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  budgetRange: string;
  tripStyle?: TripStyle;
}
