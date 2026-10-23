import React, { useEffect } from 'react';
import { X, Bookmark, ArrowRight, Trash2, Clock, Sparkles, MessageSquare } from 'lucide-react';
import { CuratedPackage } from './CuratedPackages';
import { formatINR } from '../data/planner';

interface SavedPackagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPackages: CuratedPackage[];
  onRemovePackage: (packageId: string) => void;
  onSelectPackage: (pkg: CuratedPackage) => void;
  onEnquirePackage: (pkg: CuratedPackage) => void;
  onExplorePackages: () => void;
}

export const SavedPackagesDrawer: React.FC<SavedPackagesDrawerProps> = ({
  isOpen,
  onClose,
  savedPackages,
  onRemovePackage,
  onSelectPackage,
  onEnquirePackage,
  onExplorePackages,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-packages-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#16222E]/10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 pt-7 pb-6 border-b border-[#16222E]/8 flex items-start justify-between gap-4 bg-white">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0B4A82]/10 text-[#0B4A82] text-xs font-semibold mb-1">
              <Bookmark className="w-3 h-3 fill-current" />
              <span>Saved For Later</span>
            </div>
            <h3 id="saved-packages-title" className="text-2xl font-semibold tracking-tight text-[#16222E]">
              Saved Packages
            </h3>
            <p className="mt-1 text-[14px] text-[#6B7280] font-medium">
              Your bookmarked signature journeys and retreat ideas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#16222E]/5 text-[#6B7280] hover:text-[#16222E] transition-colors duration-200 cursor-pointer"
            aria-label="Close Saved Packages"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pt-4 pb-6 space-y-4">
          {savedPackages.length > 0 ? (
            savedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#16222E]/8 shadow-xs hover:border-[#16222E]/15 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Image & Header info */}
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold">
                        {pkg.category}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
                          <Clock className="w-3 h-3 text-[#0B4A82]" />
                          <span>{pkg.duration}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemovePackage(pkg.id)}
                          className="p-1 rounded-lg text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove from saved"
                          aria-label={`Remove ${pkg.name} from saved packages`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="mt-1 text-base font-semibold leading-snug text-[#16222E] line-clamp-2">
                        {pkg.name}
                      </h4>

                      <div className="mt-1">
                        <span className="text-xs text-[#6B7280]">From </span>
                        <span className="text-sm font-bold text-[#16222E]">
                          {formatINR(pkg.pricePerPerson)}
                        </span>
                        <span className="text-[10px] text-[#6B7280]"> / person</span>
                      </div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="mt-3 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                    {pkg.tagline}
                  </p>

                  {/* Inclusions */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pkg.inclusions.slice(0, 2).map((inc) => (
                      <span
                        key={inc}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F6F8FA] text-[#16222E]/80 border border-[#16222E]/6"
                      >
                        {inc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions row */}
                <div className="mt-4 pt-3 border-t border-[#16222E]/6 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEnquirePackage(pkg);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#16222E]/15 text-[#16222E] text-xs font-medium hover:bg-[#F6F8FA] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0B4A82]" />
                    <span>Enquire</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectPackage(pkg);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16222E] hover:bg-[#0B4A82] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Customise</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#16222E]/8">
              <div className="w-12 h-12 rounded-full bg-[#0B4A82]/10 text-[#0B4A82] flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-[#16222E]">
                No saved packages yet
              </h4>
              <p className="text-xs text-[#6B7280] mt-1.5 mb-5 max-w-xs mx-auto leading-relaxed">
                Click the bookmark icon on any curated package to save it here. Review or customize it whenever you're ready.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExplorePackages();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#16222E] text-white text-xs font-semibold hover:bg-[#0B4A82] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Curated Packages</span>
              </button>
            </div>
          )}
        </div>

        {/* Concierge Support Footnote */}
        <div className="px-5 sm:px-7 py-5 bg-white border-t border-[#16222E]/8 text-center text-xs text-[#6B7280]">
          <span>Need custom arrangements?</span>{' '}
          <a
            href="mailto:concierge@naikingtours.com"
            className="whitespace-nowrap text-[#0B4A82] font-medium hover:underline"
          >
            Contact Private Concierge
          </a>
        </div>
      </div>
    </div>
  );
};
