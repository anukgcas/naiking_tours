/**
 * Short, scannable day-by-day plan used by the stacked itinerary on the tour
 * detail page. Keyed by package id; one entry per itinerary day (in order).
 * Each stop is [time, title].
 */
export interface DayPlan {
  label: string;
  places: string;
  stops: [string, string][];
}

export const ITINERARY_PLANS: Record<string, DayPlan[]> = {
  'bali-escape': [
    {
      label: 'Arrival & Ubud',
      places: 'Denpasar · Ubud',
      stops: [
        ['11:00', 'VIP Welcome at Denpasar Airport'],
        ['12:30', 'Scenic Drive via Rice Fields'],
        ['14:30', 'Private Villa Check-in'],
        ['18:00', 'Sunset Garden Stroll'],
        ['19:30', 'Candlelit Valley Dinner'],
      ],
    },
    {
      label: 'Temples',
      places: 'Tegallalang · Tirta Empul · Uluwatu',
      stops: [
        ['06:00', 'Tegallalang Terrace Sunrise'],
        ['08:00', 'Organic Coffee Tasting'],
        ['11:30', 'Tirta Empul Purification'],
        ['13:30', 'Treehouse Lunch'],
        ['17:30', 'Kecak Fire Dance at Uluwatu'],
      ],
    },
    {
      label: 'Spa & Farewell',
      places: 'Ubud',
      stops: [
        ['06:30', 'Sunrise Yoga'],
        ['09:00', 'Flower Petal Massage'],
        ['12:00', 'Artisan Studio Walk'],
        ['15:00', 'Keepsake Gift'],
        ['17:00', 'Airport Drop-off'],
      ],
    },
  ],
  'maldives-water-villa': [
    {
      label: 'Arrival',
      places: 'Malé · Private Atoll',
      stops: [
        ['10:00', 'Seaplane Transfer'],
        ['11:30', 'Butler Jetty Welcome'],
        ['13:00', 'Water Villa Check-in'],
        ['15:00', 'Lagoon Swim'],
        ['18:30', 'Sunset Cocktails'],
        ['20:00', 'Grilled Lobster Dinner'],
      ],
    },
    {
      label: 'Reef & Marine',
      places: 'House Reef · Atoll',
      stops: [
        ['08:00', 'Floating Champagne Breakfast'],
        ['10:30', 'Guided Reef Safari'],
        ['13:00', 'Lagoon Lunch'],
        ['17:00', 'Sunset Dolphin Cruise'],
      ],
    },
    {
      label: 'Spa & Sandbank',
      places: 'Overwater Spa · Sandbank',
      stops: [
        ['08:00', 'Overwater Sound Bath'],
        ['09:30', 'Coral Mineral Body Scrub'],
        ['12:30', 'Speedboat to Sandbank'],
        ['13:30', 'White-Linen Picnic'],
        ['19:30', 'Private Sand Cinema'],
      ],
    },
    {
      label: 'Sunrise & Return',
      places: 'Lagoon · Malé',
      stops: [
        ['06:30', 'Lagoon Sunrise Swim'],
        ['08:30', 'Sun Deck Breakfast'],
        ['11:00', 'Butler-Assisted Checkout'],
        ['12:00', 'Seaplane to Malé'],
      ],
    },
  ],
  'dubai-glamour': [
    {
      label: 'Arrival & Marina',
      places: 'DXB · Dubai Marina',
      stops: [
        ['12:00', 'Limousine Pickup at DXB'],
        ['13:30', 'Check-in at The Lana'],
        ['15:30', 'Rooftop Infinity Pool'],
        ['18:30', 'Private Yacht Cruise'],
        ['20:30', 'Ain Dubai & Atlantis Views'],
      ],
    },
    {
      label: 'Sky & Old Dubai',
      places: 'Burj Khalifa · Al Fahidi · Dubai Creek',
      stops: [
        ['09:30', 'Burj Khalifa, Level 148'],
        ['13:00', 'Al Fahidi Heritage Walk'],
        ['14:30', 'Abra Crossing on the Creek'],
        ['15:30', 'Gold & Spice Souks'],
        ['20:00', 'Dinner at Ossiano'],
      ],
    },
    {
      label: 'Desert Camp',
      places: 'Museum of the Future · Conservation Reserve',
      stops: [
        ['09:00', 'Terrace Breakfast'],
        ['10:30', 'Museum of the Future'],
        ['15:00', 'Vintage Land Rover Dunes'],
        ['17:30', 'Falconry Showcase'],
        ['19:30', 'Bedouin Lantern Dinner'],
      ],
    },
    {
      label: 'Farewell',
      places: 'Dubai',
      stops: [
        ['10:00', 'Late Breakfast'],
        ['11:30', 'Oud Perfumery Session'],
        ['14:00', 'Limousine to DXB Terminal 3'],
      ],
    },
  ],
  'goa-coastal-charm': [
    {
      label: 'Heritage Arrival',
      places: 'Dabolim · Cola Beach',
      stops: [
        ['12:00', 'Private Airport Pickup'],
        ['13:30', 'Estate Welcome Sherbet'],
        ['15:00', 'Antiques & Palm-Shaded Pool'],
        ['17:30', 'Sunset at Cola Beach'],
        ['20:00', 'Konkani Prawn Curry Dinner'],
      ],
    },
    {
      label: 'Fontainhas & Spice',
      places: 'Panjim · Ponda · Sal River',
      stops: [
        ['09:30', 'Fontainhas Art Walk'],
        ['11:00', 'Bebinca & Feni Tasting'],
        ['13:30', 'Spice Farm Banana-Leaf Feast'],
        ['17:30', 'Sal River Boat Cruise'],
      ],
    },
    {
      label: 'Yoga & Farewell',
      places: 'Estate · Assagao',
      stops: [
        ['07:00', 'Coconut-Grove Yoga'],
        ['09:00', 'Goan Bread Breakfast'],
        ['12:00', 'Assagao Boutiques'],
        ['15:00', 'Airport Transfer'],
      ],
    },
  ],
  'manali-alpine-serenity': [
    {
      label: 'Himalayan Arrival',
      places: 'Bhuntar · Manali',
      stops: [
        ['09:00', 'Airport Pickup'],
        ['10:30', 'Beas Gorge Drive'],
        ['14:00', 'Stone Castle Check-in'],
        ['15:00', 'Kahwa by the Fireplace'],
        ['19:30', 'Trout Dinner at the Hearth'],
      ],
    },
    {
      label: 'Atal Tunnel & Sissu',
      places: 'Atal Tunnel · Lahaul · Sissu',
      stops: [
        ['07:30', 'Atal Tunnel Drive'],
        ['10:30', 'Lahaul Valley Views'],
        ['12:00', 'Sissu Waterfall Trek'],
        ['13:30', 'Noodles & Mountain Tea'],
        ['18:00', 'Old Manali Cafes'],
      ],
    },
    {
      label: 'Solang & Forest',
      places: 'Solang · Mount Phatru',
      stops: [
        ['09:00', 'Phatru Cable Car'],
        ['10:30', 'Seven-Range Panorama'],
        ['13:00', 'Cedar Trail Naturalist Walk'],
        ['19:00', 'Starlit Barbecue'],
      ],
    },
    {
      label: 'Orchard & Farewell',
      places: 'Manali · Kullu',
      stops: [
        ['08:30', 'Apple Orchard Breakfast'],
        ['10:30', 'Scenic Descent'],
        ['13:00', 'Handloom Co-operative Stop'],
        ['16:00', 'Kullu / Chandigarh Drop-off'],
      ],
    },
  ],
  'singapore-skyline': [
    {
      label: 'Garden City Arrival',
      places: 'Changi · Marina Bay',
      stops: [
        ['11:00', 'VIP Assist at Changi'],
        ['12:00', 'Jewel Rain Vortex'],
        ['14:00', 'Ritz-Carlton Check-in'],
        ['19:00', 'Bayfront Dinner'],
        ['20:45', 'Spectra Light & Water Show'],
      ],
    },
    {
      label: 'Gardens & Supertrees',
      places: 'Botanic Gardens · Gardens by the Bay',
      stops: [
        ['09:00', 'National Orchid Garden'],
        ['12:30', 'Botanic Gardens Lunch'],
        ['15:30', 'Cloud Forest Dome'],
        ['18:30', 'Supertree Observatory Drinks'],
        ['20:45', 'Garden Rhapsody Show'],
      ],
    },
    {
      label: 'Food & Speakeasy',
      places: 'Katong · Orchard Road',
      stops: [
        ['09:30', 'Peranakan Tasting in Katong'],
        ['11:30', 'Michelin Hawker Classics'],
        ['14:30', 'Orchard Road Shopping'],
        ['20:00', 'Mixology Masterclass'],
      ],
    },
    {
      label: 'Sentosa & Farewell',
      places: 'Sentosa · Changi',
      stops: [
        ['09:00', 'Sentosa Cable Car'],
        ['10:00', 'Coastal Walk & Iced Coffee'],
        ['13:00', 'Early Baggage Check-in'],
        ['15:00', 'Departure from Changi'],
      ],
    },
  ],
};
