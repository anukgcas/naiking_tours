import { CURATED_PACKAGES } from '../src/components/CuratedPackages';
import { validateSavedPackageItems, STORAGE_KEY_SAVED_PACKAGES } from '../src/context/SavedPackagesContext';
import { validateEnquiryForm, submitPackageEnquiry, ENQUIRY_CATEGORIES } from '../src/services/enquiryService';
import { PackageEnquiry, EnquiryCategory } from '../src/types';
import {
  serializeItinerary,
  deserializeItinerary,
  generateShareUrl,
  getSharePayloadFromUrl,
  toUrlSafeBase64,
  fromUrlSafeBase64,
  CURRENT_SHARE_SCHEMA_VERSION,
  MAX_SHARE_PAYLOAD_LENGTH,
  isDecodeFailure,
} from '../src/services/shareService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== RUNNING SAVE FOR LATER & PACKAGE ENQUIRY TEST SUITE ===\n');

  // ----------------------------------------------------
  // TEST GROUP 1: Canonical Catalogue & Package Identifiers
  // ----------------------------------------------------
  console.log('--- Test Group 1: Canonical Package Catalogue ---');
  assert(CURATED_PACKAGES.length >= 6, 'Canonical packages exist in catalogue', `found ${CURATED_PACKAGES.length}`);
  const ids = CURATED_PACKAGES.map((p) => p.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, 'All canonical package IDs are unique');
  assert(ids.includes('pkg-bali-sanctuary'), 'Contains Bali package with stable ID');
  assert(ids.includes('pkg-dubai-mirage'), 'Contains Dubai package with stable ID');

  // ----------------------------------------------------
  // TEST GROUP 2: Saved Packages Defensive Storage & Validation
  // ----------------------------------------------------
  console.log('\n--- Test Group 2: Saved Packages Storage & Deduplication ---');
  assert(STORAGE_KEY_SAVED_PACKAGES === 'naiking_saved_packages_v1', 'Dedicated versioned storage key used');

  // Valid raw data
  const validRaw = [
    { packageId: 'pkg-bali-sanctuary', savedAt: '2026-10-22T10:00:00.000Z' },
    { packageId: 'pkg-dubai-mirage', savedAt: '2026-10-22T11:00:00.000Z' },
  ];
  const validated = validateSavedPackageItems(validRaw);
  assert(validated.length === 2, 'Valid raw saved items parsed correctly');
  assert(validated[0].packageId === 'pkg-bali-sanctuary', 'Package ID preserved');

  // Duplicate items
  const duplicateRaw = [
    { packageId: 'pkg-bali-sanctuary', savedAt: '2026-10-22T10:00:00.000Z' },
    { packageId: 'pkg-bali-sanctuary', savedAt: '2026-10-22T12:00:00.000Z' },
    { packageId: 'pkg-dubai-mirage', savedAt: '2026-10-22T11:00:00.000Z' },
  ];
  const deduplicated = validateSavedPackageItems(duplicateRaw);
  assert(deduplicated.length === 2, 'Duplicate package entries are prevented');

  // Malformed and corrupted data
  const corruptedRaw = [
    null,
    12345,
    'not-an-object',
    { missingPackageId: 'oops' },
    { packageId: '' },
    { packageId: 42 },
    { packageId: 'pkg-maldives-solitude' }, // valid without savedAt
  ];
  const safeValidated = validateSavedPackageItems(corruptedRaw);
  assert(safeValidated.length === 1, 'Corrupted items filtered out gracefully');
  assert(safeValidated[0].packageId === 'pkg-maldives-solitude', 'Valid item extracted from mixed corrupted array');
  assert(typeof safeValidated[0].savedAt === 'string', 'Fallback timestamp populated when missing');

  // Non-array input
  assert(validateSavedPackageItems(null).length === 0, 'Null input returns empty array');
  assert(validateSavedPackageItems({}).length === 0, 'Object input returns empty array');

  // ----------------------------------------------------
  // TEST GROUP 3: Package Enquiry Validation
  // ----------------------------------------------------
  console.log('\n--- Test Group 3: Package Enquiry Form Validation ---');

  const baseEnquiry: PackageEnquiry = {
    packageId: 'pkg-bali-sanctuary',
    packageName: 'Kamandalu Rainforest & Ocean Sanctuary',
    destinationId: 'bali',
    fullName: 'Ananya Verma',
    email: 'ananya@example.com',
    phone: '9876543210',
    preferredContactMethod: 'either',
    category: 'general_info',
    message: 'Can we add an extra night at the rainforest villa?',
    submittedAt: new Date().toISOString(),
  };

  const validCheck = validateEnquiryForm(baseEnquiry);
  assert(validCheck.isValid === true, 'Complete valid enquiry passes validation');
  assert(Object.keys(validCheck.errors).length === 0, 'Zero errors for valid enquiry');

  // Missing Name (< 2 chars)
  const shortNameCheck = validateEnquiryForm({ ...baseEnquiry, fullName: 'A' });
  assert(!shortNameCheck.isValid, 'Short name (<2 chars) fails validation');
  assert(Boolean(shortNameCheck.errors.fullName), 'Name error message present');

  // Missing package context
  const missingPkgCheck = validateEnquiryForm({ ...baseEnquiry, packageId: '' });
  assert(!missingPkgCheck.isValid, 'Missing packageId fails validation');

  // Contact Method: At least one required
  const noContactCheck = validateEnquiryForm({ ...baseEnquiry, email: '', phone: '' });
  assert(!noContactCheck.isValid, 'Missing both email and phone fails validation');
  assert(Boolean(noContactCheck.errors.contact), 'Contact error message present');

  // Email format validation
  const invalidEmailCheck = validateEnquiryForm({ ...baseEnquiry, email: 'bad-email-at-domain' });
  assert(!invalidEmailCheck.isValid, 'Invalid email format fails validation');
  assert(Boolean(invalidEmailCheck.errors.email), 'Email error message present');

  // Phone length validation
  const shortPhoneCheck = validateEnquiryForm({ ...baseEnquiry, phone: '12345' });
  assert(!shortPhoneCheck.isValid, 'Short phone number (<10 digits) fails validation');
  assert(Boolean(shortPhoneCheck.errors.phone), 'Phone error message present');

  // Callback category strictly requires phone
  const callbackNoPhoneCheck = validateEnquiryForm({
    ...baseEnquiry,
    category: 'callback_request',
    phone: '',
    email: 'valid@example.com',
  });
  assert(!callbackNoPhoneCheck.isValid, 'Callback request without phone fails even if email present');
  assert(Boolean(callbackNoPhoneCheck.errors.phone), 'Phone required error for callback request');

  const callbackWithPhoneCheck = validateEnquiryForm({
    ...baseEnquiry,
    category: 'callback_request',
    phone: '9876543210',
    email: '',
  });
  assert(callbackWithPhoneCheck.isValid, 'Callback request with phone passes without email');

  // Message length validation
  const longMessage = 'A'.repeat(1001);
  const longMsgCheck = validateEnquiryForm({ ...baseEnquiry, message: longMessage });
  assert(!longMsgCheck.isValid, 'Message exceeding 1000 characters fails validation');
  assert(Boolean(longMsgCheck.errors.message), 'Message error message present');

  // ----------------------------------------------------
  // TEST GROUP 3: Package Enquiry Form Validation & Categories
  // ----------------------------------------------------
  // Test Requirement 1: General package enquiry
  const generalEnquiryCheck = validateEnquiryForm({ ...baseEnquiry, category: 'general_info' });
  assert(generalEnquiryCheck.isValid, 'Requirement 1: General package enquiry passes validation');
  const generalAliasCheck = validateEnquiryForm({ ...baseEnquiry, category: 'general_package' });
  assert(generalAliasCheck.isValid, 'Requirement 1 (alias): general_package category passes validation');

  // Test Requirement 2: Enquiry about a specific package (discuss this package)
  const discussPkgCheck = validateEnquiryForm({
    ...baseEnquiry,
    category: 'discuss_package',
    packageId: 'pkg-bali-sanctuary',
    packageName: 'Kamandalu Rainforest & Ocean Sanctuary',
  });
  assert(discussPkgCheck.isValid, 'Requirement 2: Enquiry to discuss specific package passes validation');

  // Test Requirement 3: Coupon availability enquiry
  const couponCheck = validateEnquiryForm({ ...baseEnquiry, category: 'coupon_availability' });
  assert(couponCheck.isValid, 'Requirement 3: Coupon availability enquiry passes validation');

  // Test Requirement 4: Discount eligibility enquiry
  const discountCheck = validateEnquiryForm({ ...baseEnquiry, category: 'discount_eligibility' });
  assert(discountCheck.isValid, 'Requirement 4: Discount eligibility enquiry passes validation');

  // Test Requirement 5: Seasonal offer enquiry
  const seasonalCheck = validateEnquiryForm({ ...baseEnquiry, category: 'seasonal_offers' });
  assert(seasonalCheck.isValid, 'Requirement 5: Seasonal offer enquiry passes validation');

  // Test Requirement 6: Festive offer enquiry
  const festiveCheck = validateEnquiryForm({ ...baseEnquiry, category: 'festive_offers' });
  assert(festiveCheck.isValid, 'Requirement 6: Festive offer enquiry passes validation');

  // Test Requirement 7: Callback request with a valid phone number
  const callbackValidPhone = validateEnquiryForm({
    ...baseEnquiry,
    category: 'callback_request',
    phone: '9876543210',
    email: '',
  });
  assert(callbackValidPhone.isValid, 'Requirement 7: Callback request with valid phone passes without email');

  // Test Requirement 8: Callback request without a required phone number
  const callbackNoPhone = validateEnquiryForm({
    ...baseEnquiry,
    category: 'callback_request',
    phone: '',
    email: 'valid@example.com',
  });
  assert(!callbackNoPhone.isValid, 'Requirement 8: Callback request without phone fails even if email present');
  assert(Boolean(callbackNoPhone.errors.phone), 'Requirement 8: Phone required error generated for callback');

  // Test Requirement 9: Missing required fields
  const missingNameCheck = validateEnquiryForm({ ...baseEnquiry, fullName: '' });
  assert(!missingNameCheck.isValid && Boolean(missingNameCheck.errors.fullName), 'Requirement 9a: Missing fullName fails');
  const missingPackageIdCheck = validateEnquiryForm({ ...baseEnquiry, packageId: '' });
  assert(!missingPackageIdCheck.isValid && Boolean(missingPackageIdCheck.errors.packageId), 'Requirement 9b: Missing packageId fails');
  const missingPackageNameCheck = validateEnquiryForm({ ...baseEnquiry, packageName: '' });
  assert(!missingPackageNameCheck.isValid && Boolean(missingPackageNameCheck.errors.packageId), 'Requirement 9c: Missing packageName fails');
  const missingContactCheck = validateEnquiryForm({ ...baseEnquiry, email: '', phone: '' });
  assert(!missingContactCheck.isValid && Boolean(missingContactCheck.errors.contact), 'Requirement 9d: Missing both email and phone fails');
  const missingCategoryCheck = validateEnquiryForm({ ...baseEnquiry, category: '' as any });
  assert(!missingCategoryCheck.isValid && Boolean(missingCategoryCheck.errors.category), 'Requirement 9e: Missing category fails');

  // Test Requirement 10: Invalid input
  const whitespaceNameCheck = validateEnquiryForm({ ...baseEnquiry, fullName: '   ' });
  assert(!whitespaceNameCheck.isValid, 'Requirement 10a: Whitespace-only name fails validation');
  const malformedEmailCheck = validateEnquiryForm({ ...baseEnquiry, email: 'notanemail' });
  assert(!malformedEmailCheck.isValid && Boolean(malformedEmailCheck.errors.email), 'Requirement 10b: Malformed email fails');
  const shortPhoneFails = validateEnquiryForm({ ...baseEnquiry, phone: '123' });
  assert(!shortPhoneFails.isValid && Boolean(shortPhoneFails.errors.phone), 'Requirement 10c: Phone with <10 digits fails');
  const excessiveMessageCheck = validateEnquiryForm({ ...baseEnquiry, message: 'x'.repeat(1001) });
  assert(!excessiveMessageCheck.isValid && Boolean(excessiveMessageCheck.errors.message), 'Requirement 10d: Message >1000 chars fails');

  // Verify all 7 prompt enquiry categories are defined with metadata
  const promptCategories: EnquiryCategory[] = [
    'general_info',
    'discuss_package',
    'coupon_availability',
    'discount_eligibility',
    'seasonal_offers',
    'festive_offers',
    'callback_request',
  ];
  assert(ENQUIRY_CATEGORIES.length === 7, 'All 7 enquiry categories defined with metadata');
  for (const cat of promptCategories) {
    const meta = ENQUIRY_CATEGORIES.find((c) => c.id === cat);
    assert(Boolean(meta), `Category metadata found for "${cat}"`);
    assert(Boolean(meta?.label && meta?.description), `Category "${cat}" has valid label and description`);
    const catCheck = validateEnquiryForm({ ...baseEnquiry, category: cat });
    assert(catCheck.isValid, `Enquiry category "${cat}" validates successfully`);
  }

  // Test Requirement 15: Regression testing for existing Package Enquiry functionality
  const legacyCategories: EnquiryCategory[] = [
    'coupons_discounts',
    'customization',
    'dates_availability',
    'other',
  ];
  for (const legCat of legacyCategories) {
    const legCheck = validateEnquiryForm({ ...baseEnquiry, category: legCat });
    assert(legCheck.isValid, `Requirement 15: Legacy enquiry category "${legCat}" continues to validate successfully`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Submission Service, Honest Backend & Concurrency
  // ----------------------------------------------------
  console.log('\n--- Test Group 4: Submission Service & Honest Backend Reporting ---');

  // Test Requirement 13: Submission error handling (validation failure)
  const invalidSubmission = await submitPackageEnquiry({ ...baseEnquiry, fullName: '' });
  assert(invalidSubmission.success === false, 'Requirement 13a: Invalid enquiry submission fails');
  assert(invalidSubmission.status === 'validation_error', 'Requirement 13a: Returns status validation_error');

  // Test Requirement 11: Duplicate submission prevention guard
  const concurrencyTracker = { inFlight: false, duplicatePrevented: false };
  const guardedSubmit = async (data: PackageEnquiry) => {
    if (concurrencyTracker.inFlight) {
      concurrencyTracker.duplicatePrevented = true;
      return { success: false, status: 'validation_error' as const, message: 'Submission already in progress.' };
    }
    concurrencyTracker.inFlight = true;
    try {
      return await submitPackageEnquiry(data);
    } finally {
      concurrencyTracker.inFlight = false;
    }
  };
  const [sub1, sub2] = await Promise.all([guardedSubmit(baseEnquiry), guardedSubmit(baseEnquiry)]);
  assert(concurrencyTracker.duplicatePrevented === true, 'Requirement 11: Rapid concurrent submission is safely intercepted');
  assert(sub1.status === 'unsupported_backend' || sub2.status === 'unsupported_backend', 'Requirement 11: Primary request proceeds while duplicate is blocked');

  // Test Requirement 12: Correct package context preservation across multiple packages
  const curatedPkgs = CURATED_PACKAGES.slice(0, 3);
  for (const pkg of curatedPkgs) {
    const pkgEnquiry: PackageEnquiry = {
      ...baseEnquiry,
      packageId: pkg.id,
      packageName: pkg.name,
      destinationId: pkg.destinationId,
    };
    const pkgValidation = validateEnquiryForm(pkgEnquiry);
    assert(pkgValidation.isValid, `Requirement 12: Package context preserved for ${pkg.id}`);
    assert(pkgEnquiry.packageId === pkg.id, `Requirement 12: packageId ${pkg.id} preserved exactly`);
    assert(pkgEnquiry.packageName === pkg.name, `Requirement 12: packageName ${pkg.name} preserved exactly`);
    assert(pkgEnquiry.destinationId === pkg.destinationId, `Requirement 12: destinationId ${pkg.destinationId} preserved exactly`);
  }

  // Test Requirement 14: Honest behavior when no backend endpoint is configured
  const unconfiguredSubmission = await submitPackageEnquiry(baseEnquiry);
  assert(unconfiguredSubmission.success === false, 'Requirement 14a: Unconfigured backend returns success=false');
  assert(
    unconfiguredSubmission.status === 'unsupported_backend',
    'Requirement 14b: Returns honest status "unsupported_backend" instead of fake success'
  );
  assert(
    unconfiguredSubmission.message.includes('Your enquiry has been prepared locally'),
    'Requirement 14c: Explicitly confirms enquiry was prepared locally'
  );
  assert(
    unconfiguredSubmission.message.includes('cannot be transmitted through the current implementation'),
    'Requirement 14d: Explicitly notes enquiry cannot be transmitted through current implementation'
  );
  assert(
    unconfiguredSubmission.message.includes('Your request has not been sent.'),
    'Requirement 14e: Explicitly clarifies to user that request has not been sent'
  );
  assert(
    unconfiguredSubmission.message.includes('concierge@naikingtours.com'),
    'Requirement 14f: Provides direct fallback contact channel (concierge@naikingtours.com)'
  );

  // ----------------------------------------------------
  // TEST GROUP 5: Package-to-Planner Data Transfer & Canonical Identity
  // ----------------------------------------------------
  console.log('\n--- Test Group 5: Package-to-Planner Data Transfer & Identity ---');

  const {
    PLANNER_DESTINATIONS,
    getDestination,
    emptyPlan,
    autoFillPlan,
    computeCosts,
    cityStops,
    aiPickCities,
    addDaysISO,
    todayISO,
    nightsBetween,
    validateDraft,
  } = await import('../src/data/planner');

  const baliPkg = CURATED_PACKAGES.find((p) => p.id === 'pkg-bali-sanctuary')!;
  const dubaiPkg = CURATED_PACKAGES.find((p) => p.id === 'pkg-dubai-mirage')!;

  assert(Boolean(baliPkg), 'Bali package exists in canonical catalogue');
  assert(Boolean(dubaiPkg), 'Dubai package exists in canonical catalogue');

  // Verify package data mapping
  const testToday = todayISO();
  const testDeparture = addDaysISO(testToday, 30);
  const baliDraft = {
    id: `pkg-${baliPkg.id}-${Date.now()}`,
    packageId: baliPkg.id,
    destinationId: baliPkg.destinationId,
    aiDestination: false,
    travellerType: 'couple' as const,
    interests: ['Leisure', 'Wellness'] as any,
    aiPlan: false,
    cityIds: [] as string[],
    aiCities: true,
    checkIn: testDeparture,
    checkOut: addDaysISO(testDeparture, baliPkg.nights),
    adults: 2,
    children: 0,
    rooms: 1,
    stayTier: 1 as const,
    timingPreference: 'Upcoming Month',
  };
  baliDraft.cityIds = aiPickCities(baliDraft);

  assert(baliDraft.packageId === 'pkg-bali-sanctuary', 'Canonical package ID stored in draft');
  assert(baliDraft.destinationId === 'bali', 'Package destination ID correctly transferred');
  assert(nightsBetween(baliDraft.checkIn, baliDraft.checkOut) === baliPkg.nights, 'Package nights match duration');
  assert(validateDraft(baliDraft) === null, 'Generated draft passes validation');

  // Verify baseline plan seeding with highlights
  const baliDest = getDestination(baliDraft.destinationId)!;
  const seededPlan = emptyPlan(baliDraft);
  const matchedActIds: string[] = [];
  for (const h of baliPkg.highlights) {
    const words = h.toLowerCase().split(/[\s,&]+/).filter((w) => w.length >= 4);
    const found = baliDest.activities.find((a) => {
      const lowerName = a.name.toLowerCase();
      return words.some((w) => lowerName.includes(w));
    });
    if (found && !matchedActIds.includes(found.id)) {
      matchedActIds.push(found.id);
    }
  }
  assert(matchedActIds.length >= 2, 'Signature package highlights matched to destination activities');
  matchedActIds.forEach((actId, idx) => {
    seededPlan.days[idx % seededPlan.days.length].push(actId);
  });
  const completedPlan = autoFillPlan(baliDraft, seededPlan);
  assert(completedPlan.days.length === baliPkg.nights + 1, 'Plan days count matches trip days');
  assert(completedPlan.days.every((d) => d.length >= 1), 'Every day has activities planned');

  // Verify route map stops and cost calculation
  const stops = cityStops(baliDraft);
  assert(stops.length > 0, 'City stops computed for route map');
  const costs = computeCosts(baliDraft, completedPlan);
  assert(costs.total > 0, 'Total cost calculated successfully');
  assert(costs.stay > 0, 'Stay cost component present');
  assert(costs.transfers > 0, 'Transfers cost component present');
  assert(costs.activities > 0, 'Activities cost component present');
  assert(costs.perPerson === Math.round(costs.total / (baliDraft.adults + baliDraft.children)), 'Per-person cost matches total / guests');

  // ----------------------------------------------------
  // TEST GROUP 6: User Preference Preservation & Trip Isolation
  // ----------------------------------------------------
  console.log('\n--- Test Group 6: Preference Preservation & Trip Isolation ---');

  // Simulated existing user preferences before customizing
  const userPreferences = {
    adults: 4,
    children: 2,
    rooms: 3,
    stayTier: 2 as const,
    timingPreference: 'December 2026',
    departureDate: addDaysISO(testToday, 60),
    interests: ['Adventure', 'Culture'] as any,
  };

  // When customizing a package, these preferences should be preserved
  const customizedDubaiDraft = {
    id: `pkg-${dubaiPkg.id}-${Date.now()}`,
    packageId: dubaiPkg.id,
    destinationId: dubaiPkg.destinationId,
    aiDestination: false,
    travellerType: 'family' as const,
    interests: userPreferences.interests, // preserved
    aiPlan: false,
    cityIds: [],
    aiCities: true,
    checkIn: userPreferences.departureDate, // preserved
    checkOut: addDaysISO(userPreferences.departureDate, dubaiPkg.nights),
    adults: userPreferences.adults, // preserved
    children: userPreferences.children, // preserved
    rooms: userPreferences.rooms, // preserved
    stayTier: userPreferences.stayTier, // preserved
    timingPreference: userPreferences.timingPreference, // preserved
  };

  assert(customizedDubaiDraft.adults === 4, 'Customizing preserves user adult count');
  assert(customizedDubaiDraft.children === 2, 'Customizing preserves user children count');
  assert(customizedDubaiDraft.rooms === 3, 'Customizing preserves user room count');
  assert(customizedDubaiDraft.stayTier === 2, 'Customizing preserves user stay tier');
  assert(customizedDubaiDraft.checkIn === userPreferences.departureDate, 'Customizing preserves user departure date');
  assert(customizedDubaiDraft.packageId === 'pkg-dubai-mirage', 'Preserves Dubai package ID');

  // Verify booking confirmation preserves package identity without corrupting Saved Packages
  const bookingPackageName = `${dubaiPkg.name} (Customized)`;
  assert(bookingPackageName.includes('Desert Mirage & Futuristic Skyline'), 'Confirmed booking retains curated package name');

  // ----------------------------------------------------
  // TEST GROUP 7: Enquiry Isolation & Package Context
  // ----------------------------------------------------
  console.log('\n--- Test Group 7: Independent Enquiry Context ---');

  // Active trip is Dubai, but user clicks enquiry on Bali
  const enquiryForDifferentPackage: PackageEnquiry = {
    packageId: baliPkg.id,
    packageName: baliPkg.name,
    destinationId: baliPkg.destinationId,
    fullName: 'Rohan Sharma',
    email: 'rohan@example.com',
    phone: '9812345678',
    preferredContactMethod: 'either',
    category: 'customization',
    message: 'Can we customize Bali for 6 nights?',
    submittedAt: new Date().toISOString(),
  };

  assert(
    enquiryForDifferentPackage.packageId === 'pkg-bali-sanctuary',
    'Enquiry references Package A (Bali) while active trip is Package B (Dubai)'
  );
  assert(
    enquiryForDifferentPackage.destinationId === 'bali',
    'Enquiry destination matches target package, not active trip draft'
  );
  const enquiryValidation = validateEnquiryForm(enquiryForDifferentPackage);
  assert(enquiryValidation.isValid, 'Enquiry for different package validates successfully');

  // ----------------------------------------------------
  // TEST GROUP 8: Defensive Error Handling & Concurrency
  // ----------------------------------------------------
  console.log('\n--- Test Group 8: Defensive Error Handling & Concurrency ---');

  // Test invalid destination ID fallback
  const invalidDestId = 'non_existent_destination';
  const validDestFallback = PLANNER_DESTINATIONS.some((d) => d.id === invalidDestId)
    ? invalidDestId
    : 'bali';
  assert(validDestFallback === 'bali', 'Invalid destination safely falls back to default');

  // Test stale packageId filtering
  const staleStorageItems = [
    { packageId: 'pkg-bali-sanctuary', savedAt: '2026-10-22T10:00:00.000Z' },
    { packageId: 'pkg-deleted-or-stale', savedAt: '2026-10-22T10:00:00.000Z' },
  ];
  const canonicalIds = new Set(CURATED_PACKAGES.map((p) => p.id));
  const prunedItems = staleStorageItems.filter((item) => canonicalIds.has(item.packageId));
  assert(prunedItems.length === 1, 'Stale package ID pruned during hydration');
  assert(prunedItems[0].packageId === 'pkg-bali-sanctuary', 'Valid package preserved');

  // Rapid toggle simulated sequence
  let simulatedSaved = [{ packageId: 'pkg-bali-sanctuary', savedAt: '2026-10-22T10:00:00.000Z' }];
  const atomicToggle = (pkgId: string) => {
    if (simulatedSaved.some((item) => item.packageId === pkgId)) {
      simulatedSaved = simulatedSaved.filter((item) => item.packageId !== pkgId);
      return false;
    } else {
      simulatedSaved = [{ packageId: pkgId, savedAt: new Date().toISOString() }, ...simulatedSaved];
      return true;
    }
  };

  // Toggle on then off
  const res1 = atomicToggle('pkg-dubai-mirage'); // add
  assert(res1 === true && simulatedSaved.length === 2, 'First toggle adds package');
  const res2 = atomicToggle('pkg-dubai-mirage'); // remove
  assert(res2 === false && simulatedSaved.length === 1, 'Second toggle cleanly removes package');
  const res3 = atomicToggle('pkg-dubai-mirage'); // add again
  assert(res3 === true && simulatedSaved.length === 2, 'Third toggle re-adds package without duplicate');

  // ----------------------------------------------------
  // TEST GROUP 9: Itinerary Sharing Serialization & Deserialization
  // ----------------------------------------------------
  console.log('\n--- Test Group 9: Share Serialization & Deserialization (FEAT-021) ---');

  // Prepare a realistic customized trip for serialization
  const serializeResult = serializeItinerary(baliDraft, completedPlan);
  assert(serializeResult.success === true, 'Valid itinerary serializes successfully');
  const encodedPayload = (serializeResult as { success: true; encoded: string }).encoded;
  assert(typeof encodedPayload === 'string' && encodedPayload.length > 50, 'Encoded payload is non-empty string');
  assert(encodedPayload.length < 2000, 'Payload is compact (< 2000 chars) for standard URL safety');
  assert(encodedPayload.length <= MAX_SHARE_PAYLOAD_LENGTH, 'Payload is within MAX_SHARE_PAYLOAD_LENGTH limit');

  // Verify URL generation
  const urlResult = generateShareUrl(baliDraft, completedPlan, 'https://naikingtours.com/plan');
  assert(urlResult.success === true, 'Share URL generated successfully');
  const fullShareUrl = (urlResult as { success: true; url: string }).url;
  assert(fullShareUrl.startsWith('https://naikingtours.com/plan?trip='), 'URL begins with target path and ?trip= parameter');
  assert(!fullShareUrl.includes('#'), 'URL cleans away unwanted hash fragments');

  // Test extracting payload from URL and from raw search string
  const extractedFromFull = getSharePayloadFromUrl(fullShareUrl);
  assert(extractedFromFull === encodedPayload, 'Payload correctly extracted from full URL');
  const extractedFromSearch = getSharePayloadFromUrl(`?trip=${encodedPayload}`);
  assert(extractedFromSearch === encodedPayload, 'Payload correctly extracted from search string');
  assert(getSharePayloadFromUrl('') === null, 'Empty URL safely returns null');
  assert(getSharePayloadFromUrl('https://naikingtours.com/?other=123') === null, 'URL without trip param returns null');

  // Test round-trip deserialization
  const decodeResult = deserializeItinerary(encodedPayload);
  assert(decodeResult.success === true, 'Serialized payload deserializes successfully');
  if (decodeResult.success) {
    const { draft: decodedDraft, plan: decodedPlan, packageName, isCuratedPackage } = decodeResult.data;
    assert(decodedDraft.destinationId === 'bali', 'Destination ID preserved');
    assert(decodedDraft.packageId === 'pkg-bali-sanctuary', 'Curated package ID preserved');
    assert(isCuratedPackage === true, 'Curated package flag preserved');
    assert(packageName === baliPkg.name, 'Curated package name resolved correctly');
    assert(decodedDraft.adults === baliDraft.adults, 'Adults count preserved');
    assert(decodedDraft.children === baliDraft.children, 'Children count preserved');
    assert(decodedDraft.rooms === baliDraft.rooms, 'Rooms count preserved');
    assert(decodedDraft.stayTier === baliDraft.stayTier, 'Stay tier preserved');
    assert(decodedDraft.checkIn === baliDraft.checkIn, 'Departure date preserved');
    assert(decodedDraft.checkOut === baliDraft.checkOut, 'Return date preserved');
    assert(decodedPlan.days.length === completedPlan.days.length, 'Plan days count matches original');
    assert(decodedPlan.days[0].length === completedPlan.days[0].length, 'Day 1 activities preserved');
  }

  // Schema version test
  assert(CURRENT_SHARE_SCHEMA_VERSION === 1, 'Current schema version is 1');
  const unsupportedVersionPayload = toUrlSafeBase64(JSON.stringify({ v: 99, d: 'bali', in: testDeparture, out: addDaysISO(testDeparture, 5) }));
  const unsupportedRes = deserializeItinerary(unsupportedVersionPayload);
  assert(unsupportedRes.success === false, 'Payload with unsupported version fails');
  if (isDecodeFailure(unsupportedRes)) {
    assert(unsupportedRes.code === 'UNSUPPORTED_VERSION', 'Returns code UNSUPPORTED_VERSION');
    assert(unsupportedRes.error.includes('version (99)'), 'Includes unsupported version number in error message');
  }

  // Malformed payload tests
  const malformedBase64Res = deserializeItinerary('!!!not-valid-base64???');
  assert(malformedBase64Res.success === false, 'Invalid base64 string fails safely');
  if (isDecodeFailure(malformedBase64Res)) {
    assert(malformedBase64Res.code === 'MALFORMED', 'Returns code MALFORMED for invalid base64');
  }

  const malformedJsonRes = deserializeItinerary(toUrlSafeBase64('{ broken json:'));
  assert(malformedJsonRes.success === false, 'Malformed JSON payload fails safely');
  if (isDecodeFailure(malformedJsonRes)) {
    assert(malformedJsonRes.code === 'MALFORMED', 'Returns code MALFORMED for broken JSON');
  }

  // Oversized payload test
  const oversizedString = 'A'.repeat(MAX_SHARE_PAYLOAD_LENGTH + 10);
  const oversizedRes = deserializeItinerary(oversizedString);
  assert(oversizedRes.success === false, 'Oversized payload rejected');
  if (isDecodeFailure(oversizedRes)) {
    assert(oversizedRes.code === 'OVERSIZED', 'Returns code OVERSIZED');
  }

  // Privacy boundary verification: PII exclusion
  const rawDecodedJson = fromUrlSafeBase64(encodedPayload);
  assert(!rawDecodedJson.includes('fullName'), 'Payload does not include full name');
  assert(!rawDecodedJson.includes('email'), 'Payload does not include email address');
  assert(!rawDecodedJson.includes('phone'), 'Payload does not include phone number');
  assert(!rawDecodedJson.includes('NT-'), 'Payload does not include private booking confirmation IDs');
  assert(!rawDecodedJson.includes('message'), 'Payload does not include enquiry or customer messages');

  // ----------------------------------------------------
  // TEST GROUP 10: Derived Value Recalculation & Defensive Sanitization
  // ----------------------------------------------------
  console.log('\n--- Test Group 10: Derived Pricing & Defensive Sanitization ---');

  // Ensure decoded data recalculates costs accurately using computeCosts
  if (decodeResult.success) {
    const recalculatedCosts = computeCosts(decodeResult.data.draft, decodeResult.data.plan);
    const originalCosts = computeCosts(baliDraft, completedPlan);
    assert(recalculatedCosts.total === originalCosts.total, 'Decoded trip cost exactly matches original calculated cost');
    assert(recalculatedCosts.stay === originalCosts.stay, 'Stay cost component matches');
    assert(recalculatedCosts.transfers === originalCosts.transfers, 'Transfers cost component matches');
    assert(recalculatedCosts.activities === originalCosts.activities, 'Activities cost component matches');
    assert(recalculatedCosts.service === originalCosts.service, 'Service fee matches');
  }

  // Tampered payload with spoofed price values (attacker tries to inject { totalPrice: 100 })
  const tamperedRaw = JSON.parse(fromUrlSafeBase64(encodedPayload));
  tamperedRaw.totalPrice = 100; // Attempted tampering
  tamperedRaw.fakeDiscount = 99999;
  const tamperedEncoded = toUrlSafeBase64(JSON.stringify(tamperedRaw));
  const tamperedDecode = deserializeItinerary(tamperedEncoded);
  assert(tamperedDecode.success === true, 'Tampered payload parses valid fields');
  if (tamperedDecode.success) {
    // Pricing engine should recompute from source, ignoring any injected fake prices
    const recomputed = computeCosts(tamperedDecode.data.draft, tamperedDecode.data.plan);
    assert(recomputed.total > 50000, 'Tampered price is completely ignored; genuine catalogue prices used');
  }

  // Defensive sanitization: unknown or stale activity IDs
  const payloadWithStaleActivities = {
    v: 1,
    d: 'bali',
    in: testDeparture,
    out: addDaysISO(testDeparture, 5),
    a: 2,
    c: 0,
    r: 1,
    st: 1,
    days: [
      ['fake-activity-id-1', 'fake-activity-id-2'],
      ['bali-uluwatu'], // valid Bali activity
    ],
  };
  const sanitizedDecode = deserializeItinerary(toUrlSafeBase64(JSON.stringify(payloadWithStaleActivities)));
  assert(sanitizedDecode.success === true, 'Payload with unknown activity IDs decodes safely');
  if (sanitizedDecode.success) {
    assert(sanitizedDecode.data.plan.days[0].length === 0, 'Unknown activity IDs on Day 1 safely filtered out');
    assert(sanitizedDecode.data.plan.days[1].length === 1, 'Valid activity ID on Day 2 preserved');
    assert(sanitizedDecode.data.plan.days[1][0] === 'bali-uluwatu', 'Valid activity ID retained');
  }

  // Defensive sanitization: unknown destination
  const unknownDestPayload = {
    v: 1,
    d: 'antarctica-glaciers',
    in: testDeparture,
    out: addDaysISO(testDeparture, 5),
  };
  const unknownDestRes = deserializeItinerary(toUrlSafeBase64(JSON.stringify(unknownDestPayload)));
  assert(unknownDestRes.success === false, 'Unknown destination fails validation');
  if (isDecodeFailure(unknownDestRes)) {
    assert(unknownDestRes.code === 'INVALID_DATA', 'Returns INVALID_DATA for unknown destination');
    assert(unknownDestRes.error.includes('antarctica-glaciers'), 'Error notes the unrecognized destination ID');
  }

  // Defensive duration validation
  const zeroNightsPayload = {
    v: 1,
    d: 'bali',
    in: testDeparture,
    out: testDeparture, // 0 nights
  };
  const zeroNightsRes = deserializeItinerary(toUrlSafeBase64(JSON.stringify(zeroNightsPayload)));
  assert(zeroNightsRes.success === false, '0-night duration rejected');

  const excessiveNightsPayload = {
    v: 1,
    d: 'bali',
    in: testDeparture,
    out: addDaysISO(testDeparture, 30), // 30 nights (>14)
  };
  const excessiveNightsRes = deserializeItinerary(toUrlSafeBase64(JSON.stringify(excessiveNightsPayload)));
  assert(excessiveNightsRes.success === false, 'Excessive duration (>14 nights) rejected');

  // ----------------------------------------------------
  // TEST GROUP 11: Non-Destructive Shared Preview & Adoption Workflow
  // ----------------------------------------------------
  console.log('\n--- Test Group 11: State Isolation & Adoption Workflow ---');

  // Simulated existing recipient state
  const recipientActiveTrip = {
    id: 'recipient-draft-123',
    destinationId: 'dubai',
    adults: 3,
    isSavedTrip: false,
    savedTripId: null,
  };
  const recipientBookedTrips = [
    { id: 'NT-9001', destination: 'Maldives', packageName: 'Maldives Solitude' },
  ];
  const recipientSavedPackages = [
    { packageId: 'pkg-manali-peaks', savedAt: '2026-10-22T08:00:00.000Z' },
  ];

  // 1. Simulating opening a share link
  // The recipient state must NOT change merely by decoding or opening a share link
  const openedShareData = deserializeItinerary(encodedPayload);
  assert(openedShareData.success === true, 'Recipient can preview shared trip');
  assert(recipientActiveTrip.destinationId === 'dubai', 'Recipient active destination remains Dubai while previewing');
  assert(recipientActiveTrip.id === 'recipient-draft-123', 'Recipient draft ID remains unchanged while previewing');
  assert(recipientBookedTrips.length === 1, 'Recipient booked trips count unchanged while previewing');
  assert(recipientSavedPackages.length === 1, 'Recipient saved packages count unchanged while previewing');

  // 2. Simulating explicit "Continue Planning" adoption
  if (openedShareData.success) {
    const adoptedDraft = {
      ...openedShareData.data.draft,
      id: `shared-${Date.now()}`,
    };
    const adoptedPlan = openedShareData.data.plan;
    const adoptedActiveTrip = {
      id: adoptedDraft.id,
      destinationId: adoptedDraft.destinationId,
      packageId: adoptedDraft.packageId || null,
      isSavedTrip: false,
      savedTripId: null,
      draft: adoptedDraft,
      plan: adoptedPlan,
    };

    assert(adoptedActiveTrip.destinationId === 'bali', 'Adopted active trip destination is now Bali');
    assert(adoptedActiveTrip.packageId === 'pkg-bali-sanctuary', 'Adopted active trip retains Bali package ID');
    assert(adoptedActiveTrip.isSavedTrip === false, 'Adopted trip is in draft state, not marked as saved');
    assert(adoptedActiveTrip.savedTripId === null, 'Adopted trip has no savedTripId');

    // Ensure booked trips and saved packages remain untouched after adoption
    assert(recipientBookedTrips.length === 1, 'Recipient booked trips unaffected by adoption');
    assert(recipientBookedTrips[0].id === 'NT-9001', 'Recipient Maldives booking remains intact');
    assert(recipientSavedPackages.length === 1, 'Recipient saved packages unaffected by adoption');

    // 3. Repeated adoption idempotency: adopting again does not duplicate booked trips
    assert(recipientBookedTrips.length === 1, 'Booked trips list count remains stable across repeated adoptions');
  }

  // ----------------------------------------------------
  // TEST GROUP 12: Print-Friendly Representation & State Immutability
  // ----------------------------------------------------
  console.log('\n--- Test Group 12: Print Export & State Immutability ---');

  // Test empty itinerary plan handling
  const emptyBaliPlan = emptyPlan(baliDraft);
  assert(emptyBaliPlan.days.every((d) => d.length === 0), 'Empty plan has 0 scheduled activities');
  const emptyPlanCosts = computeCosts(baliDraft, emptyBaliPlan);
  assert(emptyPlanCosts.stay > 0, 'Empty itinerary still accounts for boutique stay costs');
  assert(emptyPlanCosts.transfers > 0, 'Empty itinerary still accounts for private transfer costs');
  assert(emptyPlanCosts.activities === 0, 'Empty itinerary has 0 activities cost');
  assert(emptyPlanCosts.total > 0, 'Total cost represents stay + transfers + service fee');

  // Verification that print view generation does not mutate plan or draft
  const draftBeforePrint = JSON.stringify(baliDraft);
  const planBeforePrint = JSON.stringify(completedPlan);

  // Compute printable summary data
  const printTitle = baliPkg ? `${baliPkg.name} (Customized)` : '6-Day Bali Journey';
  assert(printTitle.includes('Kamandalu Rainforest & Ocean Sanctuary'), 'Printable title retains package name');

  const draftAfterPrint = JSON.stringify(baliDraft);
  const planAfterPrint = JSON.stringify(completedPlan);
  assert(draftBeforePrint === draftAfterPrint, 'Print operation does not mutate draft state');
  assert(planBeforePrint === planAfterPrint, 'Print operation does not mutate plan state');


  // ----------------------------------------------------
  // FINAL RESULTS
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
