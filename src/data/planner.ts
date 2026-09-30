import {
  Activity,
  ActivityCategory,
  CostBreakdown,
  DaySlot,
  PlanState,
  PlannedDay,
  TravellerType,
  TripDraft,
} from '../types';

export const MAX_TRIP_DAYS = 14;

export interface PlannerDestination {
  id: string;
  name: string;
  country: string;
  image: string;
  /** Stay cost per room per night in INR: [comfort, signature, luxury]. */
  stayPerNight: [number, number, number];
  /** Private chauffeur / transfers per day in INR. */
  transferPerDay: number;
  activities: Activity[];
}

const SLOT_ORDER: Record<DaySlot, number> = { Morning: 0, Afternoon: 1, Evening: 2 };

const act = (
  id: string,
  name: string,
  category: ActivityCategory,
  slot: DaySlot,
  cost: number,
  hours: number,
  description: string
): Activity => ({ id, name, category, slot, cost, hours, description });

export const PLANNER_DESTINATIONS: PlannerDestination[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    image: '/images/hero_bali_luxury_1790674276055.jpg',
    stayPerNight: [6500, 14000, 32000],
    transferPerDay: 2800,
    activities: [
      act('bali-tegallalang', 'Tegallalang Rice Terrace Sunrise', 'Sightseeing', 'Morning', 1800, 3, 'Beat the crowds to Ubud’s sculpted emerald terraces.'),
      act('bali-tirta', 'Tirta Empul Purification Ritual', 'Culture', 'Morning', 1500, 2.5, 'A guided water-temple cleansing with a local priest.'),
      act('bali-coffee', 'Organic Coffee & Spice Plantation', 'Food', 'Afternoon', 1200, 2, 'Taste luwak-free single-origin coffee in a jungle setting.'),
      act('bali-ubud-walk', 'Ubud Art Market & Studio Walk', 'Culture', 'Afternoon', 900, 3, 'Meet silversmiths, painters and woodcarvers at work.'),
      act('bali-swing', 'Jungle Swing & Waterfall Trek', 'Adventure', 'Morning', 3200, 4, 'Valley swings and a short hike to Tegenungan falls.'),
      act('bali-uluwatu', 'Uluwatu Cliff Temple & Kecak Fire Dance', 'Culture', 'Evening', 2200, 3, 'Sunset above the Indian Ocean followed by the fire dance.'),
      act('bali-jimbaran', 'Jimbaran Beach Seafood Dinner', 'Food', 'Evening', 3600, 2.5, 'Grilled catch of the day with your toes in the sand.'),
      act('bali-spa', 'Balinese Flower-Petal Spa Ritual', 'Wellness', 'Afternoon', 4200, 2.5, 'Two-hour massage, scrub and floral bath.'),
      act('bali-yoga', 'Sunrise Yoga Over the Valley', 'Wellness', 'Morning', 1400, 1.5, 'Gentle vinyasa on a bamboo platform.'),
      act('bali-nusa', 'Nusa Penida Day Cruise', 'Adventure', 'Morning', 6800, 9, 'Kelingking Beach, Angel’s Billabong and manta-ray snorkelling.'),
      act('bali-cooking', 'Balinese Cooking Class', 'Food', 'Afternoon', 2400, 4, 'Market visit and a hands-on class in a village compound.'),
      act('bali-sunset', 'Seminyak Beach Club Sunset', 'Leisure', 'Evening', 2800, 3, 'Daybeds, cocktails and the famous Bali sunset.'),
      act('bali-batur', 'Mount Batur Sunrise Trek', 'Adventure', 'Morning', 4200, 6, 'Guided volcano hike with a summit breakfast.'),
    ],
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Indian Ocean',
    image: '/images/dest_maldives_1790674294175.jpg',
    stayPerNight: [9500, 26000, 70000],
    transferPerDay: 4500,
    activities: [
      act('mv-snorkel', 'House Reef Snorkel Safari', 'Adventure', 'Morning', 3200, 2.5, 'Turtles, reef sharks and rays a few strokes from the jetty.'),
      act('mv-dolphin', 'Sunset Dolphin Cruise', 'Sightseeing', 'Evening', 4200, 2, 'Dhoni boat out to the pods at golden hour.'),
      act('mv-sandbank', 'Private Sandbank Picnic', 'Leisure', 'Afternoon', 7500, 3, 'A white-linen lunch on an island of your own.'),
      act('mv-spa', 'Overwater Couples Spa', 'Wellness', 'Afternoon', 9500, 2.5, 'Glass-floor treatment room above the lagoon.'),
      act('mv-dive', 'Discover Scuba Dive', 'Adventure', 'Morning', 8200, 3, 'A beginner-friendly dive with a PADI instructor.'),
      act('mv-breakfast', 'Floating Breakfast in Your Villa Pool', 'Food', 'Morning', 3800, 1.5, 'A tray that floats — the Maldives signature.'),
      act('mv-lobster', 'Beachfront Grilled Lobster Dinner', 'Food', 'Evening', 8800, 2.5, 'Tables set on the sand under lanterns.'),
      act('mv-kayak', 'Glass-Bottom Kayak at Dawn', 'Leisure', 'Morning', 1800, 1.5, 'Silent paddling over coral gardens.'),
      act('mv-island', 'Local Island & Fishing Village Visit', 'Culture', 'Afternoon', 2800, 3, 'Handicraft stalls, a mosque and traditional fish curry.'),
      act('mv-nightfish', 'Night Fishing Under the Stars', 'Adventure', 'Evening', 3400, 2.5, 'Handline fishing the traditional way, then grill your catch.'),
      act('mv-bio', 'Bioluminescent Beach Walk', 'Sightseeing', 'Evening', 1200, 1.5, 'Glowing plankton lights the shoreline at night.'),
      act('mv-cinema', 'Private Sand Cinema', 'Leisure', 'Evening', 5600, 2.5, 'A film on the beach with popcorn and cushions.'),
      act('mv-sound', 'Overwater Sound Bath & Meditation', 'Wellness', 'Morning', 2600, 1.5, 'Singing bowls at sunrise on the deck.'),
    ],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    image: '/images/dest_dubai_1790674315094.jpg',
    stayPerNight: [8500, 19000, 48000],
    transferPerDay: 3600,
    activities: [
      act('dxb-burj', 'Burj Khalifa At The Top (Level 148)', 'Sightseeing', 'Evening', 5400, 2, 'The world’s tallest tower at sunset.'),
      act('dxb-desert', 'Desert Safari & Bedouin Camp Dinner', 'Adventure', 'Afternoon', 4800, 6, 'Dune bashing, camel ride and a barbecue under the stars.'),
      act('dxb-oldtown', 'Old Dubai: Souks, Abra & Creek', 'Culture', 'Morning', 1400, 3.5, 'Spice and gold souks and a wooden abra crossing.'),
      act('dxb-mosque', 'Sheikh Zayed Grand Mosque, Abu Dhabi', 'Culture', 'Morning', 3200, 5, 'Marble domes and the world’s largest hand-knotted carpet.'),
      act('dxb-balloon', 'Sunrise Hot-Air Balloon Flight', 'Adventure', 'Morning', 14500, 4, 'Float over the dunes with a falconry show and breakfast.'),
      act('dxb-marina', 'Marina Yacht Dinner Cruise', 'Food', 'Evening', 6200, 3, 'A private-deck dinner past the illuminated skyline.'),
      act('dxb-museum', 'Museum of the Future', 'Sightseeing', 'Afternoon', 3400, 2.5, 'Calligraphy-clad torus with immersive exhibits.'),
      act('dxb-fountain', 'Dubai Fountain & Mall Stroll', 'Leisure', 'Evening', 500, 2, 'Choreographed fountain show beside Burj Khalifa.'),
      act('dxb-brunch', 'Friday Gourmet Brunch', 'Food', 'Afternoon', 6800, 3, 'A hotel-terrace spread with live stations.'),
      act('dxb-spa', 'Arabian Hammam Spa', 'Wellness', 'Afternoon', 5200, 2.5, 'Traditional steam, scrub and argan-oil massage.'),
      act('dxb-frame', 'Dubai Frame & Al Fahidi District', 'Sightseeing', 'Morning', 1600, 3, 'Frame views and heritage wind-tower lanes.'),
      act('dxb-palm', 'Palm Jumeirah & Atlantis Aquaventure', 'Adventure', 'Afternoon', 6400, 5, 'Record-breaking slides and a lazy river.'),
    ],
  },
  {
    id: 'manali',
    name: 'Manali',
    country: 'Himachal, India',
    image: '/images/dest_manali_1790674332732.jpg',
    stayPerNight: [3800, 8500, 21000],
    transferPerDay: 2600,
    activities: [
      act('mnl-solang', 'Solang Valley Snow Activities', 'Adventure', 'Morning', 2200, 4, 'Skiing, zorbing or a cable-car to the ridge.'),
      act('mnl-atal', 'Atal Tunnel & Sissu Drive', 'Sightseeing', 'Morning', 1800, 5, 'The world’s highest highway tunnel and a quiet lake village.'),
      act('mnl-hadimba', 'Hadimba Devi Cedar Temple', 'Culture', 'Morning', 400, 1.5, 'A pagoda-style temple in an ancient deodar forest.'),
      act('mnl-old', 'Old Manali Cafe Crawl', 'Food', 'Afternoon', 1600, 3, 'Trout, siddu and live-music cafes along the Manalsu river.'),
      act('mnl-rafting', 'Beas River Rafting', 'Adventure', 'Afternoon', 1800, 2.5, 'Grade II–III rapids through the Kullu valley.'),
      act('mnl-paraglide', 'Tandem Paragliding at Solang', 'Adventure', 'Afternoon', 3200, 1.5, 'Glide above the Pir Panjal range.'),
      act('mnl-vashisht', 'Vashisht Hot Springs & Village Walk', 'Wellness', 'Afternoon', 500, 2.5, 'Natural sulphur baths and stone-and-timber lanes.'),
      act('mnl-rohtang', 'Rohtang Pass Day Excursion', 'Sightseeing', 'Morning', 3800, 8, 'Snowfields at 3,978 m (permit-dependent, seasonal).'),
      act('mnl-bonfire', 'Riverside Bonfire & Himachali Dinner', 'Food', 'Evening', 1900, 3, 'Dham-style thali around a crackling fire.'),
      act('mnl-naggar', 'Naggar Castle & Roerich Gallery', 'Culture', 'Afternoon', 900, 3, 'A 500-year-old stone castle above the valley.'),
      act('mnl-camp', 'Stargazing Camp in the Pines', 'Leisure', 'Evening', 2800, 3, 'Guided constellations from a high meadow.'),
      act('mnl-massage', 'Himalayan Herbal Massage', 'Wellness', 'Evening', 2400, 1.5, 'Warm herbal oils to ease the mountain chill.'),
    ],
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    image: '/images/dest_goa_1790674366139.jpg',
    stayPerNight: [4200, 10500, 26000],
    transferPerDay: 2400,
    activities: [
      act('goa-fontainhas', 'Fontainhas Latin Quarter Heritage Walk', 'Culture', 'Morning', 700, 2.5, 'Pastel Portuguese lanes and azulejo tiles.'),
      act('goa-churches', 'Old Goa Churches (UNESCO)', 'Culture', 'Morning', 900, 2.5, 'Basilica of Bom Jesus and Sé Cathedral.'),
      act('goa-dudhsagar', 'Dudhsagar Waterfall Jeep Safari', 'Adventure', 'Morning', 3200, 7, 'Off-road through the Mollem forest to the four-tier falls.'),
      act('goa-spice', 'Spice Plantation Lunch', 'Food', 'Afternoon', 1400, 3, 'Walk the farm and eat on banana leaves.'),
      act('goa-sunset', 'Chapora Fort & Vagator Sunset', 'Sightseeing', 'Evening', 500, 2.5, 'The ‘Dil Chahta Hai’ ramparts at dusk.'),
      act('goa-cruise', 'Mandovi Sunset Cruise', 'Leisure', 'Evening', 1200, 1.5, 'Live folk music and dance on the river.'),
      act('goa-water', 'Water Sports at Calangute', 'Adventure', 'Afternoon', 2400, 2.5, 'Parasailing, jet-ski and banana boat.'),
      act('goa-seafood', 'Cliffside Seafood Dinner', 'Food', 'Evening', 2800, 2.5, 'Prawn balchão and fish recheado above the sea.'),
      act('goa-market', 'Anjuna Flea Market & Cafe Trail', 'Leisure', 'Afternoon', 900, 3, 'Boho stalls, thrift jewellery and sea views.'),
      act('goa-south', 'South Goa Quiet Beaches (Palolem & Agonda)', 'Sightseeing', 'Morning', 1600, 6, 'Crescent coves and empty sands.'),
      act('goa-spa', 'Ayurvedic Beachside Massage', 'Wellness', 'Afternoon', 2600, 1.5, 'Herbal-oil abhyanga by the shore.'),
      act('goa-cooking', 'Goan Kitchen Masterclass', 'Food', 'Afternoon', 2000, 3, 'Vindaloo, xacuti and bebinca with a home cook.'),
    ],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Southeast Asia',
    image: '/images/dest_singapore_1790674346843.jpg',
    stayPerNight: [9500, 21000, 52000],
    transferPerDay: 3000,
    activities: [
      act('sg-gardens', 'Gardens by the Bay & Cloud Forest', 'Sightseeing', 'Afternoon', 2800, 3.5, 'Supertrees, the Flower Dome and a 35 m indoor waterfall.'),
      act('sg-lightshow', 'Supertree Grove Light Show', 'Leisure', 'Evening', 0, 1, 'The free nightly show — pair with a rooftop drink.'),
      act('sg-hawker', 'Michelin Hawker Crawl (Maxwell & Lau Pa Sat)', 'Food', 'Evening', 2200, 3, 'Chicken rice, satay and chilli crab with a food guide.'),
      act('sg-sentosa', 'Sentosa Island & Universal Studios', 'Adventure', 'Morning', 6200, 9, 'Rides, beaches and the cable car.'),
      act('sg-zoo', 'Night Safari', 'Adventure', 'Evening', 3400, 3, 'The world’s first nocturnal zoo.'),
      act('sg-chinatown', 'Chinatown, Little India & Kampong Glam', 'Culture', 'Morning', 900, 4, 'Three heritage quarters on one walking route.'),
      act('sg-marina', 'Marina Bay Sands SkyPark', 'Sightseeing', 'Evening', 2800, 1.5, 'The skyline from 57 floors.'),
      act('sg-river', 'Singapore River Bumboat Cruise', 'Sightseeing', 'Evening', 2200, 1, 'Merlion, Clarke Quay and colonial landmarks.'),
      act('sg-botanic', 'Botanic Gardens & National Orchid Garden', 'Sightseeing', 'Morning', 1000, 3, 'UNESCO-listed gardens with 1,000 orchid species.'),
      act('sg-spa', 'Orchard Road Spa & Shopping Break', 'Wellness', 'Afternoon', 5200, 3, 'Massage followed by a stroll of Asia’s retail avenue.'),
      act('sg-museum', 'ArtScience Museum & Helix Bridge', 'Culture', 'Afternoon', 2600, 2.5, 'Digital art installations in a lotus-shaped museum.'),
      act('sg-brunch', 'Peranakan Tea & Kueh Brunch', 'Food', 'Morning', 1800, 2, 'Nyonya cuisine in a painted shophouse.'),
    ],
  },
];

