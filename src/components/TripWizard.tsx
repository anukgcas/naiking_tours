import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Heart,
  Landmark,
  MapPin,
  Minus,
  Mountain,
  PartyPopper,
  Palmtree,
  Plus,
  Sparkles,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { ActivityCategory, TravellerType, TripDraft } from '../types';
import {
  MAX_TRIP_DAYS,
  PLANNER_DESTINATIONS,
  addDaysISO,
  formatDate,
  getDestination,
  nightsBetween,
  pickDestinationForMe,
  todayISO,
} from '../data/planner';
import { SIGNATURE_DESTINATIONS } from '../data/mockData';

interface TripWizardProps {
  initialDraft: TripDraft;
  /** 0 Where · 1 Who · 2 Interests · 3 When */
  initialStep: number;
  onComplete: (draft: TripDraft) => void;
  onExit: () => void;
}

const STEP_LABELS = ['Where', 'Who', 'Interests', 'When'];

const TRAVELLER_TYPES: {
  id: TravellerType;
  label: string;
  hint: string;
  icon: React.ReactNode;
  adults: number;
  children: number;
}[] = [
  { id: 'solo', label: 'Solo', hint: 'Just me', icon: <User className="w-6 h-6" />, adults: 1, children: 0 },
  { id: 'couple', label: 'Couple', hint: 'Two of us', icon: <Heart className="w-6 h-6" />, adults: 2, children: 0 },
  { id: 'family', label: 'Family', hint: 'With kids', icon: <Baby className="w-6 h-6" />, adults: 2, children: 2 },
  { id: 'friends', label: 'Friends', hint: 'A group', icon: <PartyPopper className="w-6 h-6" />, adults: 4, children: 0 },
];

const INTERESTS: { id: ActivityCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'Leisure', label: 'Beach & chill', icon: <Palmtree className="w-5 h-5" /> },
  { id: 'Sightseeing', label: 'Iconic sights', icon: <Camera className="w-5 h-5" /> },
  { id: 'Culture', label: 'Culture & heritage', icon: <Landmark className="w-5 h-5" /> },
  { id: 'Adventure', label: 'Adventure', icon: <Mountain className="w-5 h-5" /> },
  { id: 'Food', label: 'Food & drink', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { id: 'Wellness', label: 'Spa & wellness', icon: <Flower2 className="w-5 h-5" /> },
];

const NIGHT_PRESETS = [3, 5, 7, 10];
const START_PRESETS = [
  { label: 'In 2 weeks', days: 14 },
  { label: 'Next month', days: 30 },
  { label: 'In 2 months', days: 60 },
];
const BUILD_MESSAGES = [
  'Finding the best of your destination…',
  'Matching experiences to your interests…',
  'Laying out your days…',
];

const tagline = (id: string) => SIGNATURE_DESTINATIONS.find((d) => d.id === id)?.tagline ?? '';

const stepperBtn =
  'w-9 h-9 rounded-full border border-[#1E2022]/15 flex items-center justify-center hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer transition-colors';

