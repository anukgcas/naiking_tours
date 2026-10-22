import { ActivityCategory, PlanState, TripDraft } from '../types';
import {
  PLANNER_DESTINATIONS,
  getDestination,
  nightsBetween,
  tripDays,
  defaultArrival,
  defaultDeparture,
  tripVehicle,
  emptyPlan,
  getCities,
} from '../data/planner';
import { CURATED_PACKAGES } from '../components/CuratedPackages';

export const CURRENT_SHARE_SCHEMA_VERSION = 1;
export const MAX_SHARE_PAYLOAD_LENGTH = 8192; // Max characters in encoded URL param

/**
 * Compact, versioned wire format for URL sharing.
 * Uses short keys to minimise URL length without loss of fidelity.
 */
export interface SharePayloadV1 {
  v: 1;
  d: string;               // destinationId
  pkg?: string;            // packageId (canonical)
  in: string;              // checkIn (YYYY-MM-DD)
  out: string;             // checkOut (YYYY-MM-DD)
  a: number;               // adults (1-20)
  c: number;               // children (0-10)
  r: number;               // rooms (1-10)
  st: 0 | 1 | 2;           // stayTier
  tp?: string;             // timingPreference
  i: ActivityCategory[];   // interests
  cids: string[];          // cityIds
  days: string[][];        // activity IDs per day
  veh?: string;            // customized vehicle if any
}

export interface ReconstructedSharedTrip {
  draft: TripDraft;
  plan: PlanState;
  packageName?: string;
  isCuratedPackage: boolean;
}

export type DecodeFailure = {
  success: false;
  error: string;
  code: 'MALFORMED' | 'OVERSIZED' | 'UNSUPPORTED_VERSION' | 'INVALID_DATA';
};

export type DecodeSuccess = {
  success: true;
  data: ReconstructedSharedTrip;
  payload: SharePayloadV1;
};

export type DecodeResult = DecodeSuccess | DecodeFailure;

export function isDecodeFailure(res: DecodeResult): res is DecodeFailure {
  return res.success === false;
}

/**
 * Encodes string to URL-safe base64 (RFC 4648 §5).
 */
export function toUrlSafeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes URL-safe base64 to string.
 */
