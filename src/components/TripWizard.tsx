import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';
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
  Plane,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
  X,
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
const STEP_ICONS = [MapPin, Users, Heart, Calendar];

const TRAVELLER_TYPES: {
  id: TravellerType;
  label: string;
  hint: string;
  icon: React.ReactNode;
  grad: string;
  adults: number;
  children: number;
}[] = [
  { id: 'solo', label: 'Solo', hint: 'Just me', icon: <User className="w-7 h-7" />, grad: 'from-[#38BDF8] to-[#6366F1]', adults: 1, children: 0 },
  { id: 'couple', label: 'Couple', hint: 'Two of us', icon: <Heart className="w-7 h-7" />, grad: 'from-[#FB7185] to-[#E5501A]', adults: 2, children: 0 },
  { id: 'family', label: 'Family', hint: 'With kids', icon: <Baby className="w-7 h-7" />, grad: 'from-[#34D399] to-[#0EA5A4]', adults: 2, children: 2 },
  { id: 'friends', label: 'Friends', hint: 'A group', icon: <PartyPopper className="w-7 h-7" />, grad: 'from-[#FFC94D] to-[#F7931E]', adults: 4, children: 0 },
];

const INTERESTS: { id: ActivityCategory; label: string; hint: string; icon: React.ReactNode; grad: string }[] = [
  { id: 'Leisure', label: 'Beach & chill', hint: 'Sun, sand, slow days', icon: <Palmtree className="w-6 h-6" />, grad: 'from-[#22D3EE] to-[#0EA5A4]' },
  { id: 'Sightseeing', label: 'Iconic sights', hint: 'The must-see list', icon: <Camera className="w-6 h-6" />, grad: 'from-[#A78BFA] to-[#6366F1]' },
  { id: 'Culture', label: 'Culture & heritage', hint: 'Stories & old streets', icon: <Landmark className="w-6 h-6" />, grad: 'from-[#FBBF24] to-[#D97706]' },
  { id: 'Adventure', label: 'Adventure', hint: 'Get the pulse up', icon: <Mountain className="w-6 h-6" />, grad: 'from-[#FB923C] to-[#DC2626]' },
  { id: 'Food', label: 'Food & drink', hint: 'Taste like a local', icon: <UtensilsCrossed className="w-6 h-6" />, grad: 'from-[#F472B6] to-[#E11D48]' },
  { id: 'Wellness', label: 'Spa & wellness', hint: 'Reset and recharge', icon: <Flower2 className="w-6 h-6" />, grad: 'from-[#4ADE80] to-[#059669]' },
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

const STEP_COPY = [
  { pre: 'Where do you want', em: 'to go?', sub: 'Tap a place to add it to your trip.' },
  { pre: 'Who’s', em: 'travelling?', sub: 'One tap — you can fine-tune the numbers below.' },
  { pre: 'What are you', em: 'into?', sub: 'Pick as many as you like. We’ll show these first.' },
  { pre: 'When and', em: 'for how long?', sub: 'We’ve pre-filled a sensible plan — change anything you like.' },
];

const tagline = (id: string) => SIGNATURE_DESTINATIONS.find((d) => d.id === id)?.tagline ?? '';

const brandGrad = 'bg-gradient-to-r from-[#F7931E] via-[#E5501A] to-[#C2571A]';

const stepperBtn =
  'w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-[#1E2022]/10 shadow-sm flex items-center justify-center hover:bg-white hover:border-[#C2571A]/40 hover:text-[#C2571A] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:text-inherit cursor-pointer transition-all';

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, type: 'spring' as const, stiffness: 240, damping: 24 },
  }),
};

