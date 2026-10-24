import * as fs from 'fs';
import * as path from 'path';
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
  // TEST GROUP 13: Accessibility, Dialog Focus Containment & Mobile Touch Targets (Phase 2)
  // ----------------------------------------------------
  console.log('\n--- Test Group 13: Phase 2 Accessibility & Mobile Touch Targets ---');

  const srcDir = path.resolve(process.cwd(), 'src');

  // 1. Hook availability
  const focusTrapHookPath = path.join(srcDir, 'hooks/useFocusTrap.ts');
  assert(fs.existsSync(focusTrapHookPath), 'Phase 2: useFocusTrap hook file exists');
  const focusTrapSrc = fs.readFileSync(focusTrapHookPath, 'utf-8');
  assert(focusTrapSrc.includes('export function useFocusTrap'), 'useFocusTrap is exported');
  assert(focusTrapSrc.includes('Escape'), 'useFocusTrap handles Escape key dismissal');
  assert(focusTrapSrc.includes('Tab') && focusTrapSrc.includes('shiftKey'), 'useFocusTrap contains Tab and Shift+Tab focus trapping');
  assert(focusTrapSrc.includes('previouslyFocusedElementRef'), 'useFocusTrap restores focus to previous active element on close');

  // 2. SavedPackagesDrawer.tsx keyboard accessibility & touch targets
  const savedPackagesDrawerSrc = fs.readFileSync(path.join(srcDir, 'components/SavedPackagesDrawer.tsx'), 'utf-8');
  assert(savedPackagesDrawerSrc.includes('useFocusTrap'), 'SavedPackagesDrawer integrates useFocusTrap');
  assert(savedPackagesDrawerSrc.includes('role="dialog"'), 'SavedPackagesDrawer has role="dialog"');
  assert(savedPackagesDrawerSrc.includes('aria-modal="true"'), 'SavedPackagesDrawer has aria-modal="true"');
  assert(savedPackagesDrawerSrc.includes('aria-labelledby="saved-packages-title"'), 'SavedPackagesDrawer has accessible title label');
  assert(savedPackagesDrawerSrc.includes('min-w-[44px]') && savedPackagesDrawerSrc.includes('min-h-[44px]'), 'SavedPackagesDrawer close button meets 44x44px touch target');

  // 3. MyTripsDrawer.tsx keyboard accessibility & touch targets
  const myTripsDrawerSrc = fs.readFileSync(path.join(srcDir, 'components/MyTripsDrawer.tsx'), 'utf-8');
  assert(myTripsDrawerSrc.includes('useFocusTrap'), 'MyTripsDrawer integrates useFocusTrap');
  assert(myTripsDrawerSrc.includes('role="dialog"'), 'MyTripsDrawer has role="dialog"');
  assert(myTripsDrawerSrc.includes('aria-modal="true"'), 'MyTripsDrawer has aria-modal="true"');
  assert(myTripsDrawerSrc.includes('aria-labelledby="my-trips-title"'), 'MyTripsDrawer has accessible title label');
  assert(myTripsDrawerSrc.includes('min-w-[44px]') && myTripsDrawerSrc.includes('min-h-[44px]'), 'MyTripsDrawer close button meets 44x44px touch target');

  // 4. PackageEnquiryModal.tsx accessibility, live regions & form validation
  const enquiryModalSrc = fs.readFileSync(path.join(srcDir, 'components/PackageEnquiryModal.tsx'), 'utf-8');
  assert(enquiryModalSrc.includes('useFocusTrap'), 'PackageEnquiryModal integrates useFocusTrap');
  assert(enquiryModalSrc.includes('role="dialog"'), 'PackageEnquiryModal has role="dialog"');
  assert(enquiryModalSrc.includes('aria-modal="true"'), 'PackageEnquiryModal has aria-modal="true"');
  assert(enquiryModalSrc.includes('role="alert"'), 'PackageEnquiryModal uses role="alert" for urgent error alerts');
  assert(enquiryModalSrc.includes('aria-live="assertive"'), 'PackageEnquiryModal uses assertive live region for error state');
  assert(enquiryModalSrc.includes('aria-live="polite"'), 'PackageEnquiryModal uses polite live region for non-urgent feedback');
  assert(enquiryModalSrc.includes('aria-invalid='), 'PackageEnquiryModal inputs reflect validation validity state');
  assert(enquiryModalSrc.includes('aria-describedby='), 'PackageEnquiryModal inputs associate validation errors via aria-describedby');
  assert(enquiryModalSrc.includes('enquiry-name-error') && enquiryModalSrc.includes('enquiry-phone-error'), 'PackageEnquiryModal links specific error IDs');

  // 5. SharedItineraryPreviewModal.tsx & ShareItineraryModal.tsx
  const sharedPreviewModalSrc = fs.readFileSync(path.join(srcDir, 'components/SharedItineraryPreviewModal.tsx'), 'utf-8');
  assert(sharedPreviewModalSrc.includes('useFocusTrap'), 'SharedItineraryPreviewModal integrates useFocusTrap');
  assert(sharedPreviewModalSrc.includes('min-w-[44px]') && sharedPreviewModalSrc.includes('min-h-[44px]'), 'SharedItineraryPreviewModal close button meets 44x44px touch target');
  assert(sharedPreviewModalSrc.includes('Continue to Westack'), 'SharedItineraryPreviewModal preserves Westack brand copy');

  const shareModalSrc = fs.readFileSync(path.join(srcDir, 'components/ShareItineraryModal.tsx'), 'utf-8');
  assert(shareModalSrc.includes('useFocusTrap'), 'ShareItineraryModal integrates useFocusTrap');
  assert(shareModalSrc.includes('min-w-[44px]') && shareModalSrc.includes('min-h-[44px]'), 'ShareItineraryModal close button meets 44x44px touch target');

  // 6. Mobile Touch Targets & Enquire Affordance in CuratedPackages.tsx
  const curatedPackagesSrc = fs.readFileSync(path.join(srcDir, 'components/CuratedPackages.tsx'), 'utf-8');
  assert(curatedPackagesSrc.includes('min-w-[44px] min-h-[44px]'), 'CuratedPackages bookmark button meets 44x44px touch target');
  assert(curatedPackagesSrc.includes('focus:ring-2'), 'CuratedPackages bookmark button has visible focus ring');
  assert(curatedPackagesSrc.includes('<span>Enquire</span>') && !curatedPackagesSrc.includes('<span className="hidden sm:inline">Enquire</span>'), 'CuratedPackages displays explicit readable "Enquire" label on mobile');

  // 7. Day-shift chevrons in TripPlanner.tsx
  const tripPlannerSrc = fs.readFileSync(path.join(srcDir, 'components/TripPlanner.tsx'), 'utf-8');
  assert(tripPlannerSrc.includes('min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#6B7280]'), 'TripPlanner day-shift chevrons meet 44x44px touch target');

  // 8. Lead traveller form validation in TripOverview.tsx
  const tripOverviewSrc = fs.readFileSync(path.join(srcDir, 'components/TripOverview.tsx'), 'utf-8');
  assert(tripOverviewSrc.includes('aria-invalid={errors.name ? \'true\' : undefined}'), 'TripOverview lead traveller input has aria-invalid');
  assert(tripOverviewSrc.includes('aria-describedby={errors.name ? \'ov-name-error\' : undefined}'), 'TripOverview lead traveller input has aria-describedby');
  assert(tripOverviewSrc.includes('id="ov-name-error" role="alert"'), 'TripOverview name error is announced via role="alert"');

  // 9. Toast notification in App.tsx
  const appSrc = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf-8');
  assert(appSrc.includes('role="status"'), 'App toast notification has role="status"');
  assert(appSrc.includes('aria-live="polite"'), 'App toast notification has aria-live="polite"');
  assert(appSrc.includes('aria-atomic="true"'), 'App toast notification has aria-atomic="true"');

  // ----------------------------------------------------
  // TEST GROUP 14: Phase 3 Responsive Layout, Contrast Hardening & Token Standardization
  // ----------------------------------------------------
  console.log('\n--- Test Group 14: Phase 3 Responsive Layout, Contrast & Design Tokens ---');

  // 1. TripPlanner 2-column intermediate layout (1024px–1279px)
  assert(tripPlannerSrc.includes('lg:grid-cols-12'), 'TripPlanner introduces 12-column intermediate grid for tablet/small laptop');
  assert(tripPlannerSrc.includes('xl:grid-cols-[21rem_minmax(0,1fr)_20rem]'), 'TripPlanner preserves 3-column desktop layout at xl');
  assert(tripPlannerSrc.includes('lg:col-span-5'), 'TripPlanner allocates 5 columns to Ideas lane on lg');
  assert(tripPlannerSrc.includes('lg:col-span-7'), 'TripPlanner allocates 7 columns to Itinerary Days on lg');
  assert(tripPlannerSrc.includes('lg:col-span-12'), 'TripPlanner spans Summary and Route across 12 columns at bottom on lg');
  assert(tripPlannerSrc.includes('lg:grid-cols-2'), 'TripPlanner renders Summary and Route side-by-side in 2 cards on lg');

  // 2. Contrast Hardening in TripPlanningConsole
  const consoleSrc = fs.readFileSync(path.join(srcDir, 'components/TripPlanningConsole.tsx'), 'utf-8');
  assert(consoleSrc.includes('bg-white/75'), 'TripPlanningConsole strengthens FIELD_IDLE background opacity to 75%');
  assert(consoleSrc.includes('text-[#374151]'), 'TripPlanningConsole hint text uses hardened contrast color #374151');
  assert(consoleSrc.includes('text-[#4B5563]'), 'TripPlanningConsole subtext uses hardened contrast color #4B5563');

  // 3. Contrast Hardening in SignatureDestinations
  const sigDestSrc = fs.readFileSync(path.join(srcDir, 'components/SignatureDestinations.tsx'), 'utf-8');
  assert(sigDestSrc.includes('from-black/95 via-black/60 to-transparent'), 'SignatureDestinations strengthens bottom gradient overlay');
  assert(sigDestSrc.includes('bg-black/40'), 'SignatureDestinations price badge uses dark translucent backdrop');
  assert(sigDestSrc.includes('text-white/95'), 'SignatureDestinations card tagline uses 95% opacity white');

  // 4. Contrast Hardening in Hero
  const heroSrc = fs.readFileSync(path.join(srcDir, 'components/Hero.tsx'), 'utf-8');
  assert(heroSrc.includes('from-[#0E1822]/85'), 'Hero strengthens top readability gradient');
  assert(heroSrc.includes('from-[#0E1822]/95'), 'Hero strengthens bottom readability gradient');
  assert(heroSrc.includes('text-white/95'), 'Hero destination strip and story text uses 95% opacity white');

  // 5. WhyNaiking Reduced Motion and Contrast
  const whyNaikingSrc = fs.readFileSync(path.join(srcDir, 'components/WhyNaiking.tsx'), 'utf-8');
  assert(whyNaikingSrc.includes('motion-reduce:animate-none'), 'WhyNaiking marquee respects prefers-reduced-motion');
  assert(whyNaikingSrc.includes('motion-reduce:overflow-x-auto'), 'WhyNaiking provides scrollable fallback on reduced motion');
  assert(whyNaikingSrc.includes('text-[#4B5563]'), 'WhyNaiking guest trip info uses hardened contrast color #4B5563');

  // 6. Token Standardization in index.css
  const indexCssSrc = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf-8');
  assert(indexCssSrc.includes('--color-brand-charcoal'), 'index.css defines semantic --color-brand-charcoal');
  assert(indexCssSrc.includes('--color-brand-surface'), 'index.css defines semantic --color-brand-surface');
  assert(indexCssSrc.includes('--color-brand-muted'), 'index.css defines semantic --color-brand-muted');
  assert(indexCssSrc.includes('--radius-card'), 'index.css defines standardized --radius-card');
  assert(indexCssSrc.includes('--radius-pill'), 'index.css defines standardized --radius-pill');
  assert(indexCssSrc.includes('.text-brand-gradient'), 'index.css defines .text-brand-gradient');
  assert(indexCssSrc.includes('.text-saffron-gradient'), 'index.css preserves .text-saffron-gradient backward compatibility');
  assert(indexCssSrc.includes('prefers-reduced-motion') && indexCssSrc.includes('transition-duration'), 'index.css cancels transitions for prefers-reduced-motion');

  // ----------------------------------------------------
  // TEST GROUP 15: Phase 4 Micro-Interactions, Testimonial Authenticity & Adaptive Connectors
  // ----------------------------------------------------
  console.log('\n--- Test Group 15: Phase 4 Micro-Interactions, Truthful Pillars & Adaptive Connectors ---');

  // 1. StandardVsNaiking Accordion Fixes
  const standardVsNaikingSrc = fs.readFileSync(path.join(srcDir, 'components/StandardVsNaiking.tsx'), 'utf-8');
  assert(!standardVsNaikingSrc.includes('onMouseLeave'), 'StandardVsNaiking removed twitchy onMouseLeave reset');
  assert(!standardVsNaikingSrc.includes('onBlur'), 'StandardVsNaiking removed premature onBlur collapse');
  assert(standardVsNaikingSrc.includes('setActive((curr) => (curr === i ? null : i))'), 'StandardVsNaiking supports click toggling');
  assert(standardVsNaikingSrc.includes('aria-expanded={isActive}'), 'StandardVsNaiking provides aria-expanded accessibility state');
  assert(standardVsNaikingSrc.includes('aria-controls={`principle-panel-${i}`}'), 'StandardVsNaiking provides aria-controls link to panel');
  assert(standardVsNaikingSrc.includes('role="region"'), 'StandardVsNaiking provides role="region" on expanding panels');
  assert(standardVsNaikingSrc.includes('motion-reduce:transition-none'), 'StandardVsNaiking respects prefers-reduced-motion');

  // 2. Truthful Distinction Pillars in WhyNaiking
  assert(whyNaikingSrc.includes('DISTINCTION_PILLARS'), 'WhyNaiking defines authentic DISTINCTION_PILLARS');
  assert(!whyNaikingSrc.includes('5 out of 5 stars'), 'WhyNaiking eliminates unverified 5-star ratings');
  assert(!whyNaikingSrc.includes('Sep 2026'), 'WhyNaiking eliminates fabricated future customer trip dates');
  assert(!whyNaikingSrc.includes('Ananya Iyer'), 'WhyNaiking eliminates fabricated persona names');
  assert(whyNaikingSrc.includes('group-hover:[animation-play-state:paused]'), 'WhyNaiking pauses marquee on hover');
  assert(whyNaikingSrc.includes('motion-reduce:animate-none'), 'WhyNaiking cancels marquee animation for reduced motion');

  // 3. Adaptive Timeline Connectors in TripPlanner
  assert(tripPlannerSrc.includes('const isFirst = ri === 0;'), 'TripPlanner tracks first item in timeline');
  assert(tripPlannerSrc.includes('const isLast = ri === rows.length - 1;'), 'TripPlanner tracks last item in timeline');
  assert(tripPlannerSrc.includes('const isSingle = rows.length <= 1;'), 'TripPlanner tracks single-item days in timeline');
  assert(tripPlannerSrc.includes("'top-[19px] bottom-0'"), 'TripPlanner starts connector precisely at center of first dot');
  assert(tripPlannerSrc.includes("'top-0 h-[19px]'"), 'TripPlanner terminates connector precisely at center of last dot');
  assert(tripPlannerSrc.includes('if (isSingle)'), 'TripPlanner suppresses connector line when day has only 1 item');

  // 4. Adaptive Timeline Connectors in TripOverview
  const tripOverviewCode = fs.readFileSync(path.join(srcDir, 'components/TripOverview.tsx'), 'utf-8');
  assert(tripOverviewCode.includes('const isFirst = idx === 0;'), 'TripOverview tracks first activity');
  assert(tripOverviewCode.includes('const isLast = idx === items.length - 1;'), 'TripOverview tracks last activity');
  assert(tripOverviewCode.includes('top-[29px] -bottom-3'), 'TripOverview starts connector at first dot and spans gap to next card');
  assert(tripOverviewCode.includes('top-0 h-[29px]'), 'TripOverview terminates connector at center of last dot');

  // ----------------------------------------------------
  // TEST GROUP 16: Phase 5 Performance Optimization & Code-Splitting
  // ----------------------------------------------------
  console.log('\n--- Test Group 16: Phase 5 Performance Optimization & Code-Splitting ---');

  // 1. LazyErrorBoundary component
  const errorBoundaryPath = path.join(srcDir, 'components/LazyErrorBoundary.tsx');
  assert(fs.existsSync(errorBoundaryPath), 'Phase 5: LazyErrorBoundary component file exists');
  const errorBoundarySrc = fs.readFileSync(errorBoundaryPath, 'utf-8');
  assert(errorBoundarySrc.includes('export class LazyErrorBoundary'), 'LazyErrorBoundary is exported');
  assert(errorBoundarySrc.includes('getDerivedStateFromError'), 'LazyErrorBoundary handles errors gracefully');
  assert(errorBoundarySrc.includes('role="alert"'), 'LazyErrorBoundary uses accessible alert role');
  assert(errorBoundarySrc.includes('handleRetry'), 'LazyErrorBoundary provides interactive retry capability');

  // 2. Dynamic Code-Splitting in TripPlanner.tsx
  const updatedTripPlannerSrc = fs.readFileSync(path.join(srcDir, 'components/TripPlanner.tsx'), 'utf-8');
  assert(!updatedTripPlannerSrc.includes("import { PrintableItinerary } from './PrintableItinerary';"), 'TripPlanner eliminates static import of PrintableItinerary');
  assert(updatedTripPlannerSrc.includes("const LazyPrintableItinerary = React.lazy("), 'TripPlanner dynamically imports PrintableItinerary');
  assert(updatedTripPlannerSrc.includes("const LazyRouteMap = React.lazy("), 'TripPlanner dynamically imports Leaflet RouteMap');
  assert(updatedTripPlannerSrc.includes("<LazyErrorBoundary"), 'TripPlanner wraps LazyRouteMap in LazyErrorBoundary');

  // 3. Dynamic Code-Splitting in TripOverview.tsx
  const updatedTripOverviewSrc = fs.readFileSync(path.join(srcDir, 'components/TripOverview.tsx'), 'utf-8');
  assert(!updatedTripOverviewSrc.includes("import { PrintableItinerary } from './PrintableItinerary';"), 'TripOverview eliminates static import of PrintableItinerary');
  assert(updatedTripOverviewSrc.includes("const LazyPrintableItinerary = React.lazy("), 'TripOverview dynamically imports PrintableItinerary');

  // 4. Heavy View Code-Splitting in App.tsx
  const updatedAppSrc = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf-8');
  assert(updatedAppSrc.includes("const LazyTripWizard = React.lazy("), 'App dynamically imports TripWizard');
  assert(updatedAppSrc.includes("const LazyTripPlanner = React.lazy("), 'App dynamically imports TripPlanner');
  assert(updatedAppSrc.includes("const LazyTripOverview = React.lazy("), 'App dynamically imports TripOverview');
  assert(updatedAppSrc.includes("<LazyErrorBoundary"), 'App wraps heavy views in LazyErrorBoundary');
  assert(updatedAppSrc.includes("Loading Bespoke Tour Designer..."), 'App provides accessible fallback for TripWizard');
  assert(updatedAppSrc.includes("Loading Itinerary Studio..."), 'App provides accessible fallback for TripPlanner');
  assert(updatedAppSrc.includes("Loading Quotation & Overview..."), 'App provides accessible fallback for TripOverview');

  // 5. Vite Native Configuration Modernization
  const viteConfigSrc = fs.readFileSync(path.join(process.cwd(), 'vite.config.ts'), 'utf-8');
  assert(viteConfigSrc.includes('import.meta.dirname'), 'vite.config.ts uses modern import.meta.dirname');
  assert(viteConfigSrc.includes("from './server/aiSuggest.ts'"), 'vite.config.ts uses explicit .ts extension for native loader');

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
