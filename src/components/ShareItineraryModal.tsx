import React, { useState, useEffect, useRef } from 'react';
import { PlanState, TripDraft } from '../types';
import { generateShareUrl } from '../services/shareService';
import { Check, Copy, Link, Printer, Share2, Shield, X, AlertCircle } from 'lucide-react';
import { getDestination, tripDays } from '../data/planner';
import { CURATED_PACKAGES } from './CuratedPackages';

interface ShareItineraryModalProps {
  draft: TripDraft;
  plan: PlanState;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void;
  onShowToast?: (msg: string) => void;
}

export const ShareItineraryModal: React.FC<ShareItineraryModalProps> = ({
  draft,
  plan,
  isOpen,
  onClose,
  onPrint,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dest = getDestination(draft.destinationId);
  const days = tripDays(draft);
  const curatedPkg = draft.packageId
    ? CURATED_PACKAGES.find((p) => p.id === draft.packageId)
    : null;
  const tripTitle = curatedPkg
    ? curatedPkg.name
    : `${days}-Day ${dest?.name || 'Custom'} Journey`;

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setErrorMessage(null);
      setFallbackMode(false);
      return;
    }

    const res = generateShareUrl(draft, plan);
    if (res.success) {
      setShareUrl(res.url);
      setErrorMessage(null);
    } else {
      setShareUrl('');
      setErrorMessage(res.error);
    }
  }, [isOpen, draft, plan]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        onShowToast?.('Shareable link copied to clipboard!');
        setTimeout(() => setCopied(false), 3000);
      } else {
        // Fallback for non-secure contexts or older browsers
        copyFallback();
      }
    } catch {
      // Clipboard permission denied or failed
      copyFallback();
    }
  };

  const copyFallback = () => {
    setFallbackMode(true);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          onShowToast?.('Shareable link copied!');
          setTimeout(() => setCopied(false), 3000);
        }
      } catch {
        // Leave input selected for manual Cmd+C / Ctrl+C
      }
    }
  };

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#16222E]/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#16222E]/8 flex items-center justify-between bg-[#F6F8FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EEF4F8] text-[#0B4A82] flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base font-bold text-[#16222E]">
                Share Itinerary
              </h2>
              <p className="text-xs text-[#6B7280]">Create a shareable link or print this journey</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-[#6B7280] hover:bg-[#16222E]/8 hover:text-[#16222E] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Trip Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#F6F8FA] border border-[#16222E]/8">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-[#0B4A82] uppercase tracking-wider block">
                  {dest?.name} · {days} Days
                </span>
                <h3 className="text-sm font-bold text-[#16222E] mt-0.5">{tripTitle}</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  {draft.adults} adult{draft.adults > 1 ? 's' : ''}
                  {draft.children > 0 ? `, ${draft.children} child${draft.children > 1 ? 'ren' : ''}` : ''} · {draft.checkIn} to {draft.checkOut}
                </p>
              </div>
            </div>
          </div>

          {/* Share Link Generation */}
          {errorMessage ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to generate share link</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="share-url-input" className="block text-xs font-semibold text-[#16222E] mb-1.5">
                Shareable Link (Encodes Itinerary Data)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Link className="w-3.5 h-3.5" />
                  </div>
                  <input
                    ref={inputRef}
                    id="share-url-input"
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={() => {
                      if (inputRef.current) inputRef.current.select();
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-[#F6F8FA] border border-[#16222E]/15 text-[#16222E] focus:outline-none focus:border-[#0B4A82] focus:ring-1 focus:ring-[#0B4A82]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#16222E] text-white hover:bg-[#0B4A82]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
              {fallbackMode && (
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Click the link above and press <kbd className="px-1 py-0.5 rounded bg-gray-100 border">Ctrl+C</kbd> / <kbd className="px-1 py-0.5 rounded bg-gray-100 border">⌘+C</kbd> to copy.
                </p>
              )}
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3 rounded-xl bg-[#EEF4F8] border border-[#0B4A82]/15 text-xs text-[#0B4A82]">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#0B4A82]" />
              <div className="leading-relaxed">
                <span className="font-bold">Privacy & Security: </span>
                Anyone with this URL can view the itinerary stops, dates, and calculated prices.
                No personal contact details, saved bookings, or private messages are included.
              </div>
            </div>
          </div>

          {/* Print / Save as PDF Alternative */}
          <div className="pt-2 border-t border-[#16222E]/8 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#16222E]">Need a physical or PDF copy?</p>
              <p className="text-[11px] text-[#6B7280]">
                Open browser print dialog and choose "Save as PDF".
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#16222E]/15 text-xs font-semibold text-[#16222E] hover:bg-[#F6F8FA] transition cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F6F8FA] border-t border-[#16222E]/8 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B4F55] hover:text-[#16222E] hover:bg-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