export const CATEGORY_STYLES: Record<ActivityCategory, { bg: string; text: string; dot: string }> = {
  Sightseeing: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  Culture: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  Adventure: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  Food: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Wellness: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Leisure: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
};

export const CATEGORIES = Object.keys(CATEGORY_STYLES) as ActivityCategory[];


export const getDestination = (id: string) => PLANNER_DESTINATIONS.find((d) => d.id === id);

export const formatINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ---------- cities / areas inside a destination ----------

export interface City {
  id: string;
  name: string;
  blurb: string;
  /** Catalogue activities that belong to this city. */
  activityIds: string[];
}

const CITY_DATA: Record<string, { transfer: string; cities: City[] }> = {
  bali: {
    transfer: 'Private car transfer',
    cities: [
      { id: 'ubud', name: 'Ubud', blurb: 'Rice terraces, temples, art and jungle wellness', activityIds: ['bali-tegallalang', 'bali-tirta', 'bali-coffee', 'bali-ubud-walk', 'bali-swing', 'bali-yoga', 'bali-cooking', 'bali-batur'] },
      { id: 'uluwatu', name: 'Uluwatu & Jimbaran', blurb: 'Clifftop temples, surf coves and seafood on the sand', activityIds: ['bali-uluwatu', 'bali-jimbaran'] },
      { id: 'seminyak', name: 'Seminyak', blurb: 'Beach clubs, sunsets, spas and nightlife', activityIds: ['bali-sunset', 'bali-spa'] },
      { id: 'nusa', name: 'Nusa Penida', blurb: 'Dramatic cliffs, manta rays and quiet island days', activityIds: ['bali-nusa'] },
    ],
  },
  maldives: {
    transfer: 'Speedboat transfer',
    cities: [
      { id: 'north-male', name: 'North Malé Atoll', blurb: 'Local islands, dolphin cruises and easy resort days', activityIds: ['mv-island', 'mv-dolphin', 'mv-breakfast', 'mv-kayak', 'mv-sound'] },
      { id: 'baa', name: 'Baa Atoll', blurb: 'A UNESCO reserve for reef, diving and night skies', activityIds: ['mv-snorkel', 'mv-dive', 'mv-bio', 'mv-nightfish'] },
      { id: 'ari', name: 'Ari Atoll', blurb: 'Sandbanks, overwater spas and lantern-lit dinners', activityIds: ['mv-sandbank', 'mv-spa', 'mv-lobster', 'mv-cinema'] },
    ],
  },
  dubai: {
    transfer: 'Private car transfer',
    cities: [
      { id: 'downtown', name: 'Downtown Dubai', blurb: 'Burj Khalifa, fountains, malls and brunch', activityIds: ['dxb-burj', 'dxb-museum', 'dxb-fountain', 'dxb-brunch'] },
      { id: 'old-dubai', name: 'Old Dubai', blurb: 'Souks, the creek and heritage lanes', activityIds: ['dxb-oldtown', 'dxb-frame'] },
      { id: 'marina-palm', name: 'Marina & Palm', blurb: 'Yacht dinners, waterparks and spa time', activityIds: ['dxb-marina', 'dxb-palm', 'dxb-spa'] },
      { id: 'desert', name: 'Desert & Abu Dhabi', blurb: 'Dunes, balloons and the Grand Mosque', activityIds: ['dxb-desert', 'dxb-balloon', 'dxb-mosque'] },
    ],
  },
  manali: {
    transfer: 'Scenic drive',
    cities: [
      { id: 'manali-town', name: 'Manali Town', blurb: 'Cedar temples, cafes, hot springs and bonfires', activityIds: ['mnl-hadimba', 'mnl-old', 'mnl-vashisht', 'mnl-massage', 'mnl-bonfire'] },
      { id: 'solang', name: 'Solang & Rohtang', blurb: 'Snow activities, high passes and starry meadows', activityIds: ['mnl-solang', 'mnl-paraglide', 'mnl-atal', 'mnl-rohtang', 'mnl-camp'] },
      { id: 'naggar', name: 'Naggar & Kullu', blurb: 'Castle heritage and river rafting', activityIds: ['mnl-naggar', 'mnl-rafting'] },
    ],
  },
  goa: {
    transfer: 'Private car transfer',
    cities: [
      { id: 'north-goa', name: 'North Goa', blurb: 'Fort sunsets, water sports, flea markets and seafood', activityIds: ['goa-sunset', 'goa-water', 'goa-market', 'goa-seafood'] },
      { id: 'panjim', name: 'Panjim & Old Goa', blurb: 'Latin quarter, UNESCO churches and river cruises', activityIds: ['goa-fontainhas', 'goa-churches', 'goa-cruise', 'goa-cooking'] },
      { id: 'south-goa', name: 'South Goa', blurb: 'Quiet coves, spice farms, spas and waterfalls', activityIds: ['goa-south', 'goa-spa', 'goa-spice', 'goa-dudhsagar'] },
    ],
  },
  singapore: {
    transfer: 'Private car transfer',
    cities: [
      { id: 'marina-bay', name: 'Marina Bay', blurb: 'Skyline, Gardens by the Bay and river cruises', activityIds: ['sg-gardens', 'sg-lightshow', 'sg-marina', 'sg-river', 'sg-museum'] },
      { id: 'heritage', name: 'Chinatown & Heritage', blurb: 'Hawker feasts, shophouses and three cultures', activityIds: ['sg-chinatown', 'sg-hawker', 'sg-brunch'] },
      { id: 'orchard', name: 'Orchard & Gardens', blurb: 'Orchids, spas, shopping and the night safari', activityIds: ['sg-botanic', 'sg-spa', 'sg-zoo'] },
      { id: 'sentosa', name: 'Sentosa', blurb: 'Beaches, rides and resort island fun', activityIds: ['sg-sentosa'] },
    ],
  },
};