export const TripWizard: React.FC<TripWizardProps> = ({ initialDraft, initialStep, onComplete, onExit }) => {
  const reduced = useReducedMotion();

  // Defaults keep the last step to a single tap: a date a month out, five nights
  const [draft, setDraft] = useState<TripDraft>(() => {
    if (initialDraft.checkIn && initialDraft.checkOut) return initialDraft;
    const start = addDaysISO(todayISO(), 30);
    return { ...initialDraft, checkIn: start, checkOut: addDaysISO(start, 5) };
  });
  const [step, setStep] = useState(initialStep);
  const [maxStep, setMaxStep] = useState(initialStep);
  const [direction, setDirection] = useState(1);
  const [building, setBuilding] = useState(false);
  const [aiPickedId, setAiPickedId] = useState<string | null>(null);
  const [buildMsg, setBuildMsg] = useState(0);
  const [flyer, setFlyer] = useState<{ src: string; from: DOMRect; to: DOMRect; id: string } | null>(null);

  const slotRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const patch = (p: Partial<TripDraft>) => setDraft((d) => ({ ...d, ...p }));
  const nights = Math.max(1, nightsBetween(draft.checkIn, draft.checkOut));
  const dest = getDestination(draft.destinationId);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
  };

  // ----- step 0: destination -----

  const commitDestination = (id: string | 'ai') => {
    if (id === 'ai') patch({ destinationId: '', aiDestination: true });
    else patch({ destinationId: id, aiDestination: false });
    later(() => goTo(1), reduced ? 150 : 350);
  };

  const chooseDestination = (id: string, card: HTMLElement | null) => {
    const img = card?.querySelector('img');
    const slot = slotRef.current;
    if (reduced || !img || !slot) return commitDestination(id);
    setFlyer({ id, src: img.src, from: img.getBoundingClientRect(), to: slot.getBoundingClientRect() });
  };

  const scrollRow = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  // ----- step 1: travellers -----

  const chooseTraveller = (t: (typeof TRAVELLER_TYPES)[number]) =>
    patch({ travellerType: t.id, adults: t.adults, children: t.children });

  // ----- step 2: interests -----

  const toggleInterest = (id: ActivityCategory) =>
    patch({ interests: draft.interests.includes(id) ? draft.interests.filter((i) => i !== id) : [...draft.interests, id] });

  const letAiCustomise = () => {
    patch({ interests: [], aiPlan: true });
    goTo(3);
  };

  // ----- step 3: dates + finish -----

  const setStart = (iso: string) => {
    if (!iso) return;
    patch({ checkIn: iso, checkOut: addDaysISO(iso, nights) });
  };
  const setNights = (n: number) => {
    const clamped = Math.min(MAX_TRIP_DAYS - 1, Math.max(1, n));
    patch({ checkOut: addDaysISO(draft.checkIn, clamped) });
  };

  const finish = () => {
    let final = draft;
    if (!final.destinationId) {
      const pick = pickDestinationForMe(final);
      final = { ...final, destinationId: pick.id };
      setAiPickedId(pick.id);
    }
    setDraft(final);
    setBuilding(true);
    later(() => setBuildMsg(1), 900);
    later(() => setBuildMsg(2), 1800);
    later(() => onComplete(final), 2700);
  };

  // ----- derived UI state -----

  const canContinue =
    step === 0 ? Boolean(dest) || draft.aiDestination : step === 1 ? draft.travellerType !== '' : true;

  const trailChips = [
    draft.travellerType
      ? `${TRAVELLER_TYPES.find((t) => t.id === draft.travellerType)?.label} · ${draft.adults + draft.children}`
      : null,
    draft.aiPlan
      ? 'AI customised'
      : draft.interests.length
      ? draft.interests.length > 2
        ? `${draft.interests.slice(0, 2).join(', ')} +${draft.interests.length - 2}`
        : draft.interests.join(', ')
      : null,
    maxStep >= 3 ? `${formatDate(draft.checkIn).replace(/ \d{4}$/, '')} · ${nights}N` : null,
  ];

  // ---------- building screen ----------
  if (building) {
    const shown = getDestination(aiPickedId ?? draft.destinationId);
    return (
      <section className="pt-28 pb-24 min-h-[70vh] flex items-center justify-center">
        <div className="text-center px-6 max-w-md" role="status" aria-live="polite">
          {shown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mx-auto w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#F0AE45] to-[#C2571A]"
            >
              <img src={shown.image} alt="" className="w-full h-full rounded-full object-cover border-4 border-[#FAF8F5]" />
              <span className="absolute inset-0 rounded-full border-2 border-[#C2571A]/40 animate-ping" />
            </motion.div>
          )}
          {aiPickedId && shown && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C2571A]/10 text-[#C2571A] text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI picked {shown.name} for you
            </motion.p>
          )}
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#1E2022]">Building your trip</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={buildMsg}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2 text-sm text-[#6B7280]"
            >
              {BUILD_MESSAGES[buildMsg]}
            </motion.p>
          </AnimatePresence>
        </div>
      </section>
    );
  }

  // ---------- wizard ----------
  return (
    <section className="pt-24 lg:pt-28 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: back + trail (the "cart" the chosen place flies into) */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? onExit() : goTo(step - 1))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#1E2022] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Home' : 'Back'}
          </button>
          <span className="text-xs font-semibold text-[#6B7280]">
            Step {step + 1} of {STEP_LABELS.length}
          </span>
        </div>

        <div className="mt-4 h-1.5 rounded-full bg-[#1E2022]/8 overflow-hidden" aria-hidden>
          <motion.div
            className="h-full bg-[#C2571A] rounded-full"
            animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Your trip so far">
          <button
            type="button"
            onClick={() => goTo(0)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-[#1E2022]/12 hover:border-[#C2571A] cursor-pointer transition-colors"
          >
            <div
              ref={slotRef}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-dashed border-[#1E2022]/20 bg-[#FAF8F5] flex items-center justify-center shrink-0"
            >
              {dest ? (
                <motion.img
                  key={dest.id}
                  src={dest.image}
                  alt=""
                  initial={{ scale: reduced ? 1 : 0.4 }}
                  animate={{ scale: reduced ? 1 : [0.4, 1.2, 1] }}
                  transition={{ duration: 0.45 }}
                  className="w-full h-full object-cover"
                />
              ) : draft.aiDestination ? (
                <Sparkles className="w-4 h-4 text-[#C2571A]" />
              ) : (
                <MapPin className="w-4 h-4 text-[#9CA3AF]" />
              )}
            </div>
            <span className="text-sm font-semibold text-[#1E2022]">
              {dest ? dest.name : draft.aiDestination ? 'AI will choose' : 'Your trip'}
            </span>
          </button>
          {trailChips.map((chip, i) =>
            chip ? (
              <motion.button
                key={i + chip}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => goTo(i + 1)}
                className="px-3 py-2 rounded-full bg-white border border-[#1E2022]/12 text-sm font-semibold text-[#1E2022] hover:border-[#C2571A] cursor-pointer transition-colors"
              >
                {chip}
              </motion.button>
            ) : null
          )}
        </div>

        {/* Step content */}
        <div className="mt-8 sm:mt-10 min-h-[26rem]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: reduced ? 0 : direction * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : direction * -48 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h1
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022] focus:outline-none"
                      >
                        Where do you want to go?
                      </h1>
                      <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
                        Tap a place to add it to your trip — or let AI choose for you.
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <button type="button" onClick={() => scrollRow(-1)} className={stepperBtn} aria-label="Scroll destinations left">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => scrollRow(1)} className={stepperBtn} aria-label="Scroll destinations right">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={rowRef}
                    className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {/* AI card */}
                    <button
                      type="button"
                      onClick={() => commitDestination('ai')}
                      aria-pressed={draft.aiDestination}
                      className={`group relative flex-none w-[62%] sm:w-[40%] md:w-[28%] lg:w-[22%] aspect-[3/4] snap-start rounded-[1.75rem] overflow-hidden text-left p-6 flex flex-col justify-end cursor-pointer text-white bg-gradient-to-br from-[#1E2022] via-[#3a2a22] to-[#C2571A] transition-all ${
                        draft.aiDestination ? 'ring-4 ring-[#C2571A]/60' : 'hover:-translate-y-1 hover:shadow-2xl'
                      }`}
                    >
                      <Sparkles className="absolute top-6 left-6 w-8 h-8 text-[#F0AE45] transition-transform group-hover:rotate-12 group-hover:scale-110" />
                      <p className="text-xs font-bold uppercase tracking-wider text-white/75">Not sure yet?</p>
                      <h3 className="mt-0.5 text-2xl font-extrabold leading-tight">Let AI choose for me</h3>
                      <p className="mt-1 text-sm text-white/80">We’ll match a place to who’s going and what you love.</p>
                      {draft.aiDestination && (
                        <span className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white text-[#C2571A] flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </button>

                    {PLANNER_DESTINATIONS.map((d) => {
                      const selected = draft.destinationId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={(e) => chooseDestination(d.id, e.currentTarget)}
                          aria-pressed={selected}
                          className={`group relative flex-none w-[62%] sm:w-[40%] md:w-[28%] lg:w-[22%] aspect-[3/4] snap-start rounded-[1.75rem] overflow-hidden text-left bg-[#EAE6DF] cursor-pointer transition-all ${
                            selected ? 'ring-4 ring-[#C2571A]/60' : 'hover:-translate-y-1 hover:shadow-2xl'
                          } ${flyer?.id === d.id ? 'opacity-60' : ''}`}
                        >
                          <img
                            src={d.image}
                            alt={`${d.name}, ${d.country}`}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">{d.country}</p>
                            <h3 className="text-2xl font-extrabold leading-tight">{d.name}</h3>
                            <p className="mt-1 text-xs text-white/80 line-clamp-2">{tagline(d.id)}</p>
                            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F28A55]">
                              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" /> Add to my trip
                            </span>
                          </div>
                          {selected && (
                            <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#C2571A] text-white flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022] focus:outline-none"
                  >
                    Who’s travelling?
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-[#6B7280]">One tap — you can fine-tune the numbers below.</p>

                  <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {TRAVELLER_TYPES.map((t) => {
                      const selected = draft.travellerType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => chooseTraveller(t)}
                          aria-pressed={selected}
                          className={`relative p-5 sm:p-6 rounded-3xl border text-left cursor-pointer transition-all ${
                            selected
                              ? 'bg-white border-[#C2571A] ring-2 ring-[#C2571A]/40 shadow-lg -translate-y-0.5'
                              : 'bg-white/70 border-[#1E2022]/10 hover:bg-white hover:-translate-y-0.5 hover:shadow-md'
                          }`}
                        >
                          <span
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                              selected ? 'bg-[#C2571A] text-white' : 'bg-[#1E2022]/6 text-[#1E2022]'
                            }`}
                          >
                            {t.icon}
                          </span>
                          <h3 className="mt-4 text-lg font-extrabold text-[#1E2022]">{t.label}</h3>
                          <p className="text-sm text-[#6B7280]">{t.hint}</p>
                          {selected && <Check className="absolute top-4 right-4 w-5 h-5 text-[#C2571A]" />}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {draft.travellerType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 p-5 rounded-3xl bg-white border border-[#1E2022]/10 grid sm:grid-cols-2 gap-5">
                          {(
                            [
                              { key: 'adults', label: 'Adults', sub: 'Age 12+', min: 1, max: 12 },
                              { key: 'children', label: 'Children', sub: 'Age 0–11', min: 0, max: 8 },
                            ] as const
                          ).map((row) => (
                            <div key={row.key} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-[#1E2022]">{row.label}</p>
                                <p className="text-xs text-[#9CA3AF]">{row.sub}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  disabled={draft[row.key] <= row.min}
                                  onClick={() => patch({ [row.key]: draft[row.key] - 1 })}
                                  className={stepperBtn}
                                  aria-label={`Fewer ${row.label.toLowerCase()}`}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-6 text-center text-lg font-extrabold tabular-nums">{draft[row.key]}</span>
                                <button
                                  type="button"
                                  disabled={draft[row.key] >= row.max}
                                  onClick={() => patch({ [row.key]: draft[row.key] + 1 })}
                                  className={stepperBtn}
                                  aria-label={`More ${row.label.toLowerCase()}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022] focus:outline-none"
                  >
                    What are you into?
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-[#6B7280]">Pick as many as you like. We’ll show these first.</p>

                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {INTERESTS.map((it) => {
                      const selected = draft.interests.includes(it.id);
                      return (
                        <motion.button
                          key={it.id}
                          type="button"
                          whileTap={reduced ? undefined : { scale: 0.96 }}
                          onClick={() => toggleInterest(it.id)}
                          aria-pressed={selected}
                          className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition-colors ${
                            selected
                              ? 'bg-[#1E2022] border-[#1E2022] text-white'
                              : 'bg-white/70 border-[#1E2022]/10 text-[#1E2022] hover:bg-white'
                          }`}
                        >
                          <span
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              selected ? 'bg-[#C2571A] text-white' : 'bg-[#1E2022]/6'
                            }`}
                          >
                            {selected ? <Check className="w-5 h-5" /> : it.icon}
                          </span>
                          <span className="text-sm sm:text-base font-bold">{it.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={letAiCustomise}
                    className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-dashed border-[#C2571A] text-[#C2571A] text-sm font-bold hover:bg-[#C2571A]/8 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4" /> No idea — let AI customise it for me
                  </button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022] focus:outline-none"
                  >
                    When and for how long?
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-[#6B7280]">We’ve pre-filled a sensible plan — change anything you like.</p>

                  <div className="mt-6 grid lg:grid-cols-2 gap-4">
                    <div className="p-5 rounded-3xl bg-white border border-[#1E2022]/10">
                      <label htmlFor="wiz-start" className="flex items-center gap-2 text-sm font-bold text-[#1E2022]">
                        <Calendar className="w-4 h-4 text-[#C2571A]" /> Starting on
                      </label>
                      <input
                        id="wiz-start"
                        type="date"
                        min={todayISO()}
                        value={draft.checkIn}
                        onChange={(e) => setStart(e.target.value)}
                        className="mt-3 w-full px-4 py-3 text-base font-semibold rounded-xl bg-[#FAF8F5] border border-[#1E2022]/12 focus:outline-none focus:ring-2 focus:ring-[#C2571A]/30 cursor-pointer"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {START_PRESETS.map((p) => {
                          const iso = addDaysISO(todayISO(), p.days);
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => setStart(iso)}
                              aria-pressed={draft.checkIn === iso}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                draft.checkIn === iso ? 'bg-[#1E2022] text-white' : 'bg-[#1E2022]/6 hover:bg-[#1E2022]/12'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-[#1E2022]/10">
                      <p className="text-sm font-bold text-[#1E2022]">How many nights?</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setNights(nights - 1)}
                          disabled={nights <= 1}
                          className={stepperBtn}
                          aria-label="Fewer nights"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-24 text-center text-3xl font-extrabold tabular-nums">
                          {nights}
                          <span className="text-sm font-semibold text-[#6B7280]"> nights</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setNights(nights + 1)}
                          disabled={nights >= MAX_TRIP_DAYS - 1}
                          className={stepperBtn}
                          aria-label="More nights"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {NIGHT_PRESETS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setNights(n)}
                            aria-pressed={nights === n}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                              nights === n ? 'bg-[#1E2022] text-white' : 'bg-[#1E2022]/6 hover:bg-[#1E2022]/12'
                            }`}
                          >
                            {n} nights
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-[#6B7280]">
                    {formatDate(draft.checkIn)} → {formatDate(draft.checkOut)} · {nights + 1} days
                  </p>

                  <label className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#1E2022]/10 cursor-pointer hover:border-[#C2571A]/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={draft.aiPlan}
                      onChange={(e) => patch({ aiPlan: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#C2571A]"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-[#1E2022]">
                        <Sparkles className="w-4 h-4 text-[#C2571A]" /> Pre-fill my days with AI picks
                      </span>
                      <span className="block text-xs text-[#6B7280]">
                        Start with a suggested plan, then swap anything on the next page.
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky action bar */}
      {(step > 0 || canContinue) && (
        <div className="sticky bottom-[4.75rem] md:bottom-4 z-30 mt-6 max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-end gap-3 p-3 rounded-full bg-white/95 backdrop-blur border border-[#1E2022]/12 shadow-2xl">
            {step < 3 ? (
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => goTo(step + 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-sm font-semibold disabled:opacity-40 disabled:hover:bg-[#1E2022] transition-colors cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C2571A] hover:bg-[#a84a15] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Build my trip
              </button>
            )}
          </div>
        </div>
      )}

      {/* Flying card: the tapped place travels into the trip trail */}
      {flyer && (
        <motion.img
          src={flyer.src}
          alt=""
          aria-hidden
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: flyer.from.width,
            height: flyer.from.height,
            transformOrigin: '0 0',
            objectFit: 'cover',
            borderRadius: 28,
            zIndex: 60,
            pointerEvents: 'none',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}
          initial={{ x: flyer.from.left, y: flyer.from.top, scaleX: 1, scaleY: 1, opacity: 1 }}
          animate={{
            x: flyer.to.left,
            y: [flyer.from.top, Math.min(flyer.from.top, flyer.to.top) - 80, flyer.to.top],
            scaleX: flyer.to.width / flyer.from.width,
            scaleY: flyer.to.height / flyer.from.height,
            opacity: [1, 1, 0.85],
          }}
          transition={{
            duration: 0.8,
            ease: [0.5, 0, 0.2, 1],
            y: { duration: 0.8, times: [0, 0.4, 1], ease: 'easeInOut' },
          }}
          onAnimationComplete={() => {
            const id = flyer.id;
            setFlyer(null);
            commitDestination(id);
          }}
        />
      )}
    </section>
  );
};