export function fromUrlSafeBase64(base64: string): string {
  let standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (standard.length % 4 !== 0) {
    standard += '=';
  }
  const binary = atob(standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Serializes approved TripDraft and PlanState fields into a compact URL-safe payload string.
 * Strictly excludes:
 * - Contact information (name, email, phone)
 * - Enquiry messages
 * - Private booking IDs
 * - Unrelated saved trips or wishlists
 * - Client-computed prices
 */
export function serializeItinerary(
  draft: TripDraft,
  plan: PlanState
): { success: true; encoded: string } | { success: false; error: string } {
  try {
    const dest = getDestination(draft.destinationId);
    if (!dest) {
      return { success: false, error: `Invalid destination ID: ${draft.destinationId}` };
    }

    // Filter day activities against destination catalogue to prevent arbitrary IDs
    const validActivityIds = new Set(dest.activities.map((a) => a.id));
    const sanitizedDays = plan.days.map((dayActs) =>
      dayActs.filter((id) => validActivityIds.has(id))
    );

    const vehicle = tripVehicle(draft, plan);

    const payload: SharePayloadV1 = {
      v: CURRENT_SHARE_SCHEMA_VERSION,
      d: draft.destinationId,
      pkg: draft.packageId && CURATED_PACKAGES.some((p) => p.id === draft.packageId) ? draft.packageId : undefined,
      in: draft.checkIn,
      out: draft.checkOut,
      a: Math.max(1, Math.min(20, draft.adults || 2)),
      c: Math.max(0, Math.min(10, draft.children || 0)),
      r: Math.max(1, Math.min(10, draft.rooms || 1)),
      st: (draft.stayTier === 0 || draft.stayTier === 1 || draft.stayTier === 2) ? draft.stayTier : 1,
      tp: draft.timingPreference ? draft.timingPreference.slice(0, 50) : undefined,
      i: Array.isArray(draft.interests) ? draft.interests.slice(0, 6) : ['Leisure', 'Culture'],
      cids: Array.isArray(draft.cityIds) ? draft.cityIds.slice(0, 10) : [],
      days: sanitizedDays,
      veh: vehicle ? vehicle.slice(0, 60) : undefined,
    };

    const jsonStr = JSON.stringify(payload);
    const encoded = toUrlSafeBase64(jsonStr);

    if (encoded.length > MAX_SHARE_PAYLOAD_LENGTH) {
      return {
        success: false,
        error: `Itinerary payload too large to share via URL (${encoded.length} bytes; maximum is ${MAX_SHARE_PAYLOAD_LENGTH}).`,
      };
    }

    return { success: true, encoded };
  } catch (err) {
    return {
      success: false,
      error: `Failed to serialize itinerary: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Generates the full shareable URL containing the ?trip= query parameter.
 */
export function generateShareUrl(
  draft: TripDraft,
  plan: PlanState,
  baseUrl?: string
): { success: true; url: string } | { success: false; error: string } {
  const res = serializeItinerary(draft, plan);
  if ('error' in res) {
    return { success: false, error: res.error };
  }

  let base = baseUrl;
  if (!base && typeof window !== 'undefined') {
    base = `${window.location.origin}${window.location.pathname}`;
  }
  if (!base) {
    base = 'https://naikingtours.com/';
  }

  // Strip existing search params or hash to build a clean share link
  const urlObj = new URL(base);
  urlObj.search = `?trip=${res.encoded}`;
  urlObj.hash = '';

  return { success: true, url: urlObj.toString() };
}

/**
 * Validates and decodes an encoded trip payload string.
 * Recalculates all derived values and returns a safe TripDraft and PlanState.
 */
export function deserializeItinerary(encoded: string): DecodeResult {
  if (!encoded || typeof encoded !== 'string') {
    return { success: false, error: 'Empty share payload provided.', code: 'INVALID_DATA' };
  }

  if (encoded.length > MAX_SHARE_PAYLOAD_LENGTH) {
    return {
      success: false,
      error: `Share payload exceeds maximum supported length (${encoded.length} > ${MAX_SHARE_PAYLOAD_LENGTH}).`,
      code: 'OVERSIZED',
    };
  }

  let jsonStr: string;
  try {
    jsonStr = fromUrlSafeBase64(encoded);
  } catch (e) {
    return { success: false, error: 'Malformed share payload encoding.', code: 'MALFORMED' };
  }

  let raw: any;
  try {
    raw = JSON.parse(jsonStr);
  } catch (e) {
    return { success: false, error: 'Invalid JSON structure in share payload.', code: 'MALFORMED' };
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { success: false, error: 'Payload must be a JSON object.', code: 'INVALID_DATA' };
  }

  // Check version
  if (raw.v !== CURRENT_SHARE_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Unsupported itinerary version (${raw.v}). This link may have been generated by a different version of the application.`,
      code: 'UNSUPPORTED_VERSION',
    };
  }

  // Validate destination
  if (typeof raw.d !== 'string' || !raw.d) {
    return { success: false, error: 'Missing destination identifier in payload.', code: 'INVALID_DATA' };
  }
  const dest = getDestination(raw.d);
  if (!dest) {
    return {
      success: false,
      error: `Destination "${raw.d}" is not recognized or no longer supported.`,
      code: 'INVALID_DATA',
    };
  }

  // Validate dates
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!raw.in || typeof raw.in !== 'string' || !dateRegex.test(raw.in)) {
    return { success: false, error: 'Invalid departure date in share payload.', code: 'INVALID_DATA' };
  }
  if (!raw.out || typeof raw.out !== 'string' || !dateRegex.test(raw.out)) {
    return { success: false, error: 'Invalid return date in share payload.', code: 'INVALID_DATA' };
  }

  const nights = nightsBetween(raw.in, raw.out);
  if (nights < 1 || nights > 14) {
    return {
      success: false,
      error: `Invalid trip duration (${nights} nights). Supported duration is 1 to 14 nights.`,
      code: 'INVALID_DATA',
    };
  }

  // Validate numbers
  const adults = typeof raw.a === 'number' && raw.a >= 1 ? Math.min(20, Math.floor(raw.a)) : 2;
  const children = typeof raw.c === 'number' && raw.c >= 0 ? Math.min(10, Math.floor(raw.c)) : 0;
  const rooms = typeof raw.r === 'number' && raw.r >= 1 ? Math.min(10, Math.floor(raw.r)) : 1;
  const stayTier = (raw.st === 0 || raw.st === 1 || raw.st === 2) ? raw.st : 1;

  // Validate package
  const packageId = typeof raw.pkg === 'string' && CURATED_PACKAGES.some((p) => p.id === raw.pkg)
    ? raw.pkg
    : undefined;

  // Validate interests
  const interests: ActivityCategory[] = Array.isArray(raw.i)
    ? (raw.i.filter((item: any) =>
        ['Sightseeing', 'Culture', 'Adventure', 'Food', 'Wellness', 'Leisure'].includes(item)
      ) as ActivityCategory[])
    : ['Leisure', 'Culture'];

  // Validate cityIds
  const destCities = getCities(dest.id);
  const validCityIds = new Set(destCities.map((c) => c.id));
  const cityIds: string[] = Array.isArray(raw.cids)
    ? raw.cids.filter((cid: any) => typeof cid === 'string' && validCityIds.has(cid))
    : [];

  const timingPreference = typeof raw.tp === 'string' ? raw.tp.slice(0, 50) : 'Upcoming Month';

  // Construct draft
  const draftId = `shared-${Date.now()}`;
  const draft: TripDraft = {
    id: draftId,
    packageId,
    destinationId: dest.id,
    aiDestination: false,
    travellerType: adults === 1 && children === 0 ? 'solo' : adults === 2 && children === 0 ? 'couple' : children > 0 ? 'family' : 'friends',
    interests: interests.length > 0 ? interests : ['Leisure', 'Culture'],
    aiPlan: false,
    cityIds,
    aiCities: cityIds.length === 0,
    checkIn: raw.in,
    checkOut: raw.out,
    adults,
    children,
    rooms,
    stayTier,
    timingPreference,
  };

  // Validate days and activities
  const validActivityIds = new Set(dest.activities.map((a) => a.id));
  const expectedDays = tripDays(draft);
  const rawDays = Array.isArray(raw.days) ? raw.days : [];

  const basePlan = emptyPlan(draft);
  const reconstructedDays: string[][] = [];

  for (let d = 0; d < expectedDays; d++) {
    const dayActs = Array.isArray(rawDays[d]) ? rawDays[d] : [];
    // Only keep activities that genuinely exist in this destination's catalogue
    const sanitizedDayActs = dayActs.filter((id: any) => typeof id === 'string' && validActivityIds.has(id));
    reconstructedDays.push(sanitizedDayActs);
  }

  // Logistics
  const vehicle = typeof raw.veh === 'string' && raw.veh ? raw.veh.slice(0, 60) : undefined;
  const arrival = defaultArrival(draft);
  if (vehicle) arrival.vehicle = vehicle;

  const plan: PlanState = {
    signature: `${dest.id}|${expectedDays}`,
    days: reconstructedDays,
    extras: [],
    arrival,
    departure: defaultDeparture(draft, { ...basePlan, days: reconstructedDays }),
  };

  const curatedPkg = packageId ? CURATED_PACKAGES.find((p) => p.id === packageId) : null;
  const packageName = curatedPkg ? curatedPkg.name : `${expectedDays}-Day ${dest.name} Journey`;

  return {
    success: true,
    data: {
      draft,
      plan,
      packageName,
      isCuratedPackage: Boolean(curatedPkg),
    },
    payload: {
      v: CURRENT_SHARE_SCHEMA_VERSION,
      d: dest.id,
      pkg: packageId,
      in: raw.in,
      out: raw.out,
      a: adults,
      c: children,
      r: rooms,
      st: stayTier,
      tp: timingPreference,
      i: interests,
      cids: cityIds,
      days: reconstructedDays,
      veh: vehicle,
    },
  };
}

/**
 * Extracts the `trip` query parameter from a URL or window.location.search.
 */
export function getSharePayloadFromUrl(searchOrUrl?: string): string | null {
  try {
    let search = searchOrUrl;
    if (!search && typeof window !== 'undefined') {
      search = window.location.search;
    }
    if (!search) return null;

    if (search.startsWith('http://') || search.startsWith('https://')) {
      const parsedUrl = new URL(search);
      return parsedUrl.searchParams.get('trip');
    }

    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return params.get('trip');
  } catch {
    return null;
  }
}