export const getCities = (destId: string): City[] => CITY_DATA[destId]?.cities ?? [];

export const transferLabel = (destId: string, toCityName: string) =>
  `${CITY_DATA[destId]?.transfer ?? 'Private transfer'} to ${toCityName}`;

export const cityOfActivity = (destId: string, activityId: string): City | undefined =>
  getCities(destId).find((c) => c.activityIds.includes(activityId));

export interface CityStop {
  city: City;
  nights: number;
  /** 0-based day indexes, inclusive. */
  startDay: number;
  endDay: number;
}

/**
 * Splits the trip across the chosen cities: nights are shared evenly (extras go to the
 * earliest stops) and the last city also owns the departure day.
 */
export const cityStops = (d: TripDraft): CityStop[] => {
  const all = getCities(d.destinationId);
  const chosen = d.cityIds.map((id) => all.find((c) => c.id === id)).filter((c): c is City => Boolean(c));
  const nights = Math.max(1, nightsBetween(d.checkIn, d.checkOut));
  const list = chosen.slice(0, nights); // never more stops than nights
  if (!list.length) return [];
  const base = Math.floor(nights / list.length);
  const extra = nights % list.length;
  let day = 0;
  return list.map((city, i) => {
    const n = base + (i < extra ? 1 : 0);
    const startDay = day;
    day += n;
    return { city, nights: n, startDay, endDay: i === list.length - 1 ? day : day - 1 };
  });
};