/** Soft drifting colour blobs behind the whole wizard */
const Aurora: React.FC<{ reduced: boolean | null }> = ({ reduced }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden>
    <motion.div
      className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-[#FFC94D]/25 blur-3xl"
      animate={reduced ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#E5501A]/10 blur-3xl"
      animate={reduced ? undefined : { x: [0, -70, 0], y: [0, 60, 0] }}
      transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

/** Destination photo card */
const DestCard: React.FC<{
  index: number;
  reduced: boolean | null;
  selected: boolean;
  dimmed: boolean;
  name: string;
  country: string;
  image: string;
  tagline: string;
  onPick: (el: HTMLElement) => void;
}> = ({ index, reduced, selected, dimmed, name, country, image, tagline: tag, onPick }) => {

  return (
    <motion.button
      type="button"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      layout
      onClick={(e) => onPick(e.currentTarget)}
      whileHover={reduced ? undefined : { y: -12, scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      aria-pressed={selected}
      className={`group relative flex-none w-[calc((100%-1.25rem)/1.4)] sm:w-[calc((100%-1.25rem)/1.6)] md:w-[calc((100%-2.5rem)/2.5)] lg:w-[calc((100%-3.75rem)/3.5)] snap-start aspect-[3/4] rounded-[2rem] overflow-hidden text-left bg-[#EAE6DF] cursor-pointer transition-shadow duration-300 ${
        selected
          ? 'ring-[3px] ring-[#F7931E] shadow-[0_25px_60px_-15px_rgba(229,80,26,0.55)]'
          : 'shadow-[0_18px_40px_-20px_rgba(30,32,34,0.45)] hover:shadow-[0_30px_60px_-20px_rgba(30,32,34,0.6)]'
      } ${dimmed ? 'opacity-60' : ''}`}
    >
      <img
        src={image}
        alt={`${name}, ${country}`}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#E5501A]/50 via-[#F7931E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 group-hover:bg-white group-hover:text-[#1E2022] transition-all duration-300 text-[11px] font-bold uppercase tracking-wider text-white">
        <MapPin className="w-3 h-3 text-[#FFC94D]" /> {country}
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white transition-transform duration-500 ease-out group-hover:-translate-y-1">
        <h3 className="text-[1.7rem] font-extrabold leading-tight tracking-tight drop-shadow">{name}</h3>
        <p className="mt-1 text-xs text-white/80 line-clamp-2">{tag}</p>
        <span
          className={`mt-4 inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
            selected
              ? `${brandGrad} text-white shadow-lg`
              : 'bg-white/15 backdrop-blur-md border border-white/30 text-white group-hover:bg-white group-hover:border-white group-hover:text-[#C2571A] group-hover:pr-3'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              selected ? 'bg-white/25' : 'bg-[#F7931E] text-white'
            }`}
          >
            {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />}
          </span>
          {selected ? 'Added' : 'Add to my trip'}
          {!selected && <ArrowRight className="h-4 -ml-1 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />}
        </span>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className={`absolute top-4 right-4 w-9 h-9 rounded-full ${brandGrad} text-white flex items-center justify-center shadow-lg ring-4 ring-white/30`}
          >
            <Check className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

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
  const [query, setQuery] = useState('');
  const [hintIdx, setHintIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [building, setBuilding] = useState(false);
  const [aiPickedId, setAiPickedId] = useState<string | null>(null);
  const [buildMsg, setBuildMsg] = useState(0);
  const [flyer, setFlyer] = useState<{ src: string; from: DOMRect; to: DOMRect; id: string } | null>(null);

  const slotRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

useEffect(() => {    if (reduced || step !== 0 || query) return;    const id = window.setInterval(() => setHintIdx((i) => i + 1), 2200);    return () => clearInterval(id);  }, [reduced, step, query]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const rowRef = useRef<HTMLDivElement>(null);
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

  const commitDestination = (id: string) => {
    patch({ destinationId: id, aiDestination: false });
    later(() => goTo(1), reduced ? 150 : 350);
  };

  const scrollRow = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });

  const chooseDestination = (id: string, card: HTMLElement | null) => {
    const img = card?.querySelector('img');
    const slot = slotRef.current;
    if (reduced || !img || !slot) return commitDestination(id);
    setFlyer({ id, src: img.src, from: img.getBoundingClientRect(), to: slot.getBoundingClientRect() });
  };


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

const q = query.trim().toLowerCase();  const matches = q    ? PLANNER_DESTINATIONS.filter((d) => `${d.name} ${d.country} ${tagline(d.id)}`.toLowerCase().includes(q))    : PLANNER_DESTINATIONS;
  const canContinue = step === 0 ? Boolean(dest) : step === 1 ? draft.travellerType !== '' : true;

  const startDate = new Date(draft.checkIn + 'T00:00:00');
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const startWeekday = startDate.toLocaleDateString('en-US', { weekday: 'long' });

  // ---------- building screen ----------
  if (building) {
    const shown = getDestination(aiPickedId ?? draft.destinationId);
    return (
      <section className="relative pt-28 pb-24 min-h-[75vh] flex items-center justify-center overflow-hidden">
        <Aurora reduced={reduced} />
        <div className="text-center px-6 max-w-md" role="status" aria-live="polite">
          <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-[#F7931E]/50"
                initial={{ scale: 0.6, opacity: 0.7 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
              />
            ))}
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(from 0deg, #FFC94D, #E5501A, transparent 70%)', mask: 'radial-gradient(circle, transparent 62%, black 64%)', WebkitMask: 'radial-gradient(circle, transparent 62%, black 64%)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
            {shown ? (
              <motion.img
                src={shown.image}
                alt=""
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <Sparkles className="relative w-10 h-10 text-[#C2571A]" />
            )}
            <motion.span
              className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#C2571A]"
              animate={reduced ? undefined : { y: [0, -6, 0], rotate: [0, 12, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plane className="w-5 h-5" />
            </motion.span>
          </div>
          {aiPickedId && shown && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur border border-[#C2571A]/20 text-[#C2571A] text-xs font-bold shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI picked {shown.name} for you
            </motion.p>
          )}
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#1E2022]">Building your trip</h1>
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
          <div className="mt-6 mx-auto w-56 h-1.5 rounded-full bg-[#1E2022]/8 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${brandGrad}`}
              initial={{ width: '4%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.6, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </section>
    );
  }

  const copy = STEP_COPY[step];
  // The plane flies along the connector between the two steps we just moved across
  const flightSeg = direction > 0 ? step - 1 : step;

  const heading = (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022] focus:outline-none leading-tight"
        >
          {copy.pre} <span className="text-saffron-gradient">{copy.em}</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#6B7280] max-w-xl">{copy.sub}</p>
      </div>
    </div>
  );

  // ---------- wizard ----------
  return (
    <section className="relative pt-24 lg:pt-28 pb-32">
      <Aurora reduced={reduced} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Back · progress tab · chosen place (the spot the picked card flies into) */}
        <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? onExit() : goTo(step - 1))}
            className="group justify-self-start inline-flex items-center gap-2 p-1.5 sm:pr-4 rounded-full bg-white border border-[#1E2022]/10 shadow-sm text-sm font-semibold text-[#1E2022] hover:border-[#C2571A]/40 cursor-pointer transition-colors"
            aria-label={step === 0 ? 'Home' : 'Back'}
          >
            <span className="w-8 h-8 rounded-full bg-[#1E2022]/6 group-hover:bg-[#C2571A] group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline">{step === 0 ? 'Home' : 'Back'}</span>
          </button>

          <nav
            aria-label="Trip setup progress"
            className="justify-self-center rounded-full bg-white border border-[#1E2022]/10 shadow-sm p-1.5"
          >
            <ol className="flex items-center">
              {STEP_LABELS.map((label, i) => {
                const Icon = STEP_ICONS[i];
                const done = i < step;
                const active = i === step;
                return (
                  <React.Fragment key={label}>
                    <li aria-current={active ? 'step' : undefined}>
                      <motion.button
                        layout
                        type="button"
                        disabled={i > maxStep}
                        onClick={() => goTo(i)}
                        aria-label={label}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className={`h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer disabled:cursor-default ${
                          active
                            ? 'bg-[#1E2022] text-white px-3.5'
                            : done
                            ? `${brandGrad} text-white w-9`
                            : 'bg-[#1E2022]/5 text-[#9CA3AF] w-9'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        {active && <span>{label}</span>}
                      </motion.button>
                    </li>
                    {i < STEP_LABELS.length - 1 && (
                      <span className="relative w-4 sm:w-7 h-[3px] mx-1 rounded-full bg-[#1E2022]/10" aria-hidden>
                        <motion.span
                          className={`absolute inset-0 rounded-full ${brandGrad}`}
                          style={{ originX: 0 }}
                          initial={false}
                          animate={{ scaleX: i < step ? 1 : 0 }}
                          transition={{ duration: reduced ? 0 : 0.6 }}
                        />
                        {i === flightSeg && !reduced && (
                          <motion.span
                            key={step}
                            className="absolute top-1/2 text-[#E5501A]"
                            style={{ x: '-50%', y: '-50%', scaleX: direction < 0 ? -1 : 1 }}
                            initial={{ left: direction > 0 ? '0%' : '100%', opacity: 0 }}
                            animate={{ left: direction > 0 ? '100%' : '0%', opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                          >
                            <Plane className="w-4 h-4 fill-current" />
                          </motion.span>
                        )}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>

          <button
            type="button"
            onClick={() => goTo(0)}
            className="justify-self-end flex items-center gap-2 p-1 sm:pr-4 rounded-full bg-white border border-[#1E2022]/10 shadow-sm hover:border-[#C2571A]/50 cursor-pointer transition-colors"
            aria-label="Change destination"
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
              ) : (
                <MapPin className="w-4 h-4 text-[#9CA3AF]" />
              )}
            </div>
            <span className="hidden sm:inline text-sm font-bold text-[#1E2022]">{dest ? dest.name : 'Destination'}</span>
          </button>
        </div>

        {/* Step content */}
        <div className="mt-8 sm:mt-10 min-h-[26rem]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: reduced ? 0 : direction * 60, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: reduced ? 0 : direction * -60, filter: 'blur(6px)' }}
              transition={{ duration: 0.3 }}
            >
              {heading}

              {step === 0 && (
                <div>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-xl">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search destinations"
                        autoComplete="off"
                        className="w-full pl-14 pr-12 py-4 rounded-full bg-white border border-[#1E2022]/10 shadow-sm text-base font-semibold text-[#1E2022] focus:outline-none focus:border-[#F7931E] focus:ring-4 focus:ring-[#F7931E]/20 transition"
                      />
                      {/* Static lead-in + place names that roll upward */}
                      {!query && (
                        <div
                          className="absolute left-14 right-12 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-base pointer-events-none overflow-hidden h-7"
                          aria-hidden
                        >
                          <span className="font-medium text-[#9CA3AF] whitespace-nowrap">Search destination</span>
                          <span className="relative flex-1 h-7 overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={hintIdx}
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '-100%', opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                className="absolute inset-0 leading-7 font-bold text-[#C2571A] whitespace-nowrap"
                              >
                                {PLANNER_DESTINATIONS[hintIdx % PLANNER_DESTINATIONS.length].name}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                        </div>
                      )}
                      <AnimatePresence>
                        {query && (
                          <motion.button
                            type="button"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1E2022]/8 hover:bg-[#1E2022]/15 flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="hidden md:flex items-center gap-2 shrink-0">
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
                    className="mt-2 flex gap-5 overflow-x-auto -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8 pl-1 pt-4 pb-10 snap-x snap-mandatory scroll-smooth scroll-pl-1"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    <AnimatePresence mode="popLayout">
                      {matches.map((d, i) => (
                        <DestCard
                          key={d.id}
                          index={i}
                          reduced={reduced}
                          selected={draft.destinationId === d.id}
                          dimmed={flyer?.id === d.id}
                          name={d.name}
                          country={d.country}
                          image={d.image}
                          tagline={tagline(d.id)}
                          onPick={(el) => chooseDestination(d.id, el)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {matches.length === 0 && (
                    <div className="py-14 text-center">
                      <div className="mx-auto w-14 h-14 rounded-full bg-white border border-[#1E2022]/10 shadow-sm flex items-center justify-center text-[#9CA3AF]">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="mt-4 text-lg font-extrabold text-[#1E2022]">No places match “{query.trim()}”</p>
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="mt-3 text-sm font-bold text-[#C2571A] hover:underline cursor-pointer"
                      >
                        Show all destinations
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
                  >
                    {TRAVELLER_TYPES.map((t, i) => {
                      const selected = draft.travellerType === t.id;
                      return (
                        <motion.button
                          key={t.id}
                          type="button"
                          custom={i}
                          variants={cardVariants}
                          whileHover={reduced ? undefined : { y: -6 }}
                          whileTap={reduced ? undefined : { scale: 0.97 }}
                          onClick={() => chooseTraveller(t)}
                          aria-pressed={selected}
                          className={`group relative overflow-hidden p-5 sm:p-7 rounded-[2rem] border text-left cursor-pointer transition-all duration-300 ${
                            selected
                              ? `bg-gradient-to-br ${t.grad} border-transparent text-white shadow-[0_25px_50px_-15px_rgba(30,32,34,0.45)]`
                              : 'bg-white/80 backdrop-blur border-white text-[#1E2022] shadow-[0_15px_35px_-20px_rgba(30,32,34,0.4)] hover:shadow-[0_25px_50px_-20px_rgba(30,32,34,0.5)]'
                          }`}
                        >
                          <span
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 ${
                              selected ? 'bg-white/25 text-white backdrop-blur' : `bg-gradient-to-br ${t.grad} text-white shadow-lg`
                            }`}
                          >
                            {t.icon}
                          </span>
                          <h3 className="relative mt-5 text-xl font-extrabold">{t.label}</h3>
                          <p className={`relative text-sm ${selected ? 'text-white/85' : 'text-[#6B7280]'}`}>{t.hint}</p>
                          <AnimatePresence>
                            {selected && (
                              <motion.span
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-[#1E2022] flex items-center justify-center shadow-lg"
                              >
                                <Check className="w-4 h-4" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <AnimatePresence>
                    {draft.travellerType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 p-6 rounded-[2rem] bg-white/80 backdrop-blur border border-white shadow-[0_15px_35px_-20px_rgba(30,32,34,0.4)] grid sm:grid-cols-2 gap-6">
                          {(
                            [
                              { key: 'adults', label: 'Adults', sub: 'Age 12+', min: 1, max: 12 },
                              { key: 'children', label: 'Children', sub: 'Age 0–11', min: 0, max: 8 },
                            ] as const
                          ).map((row) => (
                            <div key={row.key} className="flex items-center justify-between">
                              <div>
                                <p className="text-base font-extrabold text-[#1E2022]">{row.label}</p>
                                <p className="text-xs text-[#9CA3AF]">{row.sub}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  disabled={draft[row.key] <= row.min}
                                  onClick={() => patch({ [row.key]: draft[row.key] - 1 })}
                                  className={stepperBtn}
                                  aria-label={`Fewer ${row.label.toLowerCase()}`}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="relative w-8 h-8 overflow-hidden text-center">
                                  <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                      key={draft[row.key]}
                                      initial={{ y: 18, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      exit={{ y: -18, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="absolute inset-0 text-2xl font-extrabold tabular-nums leading-8"
                                    >
                                      {draft[row.key]}
                                    </motion.span>
                                  </AnimatePresence>
                                </span>
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
                  <motion.div
                    initial="hidden"
                    animate="show"
                    className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
                  >
                    {INTERESTS.map((it, i) => {
                      const selected = draft.interests.includes(it.id);
                      return (
                        <motion.button
                          key={it.id}
                          type="button"
                          custom={i}
                          variants={cardVariants}
                          whileHover={reduced ? undefined : { y: -4 }}
                          whileTap={reduced ? undefined : { scale: 0.96 }}
                          onClick={() => toggleInterest(it.id)}
                          aria-pressed={selected}
                          className={`group relative overflow-hidden flex items-center gap-4 p-4 sm:p-5 rounded-[1.75rem] border text-left cursor-pointer transition-all duration-300 ${
                            selected
                              ? 'bg-[#1E2022] border-[#1E2022] text-white shadow-[0_25px_50px_-18px_rgba(30,32,34,0.6)]'
                              : 'bg-white/80 backdrop-blur border-white text-[#1E2022] shadow-[0_15px_35px_-22px_rgba(30,32,34,0.45)] hover:shadow-[0_25px_50px_-22px_rgba(30,32,34,0.55)]'
                          }`}
                        >
                          <span
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white bg-gradient-to-br ${it.grad} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={selected ? 'c' : 'i'}
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                                className="flex"
                              >
                                {selected ? <Check className="w-6 h-6" /> : it.icon}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                          <span className="relative">
                            <span className="block text-base font-extrabold">{it.label}</span>
                            <span className={`block text-xs ${selected ? 'text-white/70' : 'text-[#6B7280]'}`}>{it.hint}</span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={letAiCustomise}
                      className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#1E2022] to-[#3a2a22] text-white text-sm font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer transition-all"
                    >
                      <Sparkles className="relative w-4 h-4 text-[#FFC94D] group-hover:rotate-12 transition-transform" />
                      <span className="relative">No idea — let AI customise it for me</span>
                    </button>
                    <AnimatePresence>
                      {draft.interests.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="px-3.5 py-2 rounded-full bg-[#C2571A]/10 text-[#C2571A] text-sm font-bold"
                        >
                          {draft.interests.length} selected
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="mt-8 grid lg:grid-cols-2 gap-5">
                    {/* Start date */}
                    <div className="relative overflow-hidden p-6 rounded-[2rem] bg-white/80 backdrop-blur border border-white shadow-[0_15px_35px_-20px_rgba(30,32,34,0.4)]">
                      <label htmlFor="wiz-start" className="flex items-center gap-2 text-sm font-extrabold text-[#1E2022]">
                        <span className={`w-7 h-7 rounded-lg ${brandGrad} text-white flex items-center justify-center`}>
                          <Calendar className="w-4 h-4" />
                        </span>
                        Starting on
                      </label>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="w-20 rounded-2xl overflow-hidden shadow-lg border border-[#1E2022]/8 shrink-0 text-center bg-white">
                          <div className={`${brandGrad} text-white text-[11px] font-extrabold uppercase tracking-widest py-1`}>{startMonth}</div>
                          <div className="relative h-12 overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.div
                                key={draft.checkIn}
                                initial={{ y: 24, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -24, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="absolute inset-0 text-3xl font-extrabold leading-[3rem] text-[#1E2022]"
                              >
                                {startDay}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-extrabold text-[#1E2022]">{startWeekday}</p>
                          <p className="text-xs text-[#6B7280]">Tap the field to pick another day</p>
                        </div>
                      </div>

                      <input
                        id="wiz-start"
                        type="date"
                        min={todayISO()}
                        value={draft.checkIn}
                        onChange={(e) => setStart(e.target.value)}
                        className="mt-4 w-full px-4 py-3 text-base font-semibold rounded-2xl bg-[#FAF8F5] border border-[#1E2022]/10 focus:outline-none focus:ring-2 focus:ring-[#F7931E]/50 focus:border-[#F7931E] cursor-pointer transition"
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        {START_PRESETS.map((p) => {
                          const iso = addDaysISO(todayISO(), p.days);
                          const on = draft.checkIn === iso;
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => setStart(iso)}
                              aria-pressed={on}
                              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${
                                on
                                  ? `${brandGrad} text-white shadow-md scale-105`
                                  : 'bg-[#1E2022]/6 hover:bg-[#1E2022]/12 hover:scale-105'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nights */}
                    <div className="relative overflow-hidden p-6 rounded-[2rem] bg-[#1E2022] text-white shadow-[0_25px_50px_-20px_rgba(30,32,34,0.6)]">
                      <p className="relative text-sm font-extrabold">How many nights?</p>
                      <div className="relative mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setNights(nights - 1)}
                          disabled={nights <= 1}
                          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center active:scale-90 disabled:opacity-30 cursor-pointer transition-all"
                          aria-label="Fewer nights"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                          <div className="relative h-16 w-24 overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={nights}
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -40, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                                className="absolute inset-0 text-6xl font-extrabold tabular-nums leading-[4rem] text-saffron-gradient"
                              >
                                {nights}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <p className="text-xs font-bold uppercase tracking-widest text-white/60">{nights === 1 ? 'night' : 'nights'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNights(nights + 1)}
                          disabled={nights >= MAX_TRIP_DAYS - 1}
                          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center active:scale-90 disabled:opacity-30 cursor-pointer transition-all"
                          aria-label="More nights"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="relative mt-5 flex items-center gap-1" aria-hidden>
                        {Array.from({ length: Math.min(MAX_TRIP_DAYS - 1, 14) }).map((_, k) => (
                          <motion.span
                            key={k}
                            animate={{ opacity: k < nights ? 1 : 0.2, scaleY: k < nights ? 1 : 0.6 }}
                            transition={{ delay: reduced ? 0 : k * 0.015 }}
                            className="flex-1 h-2 rounded-full bg-gradient-to-r from-[#FFC94D] to-[#E5501A]"
                          />
                        ))}
                      </div>

                      <div className="relative mt-5 flex flex-wrap gap-2">
                        {NIGHT_PRESETS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setNights(n)}
                            aria-pressed={nights === n}
                            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${
                              nights === n ? 'bg-white text-[#1E2022] scale-105 shadow-md' : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                            }`}
                          >
                            {n} nights
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Route summary */}
                  <div className="mt-5 flex items-center gap-4 p-5 rounded-[1.75rem] bg-white/80 backdrop-blur border border-white shadow-[0_15px_35px_-22px_rgba(30,32,34,0.4)]">
                    <div className="text-left">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Depart</p>
                      <p className="text-sm sm:text-base font-extrabold text-[#1E2022]">{formatDate(draft.checkIn)}</p>
                    </div>
                    <div className="relative flex-1 h-8 flex items-center" aria-hidden>
                      <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-[#1E2022]/20" />
                      <motion.span
                        className="absolute text-[#C2571A]"
                        animate={reduced ? { left: '45%' } : { left: ['0%', '92%'] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Plane className="w-5 h-5" />
                      </motion.span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Return · {nights + 1} days</p>
                      <p className="text-sm sm:text-base font-extrabold text-[#1E2022]">{formatDate(draft.checkOut)}</p>
                    </div>
                  </div>

                  <label
                    className={`group mt-5 flex items-start gap-4 p-5 rounded-[1.75rem] border cursor-pointer transition-all ${
                      draft.aiPlan
                        ? 'bg-gradient-to-r from-[#FFF4E0] to-[#FFE3D2] border-[#F7931E]/50 shadow-md'
                        : 'bg-white/80 backdrop-blur border-white hover:border-[#C2571A]/40 shadow-sm'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={draft.aiPlan}
                      onChange={(e) => patch({ aiPlan: e.target.checked })}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 w-12 h-7 rounded-full p-1 flex shrink-0 transition-colors ${draft.aiPlan ? 'bg-[#E5501A] justify-end' : 'bg-[#1E2022]/15 justify-start'}`}
                      aria-hidden
                    >
                      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 rounded-full bg-white shadow" />
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-extrabold text-[#1E2022]">
                        <Sparkles className="w-4 h-4 text-[#C2571A]" /> Pre-fill my days with AI picks
                      </span>
                      <span className="block mt-0.5 text-xs text-[#6B7280]">
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
      <AnimatePresence>
        {(step > 0 || canContinue) && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="sticky bottom-[4.75rem] md:bottom-4 z-30 mt-6 max-w-3xl mx-auto px-4"
          >
            <div className="flex items-center justify-between gap-3 p-2.5 pl-5 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-[0_25px_60px_-15px_rgba(30,32,34,0.45)]">
              <div className="flex items-center gap-1.5" aria-hidden>
                {STEP_LABELS.map((_, i) => (
                  <motion.span
                    key={i}
                    animate={{ width: i === step ? 22 : 8 }}
                    className={`h-2 rounded-full ${i <= step ? brandGrad : 'bg-[#1E2022]/15'}`}
                  />
                ))}
              </div>
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => goTo(step + 1)}
                  className="group relative overflow-hidden inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-sm font-bold shadow-lg disabled:opacity-40 disabled:hover:bg-[#1E2022] transition-colors cursor-pointer"
                >
                  
                  <span className="relative">Continue</span>
                  <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className={`group relative overflow-hidden inline-flex items-center gap-2 px-7 py-3 rounded-full ${brandGrad} hover:brightness-110 text-white text-sm font-bold shadow-[0_10px_30px_-8px_rgba(229,80,26,0.7)] transition-all cursor-pointer`}
                >
                  <Sparkles className="relative w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="relative">Build my trip</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
