import { SignatureDestination, TripBooking } from '../types';

export const SIGNATURE_DESTINATIONS: SignatureDestination[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    tagline: 'Terraced sanctuaries & sacred coastlines',
    image: '/images/hero_bali_luxury_1790674276055.jpg',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    tagline: 'Futuristic silhouettes & sunset dunes',
    image: '/images/dest_dubai_1790674315094.jpg',
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Indian Ocean',
    tagline: 'Overwater pavilions & turquoise silence',
    image: '/images/dest_maldives_1790674294175.jpg',
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    tagline: 'Portuguese heritage villas & quiet shores',
    image: '/images/dest_goa_1790674366139.jpg',
  },
  {
    id: 'manali',
    name: 'Manali',
    country: 'Himachal, India',
    tagline: 'Cedar-scented pine valleys & alpine peaks',
    image: '/images/dest_manali_1790674332732.jpg',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Southeast Asia',
    tagline: 'Verdant supertrees & Michelin culinary art',
    image: '/images/dest_singapore_1790674346843.jpg',
  },
];

export const INITIAL_BOOKED_TRIPS: TripBooking[] = [
  {
    id: 'NT-8921',
    destination: 'Dubai',
    packageName: 'Dubai Glamour & Desert Mirage',
    startDate: '14 Nov 2026',
    endDate: '18 Nov 2026',
    travellers: {
      adults: 2,
      children: 0,
    },
    totalPrice: 79998,
    status: 'Confirmed',
    bookingDate: '12 Sep 2026',
    image: '/images/dest_dubai_1790674315094.jpg',
    tripStyle: 'Luxury',
  },
  {
    id: 'NT-6714',
    destination: 'Goa',
    packageName: 'Goa Coastal Charm & Heritage Villas',
    startDate: '22 Jan 2026',
    endDate: '25 Jan 2026',
    travellers: {
      adults: 2,
      children: 1,
    },
    totalPrice: 36998,
    status: 'Completed',
    bookingDate: '04 Dec 2025',
    image: '/images/dest_goa_1790674366139.jpg',
    tripStyle: 'Culture',
  },
];