export const cityForDay = (d: TripDraft, dayIndex: number): City | undefined => {
  const stops = cityStops(d);
  return (stops.find((s) => dayIndex >= s.startDay && dayIndex <= s.endDay) ?? stops[stops.length - 1])?.city;
};

/** AI's choice of cities: more interest matches first, more stops on longer trips, kept in touring order. */
export const aiPickCities = (d: TripDraft): string[] => {
  const all = getCities(d.destinationId);
  if (!all.length) return [];
  const dest = getDestination(d.destinationId);
  const nights = Math.max(1, nightsBetween(d.checkIn, d.checkOut));
  const want = nights <= 2 ? 1 : nights <= 5 ? Math.min(2, all.length) : Math.min(3, all.length);
  const score = (c: City) => {
    const acts = (dest?.activities ?? []).filter((a) => c.activityIds.includes(a.id));
    const hits = d.interests.length ? acts.filter((a) => d.interests.includes(a.category)).length : 0;
    return hits * 3 + acts.length * 0.5;
  };
  const picked = new Set([...all].sort((a, b) => score(b) - score(a)).slice(0, want).map((c) => c.id));
  return all.map((c) => c.id).filter((id) => picked.has(id));
};

// ---------- dates ----------

const DAY_MS = 24 * 60 * 60 * 1000;

