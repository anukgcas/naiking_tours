import { EnquiryCategory, PackageEnquiry, EnquirySubmissionResult } from '../types';

export const ENQUIRY_CATEGORIES: { id: EnquiryCategory; label: string; description: string }[] = [
  {
    id: 'general_info',
    label: 'General Package Enquiry',
    description: 'Inclusions, hotels, transfer logistics, and trip pace',
  },
  {
    id: 'discuss_package',
    label: 'Discuss This Package',
    description: 'Speak directly with our travel specialists about this specific package',
  },
  {
    id: 'coupon_availability',
    label: 'Coupon Availability',
    description: 'Inquire about available coupons, promo codes, and voucher redemptions',
  },
  {
    id: 'discount_eligibility',
    label: 'Discount Eligibility',
    description: 'Check eligibility for group, corporate, senior, or loyalty discounts',
  },
  {
    id: 'seasonal_offers',
    label: 'Seasonal Offers',
    description: 'Ask about seasonal promotions, off-peak rates, and seasonal travel perks',
  },
  {
    id: 'festive_offers',
    label: 'Festive Offers',
    description: 'Holiday season departures, festival celebrations, and special festive packages',
  },
  {
    id: 'callback_request',
    label: 'Request a Callback',
    description: 'Request a phone consultation to discuss this package or available offers',
  },
];

export interface EnquiryValidationErrors {
  fullName?: string;
  contact?: string;
  email?: string;
  phone?: string;
  category?: string;
  packageId?: string;
  message?: string;
}

export function validateEnquiryForm(
  data: Partial<PackageEnquiry>
): { isValid: boolean; errors: EnquiryValidationErrors } {
  const errors: EnquiryValidationErrors = {};

  // Validate Name
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }

  // Validate Package association
  if (!data.packageId || !data.packageName) {
    errors.packageId = 'Package context is missing. Please select a package.';
  }

  // Validate Category
  const validCategories: EnquiryCategory[] = [
    'general_info',
    'general_package',
    'discuss_package',
    'coupon_availability',
    'discount_eligibility',
    'seasonal_offers',
    'festive_offers',
    'callback_request',
    'coupons_discounts',
    'customization',
    'dates_availability',
    'other',
  ];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = 'Please select an enquiry category.';
  }

  const phoneClean = (data.phone || '').replace(/\D/g, '');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasValidEmail = Boolean(data.email && emailRegex.test(data.email.trim()));
  const hasValidPhone = phoneClean.length >= 10;

  // If user explicitly chose a callback request, a phone number is mandatory
  if (data.category === 'callback_request') {
    if (!hasValidPhone) {
      errors.phone = 'A valid phone number (at least 10 digits) is required for callback requests.';
    }
  } else {
    // For other categories, at least one valid contact method is required
    if (!hasValidEmail && !hasValidPhone) {
      errors.contact = 'Please provide either a valid phone number or email address so we can reach you.';
    }
  }

  // If email was entered, it must be valid
  if (data.email && data.email.trim().length > 0 && !hasValidEmail) {
    errors.email = 'Please enter a valid email address.';
  }

  // If phone was entered, it must have at least 10 digits
  if (data.phone && data.phone.trim().length > 0 && !hasValidPhone) {
    errors.phone = 'Please enter a valid phone number with at least 10 digits.';
  }

  // Validate optional message length (max 1000 characters)
  if (data.message && data.message.length > 1000) {
    errors.message = 'Message must not exceed 1000 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Live enquiry API endpoint if configured in environment
 */
const LIVE_ENQUIRY_ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENQUIRY_API_ENDPOINT) || '';

/**
 * Submits a package enquiry.
 *
 * In accordance with engineering rules:
 * - If a real backend endpoint is configured via VITE_ENQUIRY_API_ENDPOINT, it sends the request.
 * - If no live backend is provisioned, it transparently returns an honest `unsupported_backend`
 *   status explaining that backend integration is pending, without fabricating success.
 */
export async function submitPackageEnquiry(
  enquiry: PackageEnquiry
): Promise<EnquirySubmissionResult> {
  const { isValid, errors } = validateEnquiryForm(enquiry);
  if (!isValid) {
    return {
      success: false,
      status: 'validation_error',
      message: Object.values(errors)[0] || 'Please correct the highlighted fields.',
    };
  }

  // If a live configured endpoint exists, make the actual network request
  if (LIVE_ENQUIRY_ENDPOINT) {
    try {
      const response = await fetch(LIVE_ENQUIRY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enquiry),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          status: 'network_error',
          message:
            errorData?.message ||
            `Server returned error ${response.status}. Please try again later.`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: 'sent',
        message: data?.message || 'Your enquiry has been received by our travel team.',
        enquiryId: data?.enquiryId,
      };
    } catch (err) {
      console.error('[EnquiryService] Network error during submission:', err);
      return {
        success: false,
        status: 'network_error',
        message: 'Unable to reach the enquiry server. Please check your connection and retry.',
      };
    }
  }

  // Simulate short dispatch delay to test loading states and prevent double-clicks
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Honest report: No live CRM backend is provisioned yet in this repository
  return {
    success: false,
    status: 'unsupported_backend',
    message:
      'Your enquiry has been prepared locally, but cannot be transmitted through the current implementation because no live CRM or lead capture backend endpoint is configured. Your request has not been sent. You can contact our private concierge team directly at concierge@naikingtours.com.',
  };
}
