import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react';
import { CuratedPackage } from './CuratedPackages';
import { formatINR } from '../data/planner';
import {
  ENQUIRY_CATEGORIES,
  submitPackageEnquiry,
  validateEnquiryForm,
  EnquiryValidationErrors,
} from '../services/enquiryService';
import { EnquiryCategory, EnquirySubmissionResult, PackageEnquiry } from '../types';

interface PackageEnquiryModalProps {
  pkg: CuratedPackage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PackageEnquiryModal: React.FC<PackageEnquiryModalProps> = ({
  pkg,
  isOpen,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'either'>('either');
  const [category, setCategory] = useState<EnquiryCategory>('general_info');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<EnquiryValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<EnquirySubmissionResult | null>(null);
  const isSubmittingRef = useRef(false);

  // Reset form when modal opens or package changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSubmissionResult(null);
    }
  }, [isOpen, pkg?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isSubmittingRef.current) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !pkg) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingRef.current) return;

    const enquiryData: PackageEnquiry = {
      packageId: pkg.id,
      packageName: pkg.name,
      destinationId: pkg.destinationId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferredContactMethod: preferredContact,
      category,
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    };

    const validation = validateEnquiryForm(enquiryData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await submitPackageEnquiry(enquiryData);
      setSubmissionResult(result);
    } catch {
      setSubmissionResult({
        success: false,
        status: 'network_error',
        message: 'An unexpected error occurred during submission. Please retry.',
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = ENQUIRY_CATEGORIES.find((c) => c.id === category);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#16222E]/10 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#16222E]/8 flex items-start justify-between gap-4 bg-[#F6F8FA]/60">
          <div className="min-w-0">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#0B4A82] mb-1">
              Package Enquiry & Consultation
            </span>
            <h3 id="enquiry-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#16222E] truncate">
              {pkg.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#0B4A82]" />
                {pkg.duration}
              </span>
              <span>•</span>
              <span className="font-semibold text-[#16222E]">
                From {formatINR(pkg.pricePerPerson)}
              </span>
              <span className="text-[11px]">/ person</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 -mr-2 -mt-1 rounded-full text-[#6B7280] hover:text-[#16222E] hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close enquiry modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 max-h-[75vh] overflow-y-auto">
          {/* Confirmed Real Success State */}
          {submissionResult && submissionResult.success && submissionResult.status === 'sent' ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-[#16222E]">Enquiry Received</h4>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
                Thank you, {fullName}. Your enquiry regarding{' '}
                <span className="font-semibold text-[#16222E]">{pkg.name}</span> has been logged with reference{' '}
                <span className="font-mono font-semibold text-[#0B4A82]">{submissionResult.enquiryId || 'ENQ-PENDING'}</span>.
                Our concierge will reach out via your preferred channel within 24 hours.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setFullName('');
                    setEmail('');
                    setPhone('');
                    setMessage('');
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#16222E] text-white text-sm font-semibold hover:bg-[#0B4A82] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Honest Backend Integration Banner if submission was attempted without live backend */}
              {submissionResult && submissionResult.status === 'unsupported_backend' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm space-y-2">
                  <div className="flex items-start gap-2.5 font-semibold text-amber-950">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                    <span>Online Submission Unavailable — Request Not Sent</span>
                  </div>
                  <p className="leading-relaxed text-amber-800">
                    {submissionResult.message}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 text-xs font-semibold">
                    <a
                      href="mailto:concierge@naikingtours.com"
                      className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300 text-amber-950 transition-colors"
                    >
                      concierge@naikingtours.com
                    </a>
                  </div>
                </div>
              )}

              {/* General error banner */}
              {submissionResult && submissionResult.status === 'network_error' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{submissionResult.message}</span>
                </div>
              )}

              {/* Full Name Field */}
              <div>
                <label htmlFor="enquiry-name" className="block text-xs font-semibold text-[#16222E] mb-1.5">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="enquiry-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="e.g. Priyanshu Sharma"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                    errors.fullName
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-[#16222E]/15 focus:border-[#0B4A82] focus:ring-1 focus:ring-[#0B4A82]'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Enquiry Category Select */}
              <div>
                <label htmlFor="enquiry-category" className="block text-xs font-semibold text-[#16222E] mb-1.5">
                  What would you like to enquire about? <span className="text-rose-500">*</span>
                </label>
                <select
                  id="enquiry-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as EnquiryCategory);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#16222E]/15 text-sm bg-white focus:border-[#0B4A82] focus:ring-1 focus:ring-[#0B4A82] transition-all outline-none"
                  disabled={isSubmitting}
                >
                  {ENQUIRY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {selectedCategoryMeta && (
                  <p className="mt-1 text-[11px] text-[#6B7280]">
                    {selectedCategoryMeta.description}
                  </p>
                )}
              </div>

              {/* Contact Method Selector & Inputs */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#16222E]">
                    Contact Information <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#6B7280]">
                    {category === 'callback_request' ? 'Phone required for callbacks' : 'Provide phone or email'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone || errors.contact) {
                            setErrors((prev) => ({ ...prev, phone: undefined, contact: undefined }));
                          }
                        }}
                        placeholder="Phone (e.g. 98765 43210)"
                        className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                          errors.phone
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : 'border-[#16222E]/15 focus:border-[#0B4A82]'
                        }`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email || errors.contact) {
                            setErrors((prev) => ({ ...prev, email: undefined, contact: undefined }));
                          }
                        }}
                        placeholder="Email (e.g. user@example.com)"
                        className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                          errors.email
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : 'border-[#16222E]/15 focus:border-[#0B4A82]'
                        }`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {errors.contact && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.contact}</span>
                  </p>
                )}

                {/* Preferred Contact Method Pills */}
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="text-[#6B7280]">Preferred response:</span>
                  <div className="flex items-center gap-2">
                    {(['either', 'phone', 'email'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPreferredContact(method)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                          preferredContact === method
                            ? 'bg-[#16222E] text-white'
                            : 'bg-[#F6F8FA] text-[#6B7280] hover:text-[#16222E]'
                        }`}
                        disabled={isSubmitting}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Question / Message Textarea */}
              <div>
                <label htmlFor="enquiry-message" className="block text-xs font-semibold text-[#16222E] mb-1.5">
                  Message or Specific Inquiries <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="enquiry-message"
                  rows={3}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  placeholder="Mention any custom requests, travel dates, coupon codes you wish to verify, or specific questions about the villa or transfers..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none resize-none ${
                    errors.message
                      ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                      : 'border-[#16222E]/15 focus:border-[#0B4A82] focus:ring-1 focus:ring-[#0B4A82]'
                  }`}
                  disabled={isSubmitting}
                  maxLength={1000}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#16222E]/8">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#6B7280] hover:text-[#16222E] hover:bg-[#F6F8FA] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#16222E] text-white text-xs sm:text-sm font-semibold hover:bg-[#0B4A82] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {category === 'callback_request' ? 'Request Callback' : 'Submit Enquiry'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