export const nightsBetween = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const diff = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / DAY_MS);
  return Number.isFinite(diff) ? diff : 0;
};

export const addDaysISO = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Trip length in days (nights + 1). */
export const tripDays = (d: TripDraft) => nightsBetween(d.checkIn, d.checkOut) + 1;

export const dayDate = (checkIn: string, dayIndex: number) =>
  new Date(addDaysISO(checkIn, dayIndex)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/** Returns an error message, or null when the draft is ready to plan. */
export const validateDraft = (d: TripDraft): string | null => {
  if (!getDestination(d.destinationId)) return 'Choose a destination to begin.';
  if (!d.checkIn || !d.checkOut) return 'Pick your check-in and check-out dates.';
  const nights = nightsBetween(d.checkIn, d.checkOut);
  if (nights < 1) return 'Check-out must be at least one night after check-in.';
  if (nights + 1 > MAX_TRIP_DAYS) return `We can plan up to ${MAX_TRIP_DAYS} days at a time.`;
  if (d.adults < 1) return 'At least one adult is needed.';
  return null;
};

// ---------- plan state ----------

export const planSignature = (d: TripDraft) => `${d.destinationId}|${tripDays(d)}`;

export const emptyPlan = (d: TripDraft): PlanState => ({
  signature: planSignature(d),
  days: Array.from({ length: tripDays(d) }, () => []),
  extras: [],
});

export const activityMap = (plan: PlanState): Map<string, Activity> => {
  const map = new Map<string, Activity>();
  const dest = plan.signature.split('|')[0];
  getDestination(dest)?.activities.forEach((a) => map.set(a.id, a));
  plan.extras.forEach((a) => map.set(a.id, a));
  return map;
};

export const plannedActivities = (plan: PlanState): Activity[][] => {
  const map = activityMap(plan);
  return plan.days.map((ids) =>
    ids.map((id) => map.get(id)).filter((a): a is Activity => Boolean(a))
  );
};

export const toPlannedDays = (plan: PlanState): PlannedDay[] =>
  plannedActivities(plan).map((items, i) => ({
    day: i + 1,
    items: items.map((a) => ({ name: a.name, slot: a.slot, category: a.category, cost: a.cost })),
  }));

// ---------- costs ----------

export const TIER_LABEL = ['Comfort', 'Signature', 'Ultra Luxury'] as const;

export const STAY_TIERS: { label: (typeof TIER_LABEL)[number]; blurb: string }[] = [
  { label: 'Comfort', blurb: 'Well-rated boutique stays' },
  { label: 'Signature', blurb: 'Handpicked villas & resorts' },
  { label: 'Ultra Luxury', blurb: 'Private pool villas & butlers' },
];

export const computeCosts = (draft: TripDraft, plan: PlanState): CostBreakdown => {
  const dest = getDestination(draft.destinationId);
  const days = tripDays(draft);
  const nights = Math.max(1, days - 1);
  const rooms = Math.max(1, Math.ceil(draft.adults / 2));
  const payingGuests = draft.adults + draft.children * 0.5;

  const stay = dest ? dest.stayPerNight[draft.stayTier] * nights * rooms : 0;
  const transfers = dest ? dest.transferPerDay * days : 0;
  const activities = plannedActivities(plan)
    .flat()
    .reduce((sum, a) => sum + a.cost * payingGuests, 0);
  const subtotal = stay + transfers + activities;
  const service = Math.round(subtotal * 0.05);
  const total = Math.round(subtotal + service);

  return {
    stay,
    transfers,
    activities,
    service,
    total,
    perPerson: Math.round(total / Math.max(1, draft.adults + draft.children)),
    rooms,
  };
};

// ---------- AI picks (local engine, also the fallback when the API is offline) ----------

/**
 * Ranks the ideas not yet planned for a given day. Favours a balanced mix of
 * categories, matches the slot, and suits the chosen stay style.
 */
export const suggestForDay = (
  draft: TripDraft,
  plan: PlanState,
  dayIndex: number,
  limit = 3
): Activity[] => {
  const dest = getDestination(draft.destinationId);
  if (!dest) return [];

  const used = new Set(plan.days.flat());
  const pool = [...dest.activities, ...plan.extras].filter((a) => !used.has(a.id));
  const map = activityMap(plan);
  const today = (plan.days[dayIndex] ?? []).map((id) => map.get(id)).filter(Boolean) as Activity[];
  const picked: Activity[] = [];
  const dayCity = cityForDay(draft, dayIndex);

  for (const slot of ['Morning', 'Afternoon', 'Evening'] as DaySlot[]) {
    if (picked.length >= limit) break;
    if (today.some((a) => a.slot === slot)) continue;

    const seenCats = new Set([...today, ...picked].map((a) => a.category));
    const family = draft.children > 0;
    const candidates = pool
      .filter((a) => a.slot === slot && !picked.includes(a))
      .map((a) => {
        let score = seenCats.has(a.category) ? 0 : 3;
        if (draft.interests.includes(a.category)) score += 2;
        // Keep each day inside the city you are staying in
        if (dayCity) {
          const home = cityOfActivity(dest.id, a.id);
          if (home) score += home.id === dayCity.id ? 3 : -3;
        }
        if (family && a.category === 'Adventure' && a.hours > 6) score -= 2;
        if (family && a.category === 'Wellness') score -= 1;
        // Match experiences to the stay style: premium picks for luxury, gentler prices for comfort
        if (draft.stayTier === 2 && a.cost >= 5000) score += 1;
        if (draft.stayTier === 0 && a.cost >= 8000) score -= 2;
        // Prefer a light day after a heavy one
        if (today.some((t) => t.hours + a.hours > 9)) score -= 1;
        return { a, score: score + (a.aiGenerated ? 0.5 : 0) };
      })
      .sort((x, y) => y.score - x.score);

    if (candidates[0]) picked.push(candidates[0].a);
  }
  return picked;
};

/** Fills every day that has fewer than 3 activities with balanced picks. */
export const autoFillPlan = (draft: TripDraft, plan: PlanState): PlanState => {
  let next: PlanState = { ...plan, days: plan.days.map((d) => [...d]) };
  next.days.forEach((_, i) => {
    const picks = suggestForDay(draft, next, i, 3);
    next = { ...next, days: next.days.map((d, di) => (di === i ? [...d, ...picks.map((p) => p.id)] : d)) };
  });
  return sortDaysBySlot(next);
};

export const sortDaysBySlot = (plan: PlanState): PlanState => {
  const map = activityMap(plan);
  return {
    ...plan,
    days: plan.days.map((ids) =>
      [...ids].sort(
        (a, b) => SLOT_ORDER[map.get(a)?.slot ?? 'Morning'] - SLOT_ORDER[map.get(b)?.slot ?? 'Morning']
      )
    ),
  };
};

/** A short, plain-language read of the plan for the planner and overview pages. */
export const planInsights = (draft: TripDraft, plan: PlanState): string[] => {
  const tips: string[] = [];
  const perDay = plannedActivities(plan);
  const total = perDay.flat().length;

  if (total === 0) {
    tips.push('Start with one anchor experience per day, then let AI fill the gaps around it.');
    return tips;
  }
  const empty = perDay.map((d, i) => (d.length === 0 ? i + 1 : 0)).filter(Boolean);
  if (empty.length) tips.push(`Day ${empty.join(', ')} ${empty.length > 1 ? 'are' : 'is'} still open — a slow morning or a spa evening would balance the pace.`);
  const heavy = perDay.map((d, i) => (d.reduce((s, a) => s + a.hours, 0) > 10 ? i + 1 : 0)).filter(Boolean);
  if (heavy.length) tips.push(`Day ${heavy.join(', ')} is packed (10+ hours). Consider moving one item to a lighter day.`);
  const cats = new Set(perDay.flat().map((a) => a.category));
  if (!cats.has('Food')) tips.push('No food experience yet — a local dining or cooking class rounds out the trip.');
  if (draft.children > 0 && perDay.flat().some((a) => a.category === 'Adventure' && a.hours > 6))
    tips.push('A long adventure day is planned with children — consider a shorter alternative.');
  if (!tips.length) tips.push(`Great balance of pace and variety. Your package is ${formatINR(computeCosts(draft, plan).total)} so far — ready to review.`);
  return tips;
};

export const newDraft = (): TripDraft => ({
  destinationId: '',
  aiDestination: false,
  travellerType: '',
  interests: [],
  aiPlan: false,
  cityIds: [],
  aiCities: false,
  checkIn: '',
  checkOut: '',
  adults: 2,
  children: 0,
  stayTier: 1,
});

/**
 * Carries an in-progress plan over when the traveller edits trip details:
 * same destination keeps every choice (days are padded or trimmed), otherwise start fresh.
 */
export const reconcilePlan = (prev: PlanState | null, draft: TripDraft): PlanState => {
  if (!prev || prev.signature.split('|')[0] !== draft.destinationId) return emptyPlan(draft);
  const days = tripDays(draft);
  return {
    signature: planSignature(draft),
    days: Array.from({ length: days }, (_, i) => prev.days[i] ?? []),
    extras: prev.extras,
  };
};

// ---------- "Let AI choose for me" ----------

const BEST_FOR: Record<string, TravellerType[]> = {
  bali: ['couple', 'friends', 'solo', 'family'],
  maldives: ['couple'],
  dubai: ['family', 'friends'],
  manali: ['friends', 'couple', 'solo'],
  goa: ['friends', 'solo', 'family'],
  singapore: ['family', 'couple'],
};

/** Scores each destination on interest overlap and who is travelling; ties keep catalogue order. */
export const pickDestinationForMe = (draft: TripDraft): PlannerDestination => {
  const scored = PLANNER_DESTINATIONS.map((d) => {
    const interestHits = draft.interests.length
      ? d.activities.filter((a) => draft.interests.includes(a.category)).length / d.activities.length
      : 0;
    const fit = draft.travellerType && BEST_FOR[d.id]?.includes(draft.travellerType) ? 1 : 0;
    const nights = nightsBetween(draft.checkIn, draft.checkOut);
    // Long-haul islands feel rushed on a very short trip
    const shortTripPenalty = nights <= 3 && d.id === 'maldives' ? -0.3 : 0;
    return { d, score: interestHits * 3 + fit * 1.5 + shortTripPenalty };
  }).sort((a, b) => b.score - a.score);
  return scored[0].d;
};
