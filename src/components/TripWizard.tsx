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
  Car,
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
  aiPickCities,
  cityStops,
  getCities,
  transferLabel,
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

const STEP_LABELS = ['Where', 'Who', 'Interests', 'Cities', 'When'];

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

const TRAVELLER_CAPTIONS: Record<TravellerType, string> = {
  solo: 'Just you — total freedom to roam',
  couple: 'Two of you — cosy, romantic pacing',
  family: 'Family fun — kid-friendly picks first',
  friends: 'A group getaway — shared adventures',
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const isoOf = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const monthOf = (iso: string) => ({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)) - 1 });

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
  { pre: 'Where are you', em: 'going?', sub: 'Tell us your dream destination and we’ll craft the perfect trip for you' },
  { pre: 'Who’s', em: 'travelling?', sub: 'Choose who you’re travelling with, then fine tune your group' },
  { pre: 'What are you', em: 'into?', sub: 'Pick as many as you like. We’ll show these first' },
  { pre: 'Which cities do you', em: 'want to see?', sub: 'Pick the places you’d like to stay or let AI plan the route for you' },
  { pre: 'When and', em: 'for how long?', sub: 'We’ve pre-filled a sensible plan change anything you like' },
];

const MOODS: { label: string; keys: string[] }[] = [
  { label: 'All', keys: [] },
  { label: 'Beach', keys: ['beach', 'overwater'] },
  { label: 'Mountains', keys: ['mountain', 'snow'] },
  { label: 'City', keys: ['city', 'skyline'] },
  { label: 'Romance', keys: ['romance', 'calm'] },
  { label: 'Adventure', keys: ['adventure'] },
];

const DEST_TAGS: Record<string, string> = {
  bali: 'Culture • Beaches • Adventure',
  maldives: 'Overwater • Romance • Calm',
  dubai: 'City • Shopping • Luxury',
  manali: 'Mountains • Snow • Adventure',
  goa: 'Beach • Party • Food',
  singapore: 'Skyline • Food • Family',
};

const tagline = (id: string) => DEST_TAGS[id] ?? SIGNATURE_DESTINATIONS.find((d) => d.id === id)?.tagline ?? '';

const brandGrad = 'bg-gradient-to-r from-[#F7931E] via-[#E5501A] to-[#C2571A]';

const stepperBtn =
  'w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-[#1E2022]/10 shadow-sm flex items-center justify-center hover:bg-white hover:border-[#C2571A]/40 hover:text-[#C2571A] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:text-inherit disabled:hover:bg-white/80 disabled:hover:border-[#1E2022]/10 disabled:cursor-not-allowed cursor-pointer transition-all';

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


type SceneTheme = 'snow' | 'sea' | 'city' | 'sky';

const sceneThemeOf = (tag: string): SceneTheme => {
  const t = tag.toLowerCase();
  if (t.includes('snow') || t.includes('mountain')) return 'snow';
  if (t.includes('overwater') || t.includes('beach')) return 'sea';
  if (t.includes('city') || t.includes('skyline')) return 'city';
  return 'sky';
};

const SCENE_GLOW: Record<SceneTheme, [string, string]> = {
  snow: ['rgba(253,164,175,0.10)', 'rgba(254,215,170,0.14)'],
  sea: ['rgba(253,186,116,0.14)', 'rgba(252,165,165,0.09)'],
  city: ['rgba(251,191,36,0.12)', 'rgba(244,114,182,0.07)'],
  sky: ['rgba(255,201,77,0.13)', 'rgba(251,146,60,0.08)'],
};

// deterministic "random" so particles do not jump between renders
const pr = (i: number, k: number) => ((i * 9301 + k * 49297) % 233280) / 233280;
const CITY_BARS = [38, 62, 46, 84, 56, 100, 70, 48, 92, 60, 76, 42, 88, 54, 66, 96, 50, 72];

/** Thin, slow ripples that drift outward and fade (replaces the rising ring bubbles on the "Who" step) */
const RIPPLES = [
  { rot: -8, w: 'w-[30rem] h-[26rem] md:w-[44rem] md:h-[38rem]', show: '' },
  { rot: 6, w: 'w-[30rem] h-[27rem] md:w-[46rem] md:h-[40rem]', show: '' },
  { rot: -3, w: 'w-[44rem] h-[38rem]', show: 'hidden md:block' },
  { rot: 10, w: 'w-[48rem] h-[42rem]', show: 'hidden lg:block' },
];

const Ripples: React.FC<{ still: boolean }> = ({ still }) => (
  <div className="absolute inset-0 overflow-hidden">
    {RIPPLES.map((rp, i) => (
      <div key={i} className={`absolute left-[62%] top-[34%] w-0 h-0 flex items-center justify-center ${still && i > 1 ? 'hidden' : rp.show}`}>
      <motion.div
        className={`shrink-0 will-change-transform ${rp.w}`}
        style={{ rotate: rp.rot }}
        initial={{ scale: still ? 0.7 + i * 0.35 : 0.55, opacity: still ? 0.07 - i * 0.015 : 0 }}
        animate={still ? undefined : { scale: [0.55, 1.4], opacity: [0, 0.075, 0], x: [0, 14, -8], y: [0, -8, 6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeOut', delay: -i * 3 }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" fill="none">
          <ellipse cx="50" cy="50" rx="49" ry="46" stroke="#FB923C" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      </motion.div>
      </div>
    ))}
  </div>
);

/** Ambient, destination-themed scenery that fills the empty page space and changes with the place you hover or pick */
const DestinationScene: React.FC<{ dest?: { id: string; name: string }; mark?: { id: string; name: string }; reduced: boolean | null; ripples?: boolean; dimMark?: boolean }> = ({ dest, mark, reduced, ripples, dimMark }) => {
  const theme = dest ? sceneThemeOf(tagline(dest.id)) : 'sky';
  const [g1, g2] = SCENE_GLOW[theme];
  const still = Boolean(reduced);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
      {/* tinted light that shifts colour with the place */}
      <motion.div
        className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-3xl"
        animate={{ backgroundColor: g1, ...(still ? {} : { x: [0, 70, 0], y: [0, 50, 0] }) }}
        transition={{ backgroundColor: { duration: 1 }, x: { duration: 16, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 16, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full blur-3xl"
        animate={{ backgroundColor: g2, ...(still ? {} : { x: [0, -80, 0], y: [0, 70, 0] }) }}
        transition={{ backgroundColor: { duration: 1 }, x: { duration: 19, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 19, repeat: Infinity, ease: 'easeInOut' } }}
      />

      {ripples && <Ripples still={still} />}

      {/* giant outlined place name */}
      <AnimatePresence mode="popLayout">
        {mark && (
          <motion.span
            key={mark.id}
            initial={{ opacity: 0, y: 70, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -70, filter: 'blur(8px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-3 sm:right-8 top-28 sm:top-24 text-[22vw] sm:text-[12vw] font-black leading-none tracking-tighter whitespace-nowrap select-none text-transparent"
            style={{ WebkitTextStroke: `2px rgba(194,87,26,${dimMark ? 0.04 : 0.055})` }}
          >
            {mark.name}
          </motion.span>
        )}
      </AnimatePresence>

      {/* drifting clouds */}
      {!still &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-orange-50/80 blur-xl"
            style={{ top: `${14 + i * 24}%`, width: 120 + i * 60, height: 34 + i * 10 }}
            initial={{ left: '-25%' }}
            animate={{ left: '110%' }}
            transition={{ duration: 34 + i * 12, repeat: Infinity, ease: 'linear', delay: -i * 14 }}
          />
        ))}

      {/* a plane crossing the page */}
      {!still && (
        <motion.div
          className="absolute top-0 left-0 text-[#C2571A]/35"
          initial={{ x: '-10vw', y: '34vh', rotate: 38 }}
          animate={{ x: '108vw', y: ['34vh', '12vh', '30vh', '18vh'], rotate: [38, 58, 40, 52] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        >
          <Plane className="w-9 h-9" strokeWidth={1.4} />
        </motion.div>
      )}

      {/* weather / mood particles + skyline, per destination type */}
      <AnimatePresence mode="wait">
        <motion.div key={theme} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const left = `${pr(i, 1) * 100}%`;
            const size = 4 + pr(i, 2) * 8;
            const dur = 7 + pr(i, 3) * 8;
            const delay = -pr(i, 4) * dur;
            if (still) return null;
            if (ripples && theme === 'sea') return null;
            if (theme === 'snow')
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#FDBA74]/30"
                  style={{ left, width: size, height: size, top: 0 }}
                  animate={{ y: ['-5vh', '105vh'], x: [0, 24, -18, 10] }}
                  transition={{ duration: dur + 4, repeat: Infinity, ease: 'linear', delay }}
                />
              );
            if (theme === 'sea')
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-full border border-[#FB923C]/20 bg-[#FB923C]/[0.04]"
                  style={{ left, width: size * 2, height: size * 2, bottom: 0 }}
                  animate={{ y: ['0vh', '-95vh'], opacity: [0, 0.9, 0], scale: [0.6, 1.2] }}
                  transition={{ duration: dur, repeat: Infinity, ease: 'easeOut', delay }}
                />
              );
            if (theme === 'city')
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#F59E0B]/60"
                  style={{ left, top: `${pr(i, 5) * 80}%`, width: size / 2 + 2, height: size / 2 + 2, boxShadow: '0 0 10px 2px rgba(245,158,11,0.25)' }}
                  animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 2 + pr(i, 6) * 3, repeat: Infinity, ease: 'easeInOut', delay }}
                />
              );
            return (
              <motion.span
                key={i}
                className="absolute text-[#F7931E]/35"
                style={{ left, bottom: 0 }}
                animate={{ y: ['0vh', '-90vh'], opacity: [0, 1, 0], rotate: [0, 180] }}
                transition={{ duration: dur + 3, repeat: Infinity, ease: 'easeOut', delay }}
              >
                <Sparkles style={{ width: size + 6, height: size + 6 }} />
              </motion.span>
            );
          })}

          {/* scenery along the bottom edge */}
          {theme === 'sea' && (
            <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden">
              {[0, 1].map((k) => (
                <motion.svg
                  key={k}
                  viewBox="0 0 800 80"
                  preserveAspectRatio="none"
                  className="absolute bottom-0 h-full w-[200%]"
                  style={{ opacity: k ? 0.07 : 0.11, bottom: k ? 6 : 0 }}
                  animate={still ? undefined : { x: k ? ['-50%', '0%'] : ['0%', '-50%'] }}
                  transition={{ duration: k ? 16 : 11, repeat: Infinity, ease: 'linear' }}
                >
                  <path d="M0 40 Q 100 4 200 40 T 400 40 T 600 40 T 800 40 V80 H0Z" fill="#FDBA74" />
                </motion.svg>
              ))}
            </div>
          )}
          {theme === 'snow' && (
            <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-40">
              <path d="M0 120 L90 50 L150 85 L260 10 L370 95 L450 40 L560 100 L650 30 L800 120Z" fill="#FDBA74" fillOpacity="0.1" />
              <path d="M0 120 L120 75 L220 105 L330 55 L470 110 L590 70 L700 108 L800 80 V120Z" fill="#F9A8D4" fillOpacity="0.07" />
            </svg>
          )}
          {theme === 'city' && (
            <div className="absolute inset-x-0 bottom-0 h-40 flex items-end gap-1 px-2">
              {CITY_BARS.map((h, i) => (
                <motion.span
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-[#F59E0B]/10 to-[#F472B6]/[0.04]"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 90, damping: 16 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const TripWizard: React.FC<TripWizardProps> = ({ initialDraft, initialStep, onComplete, onExit }) => {
  const reduced = useReducedMotion();

  // Defaults keep the last step to a single tap: a date a month out, five nights
  const [draft, setDraft] = useState<TripDraft>(() => {
    // Opening at "Where" means nothing is chosen yet, so do not carry over an old pick
    const base = initialStep === 0 ? { ...initialDraft, destinationId: '', aiDestination: false } : initialDraft;
    if (base.checkIn && base.checkOut) return base;
    const start = addDaysISO(todayISO(), 30);
    return { ...base, checkIn: start, checkOut: addDaysISO(start, 5) };
  });
  const [step, setStep] = useState(initialStep);
  const [maxStep, setMaxStep] = useState(initialStep);
  const [query, setQuery] = useState('');
  const [hintIdx, setHintIdx] = useState(0);
  const [mood, setMood] = useState(MOODS[0].label);
  const [direction, setDirection] = useState(1);
  const [building, setBuilding] = useState(false);
  const [aiPickedId, setAiPickedId] = useState<string | null>(null);
  const [buildMsg, setBuildMsg] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [view, setView] = useState(() => monthOf(draft.checkIn));

  const headingRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduced || step !== 0 || query) return;
    const id = window.setInterval(() => setHintIdx((i) => i + 1), 2200);
    return () => clearInterval(id);
  }, [reduced, step, query]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // keep the calendar on the month of the chosen start date (e.g. after a preset)
  useEffect(() => {
    setView(monthOf(draft.checkIn));
  }, [draft.checkIn]);
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

  const chooseDestination = (id: string) => {
    setAiPickedId(null);
    patch({
      destinationId: id,
      aiDestination: false,
      ...(id !== draft.destinationId ? { cityIds: [], aiCities: false } : {}),
    });
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

  // ----- step 3: cities -----

  const toggleCity = (id: string) =>
    patch({
      aiCities: false,
      cityIds: draft.cityIds.includes(id) ? draft.cityIds.filter((c) => c !== id) : [...draft.cityIds, id],
    });

  const askAiCities = () => patch({ aiCities: true, cityIds: aiPickCities(draft) });

  // ----- step 4: dates + finish -----

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
    if (final.aiCities) final = { ...final, cityIds: aiPickCities(final) };
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

  const q = query.trim().toLowerCase();
  const moodKeys = MOODS.find((m) => m.label === mood)?.keys ?? [];
  const matches = PLANNER_DESTINATIONS.filter((d) => {
    const hay = `${d.name} ${d.country} ${tagline(d.id)}`.toLowerCase();
    return (!q || hay.includes(q)) && (moodKeys.length === 0 || moodKeys.some((k) => hay.includes(k)));
  });
  const previewId = hoverId ?? draft.destinationId ?? '';
  // Never leave the postcard blank: with nothing hovered or chosen it showcases popular places
  const chosenPreview = getDestination(previewId) ?? (q ? matches[0] : undefined);
  const previewDest = chosenPreview ?? PLANNER_DESTINATIONS[hintIdx % PLANNER_DESTINATIONS.length];
  const showcasing = !chosenPreview;
  const totalTravellers = draft.adults + draft.children;
  const cityNames = draft.cityIds.map((id) => getCities(draft.destinationId).find((c) => c.id === id)?.name).filter(Boolean) as string[];
  const summaryItems: { icon: React.ReactNode; main: string; sub: string; filled: boolean; only?: number; min?: number; quiet?: boolean; forStep?: number }[] = [
    {
      icon: <Calendar className="w-5 h-5" />,
      main: maxStep >= 4 ? `${nights + 1} days` : 'Pick your dates',
      sub: maxStep >= 4 ? '(planned)' : '(when & how long)',
      filled: maxStep >= 4,
      only: 4,
      forStep: 4,
    },
    {
      icon: <Users className="w-5 h-5" />,
      main: draft.travellerType ? `${totalTravellers} traveller${totalTravellers === 1 ? '' : 's'}` : 'Who’s going?',
      sub: draft.travellerType ? `(${draft.travellerType})` : '(solo / couple / friends etc.)',
      filled: Boolean(draft.travellerType),
      forStep: 1,
    },
    {
      icon: <Flower2 className="w-5 h-5" />,
      main: draft.aiPlan
        ? 'AI picks'
        : draft.interests.length
        ? draft.interests.map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id).slice(0, 3).join(', ')
        : maxStep >= 4
        ? 'Anything goes'
        : 'Add interests',
      sub: draft.aiPlan || draft.interests.length || maxStep >= 4 ? '(interests)' : '(beach, food, culture…)',
      filled: draft.aiPlan || draft.interests.length > 0 || maxStep >= 4,
      quiet: true,
      forStep: 2,
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      main: draft.aiCities ? 'AI picks cities' : cityNames.length ? cityNames.join(', ') : 'Choose cities',
      sub: '(cities)',
      filled: cityNames.length > 0,
      min: 3,
      quiet: true,
      forStep: 3,
    },
  ];
  // On the interests step, Continue stays quiet until something is picked (it still works)
  const softContinue = step === 2 && draft.interests.length === 0 && !draft.aiPlan;
  const canContinue = step === 0 ? Boolean(dest) : step === 1 ? draft.travellerType !== '' : step === 3 ? draft.cityIds.length > 0 : true;

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

  const heading = (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={`text-3xl sm:text-4xl tracking-tight text-[#1E2022] focus:outline-none leading-tight ${step === 1 ? 'font-bold' : 'font-semibold'}`}
        >
          {copy.pre} <span className={`text-saffron-gradient ${step === 0 ? '' : ''}`}>{copy.em}</span>
        </h1>
        <p className={`font-medium text-[#6B7280] max-w-xl ${step === 1 ? 'mt-1.5 text-[15px]' : 'mt-2 text-md'}`}>{copy.sub}</p>
      </div>
    </div>
  );

  // ---------- wizard ----------
  return (
    <section className="relative pt-6 lg:pt-8 pb-32">
      <DestinationScene dest={getDestination(hoverId ?? draft.destinationId)} mark={step === 0 ? previewDest : getDestination(draft.destinationId)} reduced={reduced} ripples={step === 1 || step === 2} dimMark={step === 1 || step === 2} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Back · progress tab · chosen place (the spot the picked card flies into) */}
        <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? onExit() : goTo(step - 1))}
            className="group justify-self-start inline-flex items-center gap-2 p-1.5 sm:pr-4 rounded-full bg-white border border-[#1E2022]/10 shadow-sm text-[17px] font-medium text-[#1E2022] hover:border-[#C2571A]/40 cursor-pointer transition-colors"
            aria-label={step === 0 ? 'Home' : 'Back'}
          >
            <span className="w-8 h-8 rounded-full bg-[#1E2022]/6 group-hover:bg-[#C2571A] group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline">{step === 0 ? 'Home' : 'Back'}</span>
          </button>

          <nav aria-label="Trip setup progress" className="justify-self-center min-w-0">
            <div
              className="flex items-center gap-3 h-12 pl-2 pr-5 rounded-full bg-white border border-[#1E2022]/10 shadow-sm"
              role="group"
              aria-label={`Step ${step + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[step]}`}
            >
              <span className="relative w-8 h-8 shrink-0" aria-hidden>
                <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(30,32,34,0.1)" strokeWidth="3" />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="13"
                    fill="none"
                    stroke="#E5501A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: (step + 1) / STEP_LABELS.length }}
                    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums text-[#1E2022]">{step + 1}</span>
              </span>
              <span className="relative block h-9 w-20 sm:w-24 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={step}
                    initial={{ y: reduced ? 0 : direction * 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: reduced ? 0 : direction * -16, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="absolute inset-0 flex flex-col justify-center leading-tight"
                  >
                    <span className="text-[17px] font-medium text-[#1E2022]">{STEP_LABELS[step]}</span>
                    <span className="text-[11px] text-[#9CA3AF]">of {STEP_LABELS.length}</span>
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </nav>

          <button
            type="button"
            onClick={() => goTo(0)}
            className="justify-self-end flex items-center gap-2 p-1 sm:pr-4 rounded-full bg-white border border-[#1E2022]/25 shadow-sm hover:border-[#C2571A]/50 cursor-pointer transition-colors"
            aria-label="Change destination"
          >
            <div
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
            <span className="hidden sm:inline text-[17px] font-medium text-[#1E2022]">{dest ? dest.name : 'Destination'}</span>
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
                <div className="mt-7 grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-8 xl:gap-14 items-start">
                  {/* ---- left: filter + editorial index ---- */}
                  <div className="min-w-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (q && matches[0]) chooseDestination(matches[0].id);
                      }}
                      className="relative max-w-2xl"
                    >
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search destinations"
                        autoComplete="off"
                        className="w-full h-14 sm:h-16 pl-14 pr-28 rounded-full bg-white border border-[#1E2022]/8 shadow-[0_10px_35px_-15px_rgba(30,32,34,0.3)] text-base font-medium text-[#1E2022] focus:outline-none focus:border-[#F7931E] focus:ring-4 focus:ring-[#F7931E]/20 transition"
                      />
                      {/* Static lead-in + place names that roll upward */}
                      {!query && (
                        <div
                          className="absolute left-14 right-28 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[17px] pointer-events-none overflow-hidden h-7"
                          aria-hidden
                        >
                          <span className="font-Regular leading-7 text-[#9CA3AF] whitespace-nowrap">Search destination</span>
                          <span className="relative flex-1 h-7 overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={hintIdx}
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '-100%', opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                className="absolute inset-0 leading-7 font-medium text-[#C2571A] whitespace-nowrap"
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
                            className="absolute right-16 sm:right-[4.5rem] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1E2022]/8 hover:bg-[#1E2022]/15 flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                      <button
                        type="submit"
                        aria-label="Choose destination"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full ${brandGrad} text-white flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer`}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </form>

                    {/* mood filters */}
                    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by mood">
                      {MOODS.map((m) => {
                        const on = mood === m.label;
                        return (
                          <button
                            key={m.label}
                            type="button"
                            onClick={() => setMood(m.label)}
                            aria-pressed={on}
                            className="relative px-4 py-1.5 rounded-full text-[15px] font-medium cursor-pointer"
                          >
                            {on && (
                              <motion.span
                                layoutId="mood-pill"
                                className="absolute inset-0 rounded-full bg-[#1E2022]"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                            <span className={`relative transition-colors ${on ? 'text-white' : 'text-[#4B4F55] hover:text-[#1E2022]'}`}>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* the index */}
                    <ol className="mt-3 border-t border-[#1E2022]/10">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {matches.map((d, i) => {
                          const selected = draft.destinationId === d.id;
                          const active = previewId === d.id;
                          return (
                            <motion.li
                              key={d.id}
                              layout
                              initial={{ opacity: 0, x: reduced ? 0 : -24 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: reduced ? 0 : 24 }}
                              transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 26 }}
                              className="border-b border-[#1E2022]/10"
                            >
                              <button
                                type="button"
                                onClick={() => chooseDestination(d.id)}
                                onMouseEnter={() => setHoverId(d.id)}
                                onMouseLeave={() => setHoverId(null)}
                                onFocus={() => setHoverId(d.id)}
                                onBlur={() => setHoverId(null)}
                                aria-pressed={selected}
                                className="group relative w-full flex items-center gap-4 sm:gap-6 py-4 sm:py-5 text-left cursor-pointer"
                              >
                                {/* highlight */}
                                <span
                                  aria-hidden
                                  className={`absolute inset-y-0 -inset-x-3 rounded-2xl transition-colors duration-300 ${selected ? 'bg-[#F7931E]/10' : active ? 'bg-[#1E2022]/[0.04]' : 'bg-transparent'}`}
                                />
                                <span className="relative w-8 text-md font-semibold tabular-nums text-[#9CA3AF]">{String(i + 1).padStart(2, '0')}</span>
                                <img
                                  src={d.image}
                                  alt=""
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0 transition-all duration-500 lg:w-0 lg:opacity-0 lg:-mr-6 ${
                                    active ? 'lg:!w-16 lg:!opacity-100 lg:!mr-0' : ''
                                  }`}
                                />
                                <span className="relative flex-1 min-w-0">
                                  <span
                                    className={`block text-3xl sm:text-4xl font-bold tracking-tight leading-none transition-all duration-[400ms] ease-out motion-reduce:transition-none ${
                                      selected ? 'text-saffron-gradient' : active ? 'text-[#1E2022] translate-x-1 motion-reduce:translate-x-0' : 'text-[#1E2022]/80 lg:text-[#1E2022]/60'
                                    }`}
                                  >
                                    {d.name}
                                  </span>
                                  <span className="mt-1.5 block text-[15px] sm:text-[15px] text-[#6B7280] truncate">
                                    {d.country} · {tagline(d.id)}
                                  </span>
                                </span>
                                <span className="relative shrink-0">
                                  {selected ? (
                                    <motion.span
                                      initial={{ scale: 0, rotate: -90 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                                      className={`flex w-9 h-9 rounded-full ${brandGrad} text-white items-center justify-center shadow-md`}
                                    >
                                      <Check className="w-5 h-5" />
                                    </motion.span>
                                  ) : (
                                    <span className="flex w-9 h-9 rounded-full border border-[#1E2022]/15 items-center justify-center text-[#1E2022] opacity-40 lg:opacity-0 group-hover:opacity-100 group-hover:bg-[#1E2022] group-hover:text-white group-hover:border-[#1E2022] group-hover:-rotate-45 transition-all duration-300">
                                      <ArrowRight className="w-4 h-4" />
                                    </span>
                                  )}
                                </span>
                              </button>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ol>

                    {matches.length === 0 && (
                      <div className="py-14 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-white border border-[#1E2022]/10 shadow-sm flex items-center justify-center text-[#9CA3AF]">
                          <Search className="w-6 h-6" />
                        </div>
                        <p className="mt-4 text-lg font-extrabold text-[#1E2022]">Nothing matches that yet</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuery('');
                            setMood(MOODS[0].label);
                          }}
                          className="mt-3 text-sm font-bold text-[#C2571A] hover:underline cursor-pointer"
                        >
                          Show all destinations
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ---- right: postcard preview ---- */}
                  <div aria-hidden className="hidden lg:block sticky top-8 pt-4 lg:-translate-x-6">
                    <motion.div
                      animate={{ rotate: reduced ? 0 : previewDest ? 2 : -2 }}
                      transition={{ type: 'spring', stiffness: 80, damping: 12 }}
                      className="relative p-3 pb-5 rounded-[1.75rem] bg-white shadow-[0_35px_70px_-25px_rgba(30,32,34,0.55)] border border-[#1E2022]/6"
                    >
                      {/* tape */}
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 rotate-[-3deg] bg-[#FFC94D]/70 backdrop-blur-sm rounded-sm shadow-sm" />
                      <div className="relative aspect-[4/5] rounded-[1.25rem] overflow-hidden bg-gradient-to-br from-[#FFE9CC] to-[#FFD2B8]">
                        <AnimatePresence initial={false}>
                          <motion.img
                            key={previewDest.id}
                            src={previewDest.image}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={{ opacity: 0, scale: 1.15, clipPath: 'inset(0 0 100% 0)' }}
                            animate={{ opacity: 1, scale: 1, clipPath: 'inset(0 0 0% 0)' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        {previewDest && (
                          <>
                            <div className="absolute top-3 right-3 px-2.5 py-2 rounded-md bg-white/95 text-[#1E2022] text-center shadow-md border-2 border-dashed border-[#E5501A]/40">
                              <MapPin className="w-4 h-4 mx-auto text-[#E5501A]" />
                              <span className="block text-[12px] font-bold uppercase">{previewDest.country}</span>
                            </div>
                            {showcasing && (
                              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                                <Sparkles className="w-3 h-3 text-[#FFC94D]" /> Popular pick
                              </span>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <p className="text-3xl font-bold tracking-tight leading-none">{previewDest.name}</p>
                              <p className="mt-1.5 text-[14px] font-medium tracking-wide text-white/85">{tagline(previewDest.id)}</p>
                            </div>
                          </>
                        )}
                      </div>
                      {previewDest && (
                        <div className="mt-4 px-2">
                          <div>
                            <p className="text-[15px] font-semibold text-[#00000]">Experiences</p>
                            <p className="text-base font-extrabold text-[#1E2022]">{previewDest.activities.length}<span className="text-xs font-semibold text-[#6B7280]"> to choose</span></p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="mt-6">
                  {/* segmented picker with a sliding highlight */}
                  <div role="radiogroup" aria-label="Who is travelling" className="inline-flex max-w-full overflow-x-auto p-1.5 rounded-full bg-white border border-[#1E2022]/10 shadow-[0_10px_30px_-18px_rgba(30,32,34,0.35)]" style={{ scrollbarWidth: 'none' }}>
                    {TRAVELLER_TYPES.map((t) => {
                      const selected = draft.travellerType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => chooseTraveller(t)}
                          className={`group relative flex items-center gap-2.5 h-14 pl-2.5 pr-5 sm:pr-7 rounded-full cursor-pointer shrink-0 transition-colors duration-200 ease-out ${selected ? '' : 'hover:bg-[#1E2022]/[0.04]'}`}
                        >
                          {selected && (
                            <motion.span
                              layoutId="who-pill"
                              className="absolute inset-0 rounded-full bg-[#F7931E]/10 border border-[#F7931E]/40"
                              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                            />
                          )}
                          <motion.span
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 transition-[background-color,color,transform] duration-200 ease-out ${
                              selected ? 'bg-[#F7931E]/20 text-[#E5501A]' : 'bg-[#1E2022]/6 text-[#1E2022] group-hover:bg-[#F7931E]/12 group-hover:text-[#C2571A] group-hover:-translate-y-px'
                            }`}
                            animate={selected && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                          >
                            {t.icon}
                          </motion.span>
                          <span className={`relative text-[16px] transition-colors duration-200 ${selected ? 'font-bold text-[#1E2022]' : 'font-medium text-[#4B4F55] group-hover:text-[#1E2022]'}`}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* the crew stage + counters */}
                  <div className="mt-6 grid md:grid-cols-[1.35fr_1fr] gap-5 items-stretch">
                    <div className="relative overflow-hidden rounded-[2rem] border border-[#F7931E]/20 bg-gradient-to-br from-[#FFF7EC] to-[#FFEBD6] p-6 sm:p-8 min-h-[16rem] flex flex-col">
                      <span
                        aria-hidden
                        className="absolute inset-0 opacity-[0.5]"
                        style={{ backgroundImage: 'radial-gradient(rgba(194,87,26,0.18) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                      />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[17px] font-semibold text-[#C2571A]">Your crew</p>
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.p
                              key={draft.travellerType || 'none'}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              className={`mt-1.5 text-lg sm:text-xl text-[#1E2022] leading-snug max-w-sm ${draft.travellerType ? 'font-medium' : 'font-semibold'}`}
                            >
                              {draft.travellerType ? TRAVELLER_CAPTIONS[draft.travellerType] : 'Choose who’s travelling to build your crew'}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                        {draft.travellerType && (
                          <div className="shrink-0 text-right">
                            <span className="relative inline-flex h-14 w-14 overflow-hidden justify-center">
                              <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                  key={totalTravellers}
                                  initial={{ y: '80%', opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: '-80%', opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                  className="text-5xl font-semibold leading-[3.5rem] text-saffron-gradient tabular-nums"
                                >
                                  {totalTravellers}
                                </motion.span>
                              </AnimatePresence>
                            </span>
                            <p className="-mt-1 text-[17px] font-medium text-[#9CA3AF]">{totalTravellers === 1 ? 'Traveller' : 'Travellers'}</p>
                          </div>
                        )}
                      </div>

                      <div className="relative mt-auto pt-8">
                        <div className="flex flex-wrap items-end gap-2.5 min-h-[3.5rem]">
                          {draft.travellerType ? (
                            <AnimatePresence mode="popLayout">
                              {Array.from({ length: draft.adults }).map((_, i) => (
                                <motion.span
                                  key={`a${i}`}
                                  layout
                                  initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                                  transition={{ duration: 0.22, ease: 'easeOut', delay: reduced ? 0 : i * 0.06 }}
                                  className={`w-12 h-12 rounded-full ${brandGrad} text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(229,80,26,0.6)]`}
                                >
                                  <User className="w-5 h-5" />
                                </motion.span>
                              ))}
                              {Array.from({ length: draft.children }).map((_, i) => (
                                <motion.span
                                  key={`c${i}`}
                                  layout
                                  initial={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: reduced ? 1 : 0.85 }}
                                  transition={{ duration: 0.22, ease: 'easeOut', delay: reduced ? 0 : (draft.adults + i) * 0.06 }}
                                  className="w-9 h-9 rounded-full bg-white border-2 border-[#F7931E] text-[#C2571A] flex items-center justify-center shadow-sm"
                                >
                                  <Baby className="w-4 h-4" />
                                </motion.span>
                              ))}
                            </AnimatePresence>
                          ) : (
                            [0, 1, 2, 3].map((i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.22, ease: 'easeOut', delay: reduced ? 0 : i * 0.06 }}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-[#C2571A]/35 bg-[#F7931E]/[0.06] flex items-center justify-center text-[#C2571A]/45"
                              >
                                <User className="w-5 h-5" />
                              </motion.span>
                            ))
                          )}
                        </div>
                        <div className="mt-4 border-t-2 border-dashed border-[#C2571A]/25" />
                      </div>
                    </div>

                    <div
                      style={draft.travellerType ? undefined : { backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(247,147,30,0.09), transparent 65%)' }}
                      className="rounded-[2rem] bg-white border border-[#1E2022]/8 shadow-[0_15px_35px_-22px_rgba(30,32,34,0.4)] p-6 flex flex-col justify-center divide-y divide-[#1E2022]/8"
                    >
                      {draft.travellerType ? (
                        (
                          [
                            { key: 'adults', label: 'Adults', sub: 'Age 12+', min: 1, max: 12 },
                            { key: 'children', label: 'Children', sub: 'Age 0–11', min: 0, max: 8 },
                          ] as const
                        )
                          // Solo, couple and friends trips are adults-only, so there is no children row
                          .filter((row) => row.key !== 'children' || !['solo', 'couple', 'friends'].includes(draft.travellerType))
                          .map((row) => (
                          <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                            <div>
                              <p className="text-[18px] font-semibold text-[#1E2022]">{row.label}</p>
                              <p className="text-md text-[#9CA3AF]">{row.sub}</p>
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
                              <span className="relative w-8 h-8 overflow-hidden text-center">
                                <AnimatePresence mode="popLayout" initial={false}>
                                  <motion.span
                                    key={draft[row.key]}
                                    initial={{ y: 18, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -18, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 text-2xl font-semibold tabular-nums leading-8"
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
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <span className="mx-auto w-12 h-12 rounded-full bg-white border border-[#F7931E]/30 shadow-sm flex items-center justify-center text-[#C2571A]">
                            <Users className="w-5 h-5" />
                          </span>
                          <p className="mt-3 text-[18px] font-semibold text-[#1E2022]">Pick a group above</p>
                          <p className="mt-1 text-[15px] text-[#6B7280]">Then adjust the numbers here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-8">
                  {/* ---- numbered interest index (matches the destination step) ---- */}
                  <ol className="grid md:grid-cols-2 md:gap-x-12 border-t border-[#1E2022]/10 pt-3 max-w-4xl">
                    {INTERESTS.map((it, i) => {
                      const selected = draft.interests.includes(it.id);
                      return (
                        <motion.li
                          key={it.id}
                          initial={{ opacity: 0, x: reduced ? 0 : -24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 26 }}
                          className="border-b border-[#1E2022]/10"
                        >
                          <button
                            type="button"
                            onClick={() => toggleInterest(it.id)}
                            aria-pressed={selected}
                            className="group relative w-full flex items-center gap-4 py-4 sm:py-5 text-left cursor-pointer"
                          >
                            <span
                              aria-hidden
                              className={`absolute inset-y-0 -inset-x-3 rounded-2xl border transition-colors duration-200 ease-out ${selected ? 'bg-[#FFF6EC] border-[#F7931E]/40' : 'bg-transparent border-transparent group-hover:bg-[#1E2022]/[0.04]'}`}
                            />
                            <span className="relative w-7 text-md font-medium tabular-nums text-[#B4B8BF]">{String(i + 1).padStart(2, '0')}</span>
                            <span
                              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white bg-gradient-to-br ${it.grad} saturate-[.8] brightness-[.97] shadow-sm transition-transform duration-200 ease-out group-hover:-rotate-6 group-hover:scale-105 ${selected ? 'scale-105' : ''}`}
                            >
                              {it.icon}
                            </span>
                            <span className="relative flex-1 min-w-0">
                              <span
                                className={`block text-xl sm:text-2xl tracking-tight leading-tight transition-all duration-200 ease-out ${
                                  selected ? 'font-bold text-saffron-gradient' : 'font-semibold text-[#1E2022]/85 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0'
                                }`}
                              >
                                {it.label}
                              </span>
                              <span className="mt-0.5 block text-md sm:text-md text-[#6B7280] truncate">{it.hint}</span>
                            </span>
                            <span className="relative shrink-0">
                              <AnimatePresence mode="wait" initial={false}>
                                {selected ? (
                                  <motion.span
                                    key="on"
                                    initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="flex w-8 h-8 rounded-full bg-[#F7931E]/15 border border-[#F7931E]/50 text-[#C2571A] items-center justify-center"
                                  >
                                    <Check className="w-4 h-4" />
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="off"
                                    initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="flex w-8 h-8 rounded-full border border-[#1E2022]/12 items-center justify-center text-[#1E2022]/55 group-hover:bg-[#1E2022] group-hover:text-white group-hover:border-[#1E2022] transition-colors duration-200 ease-out"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ol>

                  <div className="mt-7 mb-20 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={letAiCustomise}
                      className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-full border-2 border-dashed border-[#C2571A]/30 bg-transparent hover:bg-[#FFF6EC] text-[15px] font-medium text-[#4B4F55] cursor-pointer transition-colors duration-200 ease-out"
                    >
                      <Sparkles className="w-4 h-4 text-[#C2571A]/80 group-hover:rotate-12 transition-transform" />
                      No idea — let AI customise it for me
                      <ArrowRight className="w-4 h-4 text-[#C2571A] group-hover:translate-x-1 transition-transform" />
                    </button>
                    <AnimatePresence>
                      {draft.interests.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          className="px-3.5 py-2 rounded-full bg-[#C2571A]/10 text-[#C2571A] text-md font-medium"
                        >
                          {draft.interests.length} selected
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {step === 3 && (() => {
                const cities = getCities(draft.destinationId);
                const stops = cityStops(draft);
                const aiNames = draft.cityIds.map((id) => cities.find((c) => c.id === id)?.name).filter(Boolean);
                const CARD_POS = ['20% 30%', '80% 45%', '50% 90%', '10% 75%'];
                return (
                  <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_21rem] gap-8 xl:gap-12 items-start">
                    {/* ---- city cards ---- */}
                    <div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {cities.map((c, i) => {
                          const selected = draft.cityIds.includes(c.id);
                          const order = draft.cityIds.indexOf(c.id) + 1;
                          const acts = (dest?.activities ?? []).filter((a) => c.activityIds.includes(a.id));
                          const cats = Array.from(new Set(acts.map((a) => a.category))).slice(0, 3);
                          return (
                            <motion.button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCity(c.id)}
                              aria-pressed={selected}
                              initial={{ opacity: 0, y: 28, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: i * 0.07, type: 'spring', stiffness: 240, damping: 24 }}
                              whileHover={reduced ? undefined : { y: -4 }}
                              whileTap={reduced ? undefined : { scale: 0.98 }}
                              className={`group relative overflow-hidden rounded-[1.75rem] text-left cursor-pointer bg-white border transition-shadow duration-300 ${
                                selected
                                  ? 'border-[#F26B1D] ring-2 ring-[#F26B1D]/40 shadow-[0_22px_45px_-20px_rgba(229,80,26,0.55)]'
                                  : 'border-[#1E2022]/10 shadow-[0_14px_32px_-22px_rgba(30,32,34,0.45)] hover:shadow-[0_22px_45px_-22px_rgba(30,32,34,0.55)]'
                              }`}
                            >
                              <span className="relative block h-28 overflow-hidden bg-[#EAE6DF]">
                                {dest && (
                                  <img
                                    src={dest.image}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 w-full h-full object-cover scale-[1.6] transition-transform duration-700 group-hover:scale-[1.75]"
                                    style={{ objectPosition: CARD_POS[i % CARD_POS.length] }}
                                  />
                                )}
                                <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                                <span className="absolute bottom-3 left-4 right-14 text-xl font-regular text-white leading-tight drop-shadow">{c.name}</span>
                                <AnimatePresence>
                                  {selected && (
                                    <motion.span
                                      initial={{ scale: 0, rotate: -90 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                                      className={`absolute top-3 right-3 w-9 h-9 rounded-full ${brandGrad} text-white flex items-center justify-center text-sm font-extrabold shadow-lg ring-4 ring-white/30`}
                                      title={`Stop ${order}`}
                                    >
                                      {order}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </span>
                              <span className="block p-4">
                                <span className="block text-md text-[#6B7280] leading-snug">{c.blurb}</span>
                                <span className="mt-3 flex flex-wrap items-center gap-1.5">
                                  {cats.map((cat) => (
                                    <span key={cat} className="px-2 py-0.5 rounded-full bg-[#1E2022]/6 text-[16px] font-medium text-[#4B4F55]">
                                      {cat}
                                    </span>
                                  ))} 
                                  <span className="text-[16px] font-regular text-[#9CA3AF]">{acts.length} experiences</span>
                                </span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={askAiCities}
                          className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full border-2 border-dashed border-[#C2571A]/45 bg-[#FFF6EC] hover:bg-[#FFEBD6] text-md font-medium text-[#1E2022] cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-[#C2571A] group-hover:rotate-12 group-hover:scale-125 transition-transform" />
                          No idea — ask AI to choose the cities
                        </button>
                        <AnimatePresence mode="wait">
                          {draft.aiCities && aiNames.length > 0 && (
                            <motion.p
                              key={aiNames.join('|')}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-sm font-semibold text-[#C2571A] flex items-center gap-1.5"
                              aria-live="polite"
                            >
                              <Check className="w-4 h-4" /> AI picked {aiNames.join(' + ')}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* ---- your route ---- */}
                    <aside aria-label="Your route" className="rounded-[1.75rem] bg-white border border-[#1E2022]/10 shadow-[0_20px_45px_-25px_rgba(30,32,34,0.45)] p-5 lg:sticky lg:top-8">
                      <p className="text-[18px] font-semibold text-[#C2571A]">Your route</p>
                      <ol className="relative mt-4">
                        <span aria-hidden className="absolute left-[19.5px] top-3 bottom-3 border-l border-dashed border-[#1E2022]/15" />
                        <li className="relative flex items-center gap-3 pb-7">
                          <span className="relative z-10 w-10 h-10 rounded-full bg-[#F3F3F3] text-[#4B4F55] flex items-center justify-center shrink-0">
                            <Plane className="w-6 h-6" />
                          </span>
                          <span className="text-md text-[#6B7280]">Arrive in {dest?.name}</span>
                        </li>
                        {stops.length === 0 && (
                          <li className="relative flex items-center gap-3 pb-7">
                            <span className="relative z-10 w-8 h-8 mx-1 rounded-full border-2 border-dashed border-[#C2571A]/40 bg-white flex items-center justify-center shrink-0 text-[#C2571A]/50">
                              <MapPin className="w-4 h-4" />
                            </span>
                            <span className="text-md font-medium text-[#9CA3AF]">Pick at least one city</span>
                          </li>
                        )}
                        <AnimatePresence initial={false}>
                          {stops.map((st, i) => (
                            <motion.li
                              key={st.city.id}
                              layout
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 12 }}
                              className="relative"
                            >
                              {i > 0 && (
                                <div className="flex items-center gap-3 pb-5">
                                  <span className="relative z-10 w-8 h-8 mx-1 rounded-full bg-[#FFF6EC] text-[#C2571A] flex items-center justify-center shrink-0">
                                    <Car className="w-4 h-4" />
                                  </span>
                                  <span className="text-[14px] text-[#6B7280]">{transferLabel(draft.destinationId, st.city.name)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-3 pb-7">
                                <span className={`relative z-10 w-8 h-8 mx-1 rounded-full ${brandGrad} text-white flex items-center justify-center shrink-0 text-xs font-extrabold`}>{i + 1}</span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-extrabold text-[#1E2022] truncate">{st.city.name}</span>
                                  <span className="block text-xs text-[#6B7280]">
                                    {st.nights} night{st.nights === 1 ? '' : 's'}
                                  </span>
                                </span>
                              </div>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                        <li className="relative flex items-center gap-3">
                          <span className="relative z-10 w-10 h-10 rounded-full bg-[#F3F3F3] text-[#4B4F55] flex items-center justify-center shrink-0">
                            <Plane className="w-6 h-6 rotate-45" />
                          </span>
                          <span className="text-md text-[#6B7280]">Departure</span>
                        </li>
                      </ol>
                      <p className="mt-4 pt-4 border-t border-[#1E2022]/8 text-md text-[#9CA3AF]">
                        Nights are shared across your cities you can change them on the plan page.
                      </p>
                    </aside>
                  </div>
                );
              })()}

              {step === 4 && (
                <div className="mt-8 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 sm:gap-6 items-start">
                  {/* ---- calendar with the trip range painted on ---- */}
                  {(() => {
                    const today = todayISO();
                    const lead = new Date(view.y, view.m, 1).getDay();
                    const count = new Date(view.y, view.m + 1, 0).getDate();
                    const title = new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    const atCurrent = view.y === monthOf(today).y && view.m === monthOf(today).m;
                    const shift = (delta: number) =>
                      setView((v) => {
                        const d = new Date(v.y, v.m + delta, 1);
                        return { y: d.getFullYear(), m: d.getMonth() };
                      });
                    return (
                      <div className="rounded-[2rem] bg-white border border-[#1E2022]/8 shadow-[0_20px_45px_-25px_rgba(30,32,34,0.45)] p-5 sm:p-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[16px] font-semibold text-[#C2571A]">Start Date</p>
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.h2
                                key={title}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="mt-0.5 text-xl font-bold text-[#1E2022]"
                              >
                                {title}
                              </motion.h2>
                            </AnimatePresence>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => shift(-1)} disabled={atCurrent} aria-label="Previous month" className={stepperBtn}>
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => shift(1)} aria-label="Next month" className={stepperBtn}>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-7 text-center text-[14px] font-medium  tracking-wider text-[#9CA3AF]">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
                            <span key={i}>{w}</span>
                          ))}
                        </div>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={title}
                            initial={{ opacity: 0, x: reduced ? 0 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: reduced ? 0 : -20 }}
                            transition={{ duration: 0.18 }}
                            className="mt-2 grid grid-cols-7 gap-y-1.5"
                          >
                            {Array.from({ length: lead }).map((_, i) => (
                              <span key={`b${i}`} />
                            ))}
                            {Array.from({ length: count }).map((_, i) => {
                              const day = i + 1;
                              const iso = isoOf(view.y, view.m, day);
                              const past = iso < today;
                              const isStart = iso === draft.checkIn;
                              const isEnd = iso === draft.checkOut;
                              const between = iso > draft.checkIn && iso < draft.checkOut;
                              return (
                                <div
                                  key={iso}
                                  className={`flex justify-center ${between ? 'bg-[#F7931E]/[0.16]' : ''} ${isStart ? 'bg-[linear-gradient(to_right,transparent_50%,rgba(247,147,30,0.16)_50%)]' : ''} ${
                                    isEnd ? 'bg-[linear-gradient(to_left,transparent_50%,rgba(247,147,30,0.16)_50%)]' : ''
                                  }`}
                                >
                                  <button
                                    type="button"
                                    disabled={past}
                                    onClick={() => setStart(iso)}
                                    aria-label={formatDate(iso)}
                                    aria-pressed={isStart}
                                    className={`w-10 h-10 rounded-full text-md font-semibold flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed ${
                                      isStart
                                        ? `${brandGrad} text-white font-bold shadow-[0_8px_18px_-6px_rgba(229,80,26,0.7)]`
                                        : isEnd
                                        ? 'bg-[#1E2022] text-white font-bold'
                                        : past
                                        ? 'text-[#1E2022]/20'
                                        : 'text-[#1E2022] hover:bg-[#1E2022]/8'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                </div>
                              );
                            })}
                          </motion.div>
                        </AnimatePresence>

                        <div className="mt-6 flex flex-wrap gap-2">
                          {START_PRESETS.map((p) => {
                            const iso = addDaysISO(today, p.days);
                            const on = draft.checkIn === iso;
                            return (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => setStart(iso)}
                                aria-pressed={on}
                                className={`px-4 py-2 rounded-full text-[15px] font-semibold cursor-pointer transition ${on ? 'bg-[#1E2022] text-white' : 'bg-[#1E2022]/6 hover:bg-[#1E2022]/12'}`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col gap-5 sm:gap-6">
                    {/* nights */}
                    <div className="rounded-[2rem] bg-white border border-[#1E2022]/8 shadow-[0_20px_45px_-25px_rgba(30,32,34,0.45)] p-6 sm:p-7">
                      <label htmlFor="wiz-nights" className="text-[17px] font-semibold text-[#C2571A]">
                        How many nights?
                      </label>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <p className="flex items-baseline gap-1.5">
                          <span className="relative inline-flex h-16 min-w-[2.75rem] overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={nights}
                                initial={{ y: '80%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '-80%', opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className="text-6xl font-bold leading-[4rem] tabular-nums text-saffron-gradient"
                              >
                                {nights}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                          <span className="text-md font-medium text-[#6B7280]">{nights === 1 ? 'Night' : 'Nights'}</span>
                        </p>
                        <div className="flex gap-2 pb-2">
                          <button type="button" onClick={() => setNights(nights - 1)} disabled={nights <= 1} className={`${stepperBtn} !w-9 !h-9`} aria-label="Fewer nights">
                            <Minus className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setNights(nights + 1)} disabled={nights >= MAX_TRIP_DAYS - 1} className={`${stepperBtn} !w-9 !h-9`} aria-label="More nights">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input
                        id="wiz-nights"
                        type="range"
                        min={1}
                        max={MAX_TRIP_DAYS - 1}
                        value={nights}
                        onChange={(e) => setNights(Number(e.target.value))}
                        style={{ '--p': `${((nights - 1) / (MAX_TRIP_DAYS - 2)) * 100}%` } as React.CSSProperties}
                        className="mt-3 w-full h-5 appearance-none bg-transparent cursor-pointer focus:outline-none
                          [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#E5501A_var(--p),rgba(30,32,34,0.1)_var(--p))]
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#E5501A]
                          [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-[#1E2022]/10
                          [&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-[#E5501A]
                          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#E5501A]
                          focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-[#F7931E]/25"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {NIGHT_PRESETS.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setNights(n)}
                            aria-pressed={nights === n}
                            className={`px-4 py-2 rounded-full text-md font-semibold cursor-pointer transition ${nights === n ? 'bg-[#1E2022] text-white' : 'bg-[#1E2022]/6 hover:bg-[#1E2022]/12'}`}
                          >
                            {n} nights
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* boarding pass */}
                    <div className="relative rounded-[2rem] bg-gradient-to-br from-[#1E2022] to-[#3a2a22] text-white p-6 sm:p-7 shadow-[0_28px_60px_-24px_rgba(30,32,34,0.7)] overflow-hidden">
                      <span aria-hidden className="absolute -left-3 top-[58%] w-6 h-6 rounded-full bg-[#FBF7F2]" />
                      <span aria-hidden className="absolute -right-3 top-[58%] w-6 h-6 rounded-full bg-[#FBF7F2]" />
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Depart</p>
                          <p className="text-xl font-extrabold leading-tight">{formatDate(draft.checkIn)}</p>
                          <p className="text-xs text-white/60">{startWeekday}</p>
                        </div>
                        <div className="relative flex-1 h-8 flex items-center" aria-hidden>
                          <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/25" />
                          <motion.span
                            className="absolute text-[#FFC94D]"
                            animate={reduced ? { left: '45%' } : { left: ['0%', '85%'] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
                          >
                            <Plane className="w-5 h-5" />
                          </motion.span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Return</p>
                          <p className="text-xl font-extrabold leading-tight">{formatDate(draft.checkOut)}</p>
                          <p className="mt-0.5 text-sm font-semibold text-white/90">{nights + 1} days</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-5 border-t-2 border-dashed border-white/15 flex items-center justify-between gap-4">
                        <p className="flex items-center gap-2 text-[13px] font-medium text-white/75">
                          <MapPin className="w-4 h-4 text-[#FFC94D]" />
                          {dest ? `${dest.name}, ${dest.country}` : 'AI picks your destination'}
                        </p>
                        <p className="text-xs font-medium text-white/55">
                          {totalTravellers} traveller{totalTravellers === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* AI toggle */}
                    <label
                      className={`flex items-start gap-4 p-4 rounded-[1.75rem] border cursor-pointer transition-all duration-200 ease-out ${
                        draft.aiPlan ? 'bg-gradient-to-r from-[#FFF4E0] to-[#FFE3D2] border-[#F7931E]/50 shadow-md' : 'bg-transparent border-[#1E2022]/10 hover:border-[#C2571A]/40 shadow-none'
                      }`}
                    >
                      <input type="checkbox" checked={draft.aiPlan} onChange={(e) => patch({ aiPlan: e.target.checked })} className="sr-only peer" />
                      <span
                        aria-hidden
                        className={`mt-0.5 w-12 h-7 rounded-full p-1 flex shrink-0 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#F7931E] ${draft.aiPlan ? 'bg-[#E5501A] justify-end' : 'bg-[#1E2022]/15 justify-start'}`}
                      >
                        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 rounded-full bg-white shadow" />
                      </span>
                      <span>
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#1E2022]">
                          <Sparkles className="w-4 h-4 text-[#C2571A]" /> Pre-fill my days with AI picks
                        </span>
                        <span className="block mt-0.5 text-sm text-[#6B7280]">Start with a suggested plan, then swap anything on the next page</span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating trip tray */}
      <AnimatePresence>
        {(step > 0 || canContinue) && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="sticky bottom-4 z-30 mt-8 px-4 sm:px-6 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 p-2 pr-2 max-w-full rounded-full bg-white/90 backdrop-blur-xl border border-[#1E2022]/8 shadow-[0_24px_60px_-18px_rgba(30,32,34,0.45)]">
              {/* place */}
              <div className="flex items-center gap-2.5 pl-1 pr-3 sm:pr-4 min-w-0">
                <span className="relative w-11 h-11 rounded-full overflow-hidden bg-[#1E2022]/6 flex items-center justify-center shrink-0 ring-2 ring-white shadow">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {dest ? (
                      <motion.img
                        key={dest.id}
                        src={dest.image}
                        alt=""
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.3, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="w-5 h-5 text-[#9CA3AF]" />
                    )}
                  </AnimatePresence>
                </span>
                <span className="hidden sm:block min-w-0 leading-tight">
                  <span className="block text-[17px] font-extrabold text-[#1E2022] truncate">{dest ? dest.name : 'Pick a place'}</span>
                  <span className="block text-[14px] text-[#9CA3AF] truncate">{dest ? dest.country : 'Nothing chosen yet'}</span>
                </span>
              </div>

              {/* trip details: dashed = still to fill, solid = done */}
              <div className={`hidden md:flex items-center min-w-0 ${step === 4 ? 'gap-3' : 'gap-2'}`}>
                {/* dates are only entered on the last step, so that chip only appears there */}
                {summaryItems.filter((it) => (it.only === undefined || it.only === step) && (it.min === undefined || step >= it.min)).map((it) => (
                  <motion.span
                    key={it.sub}
                    layout
                    className={`inline-flex items-center gap-2 h-11 px-4 rounded-full min-w-0 transition-colors ${
                      step === 4 && it.quiet ? 'text-[14px] font-medium max-w-[11rem]' : 'text-md font-medium max-w-[15rem]'
                    } ${
                      it.filled
                        ? step === 4 && it.quiet
                          ? 'bg-[#1E2022]/[0.04] text-[#4B4F55] border border-[#1E2022]/10'
                          : 'bg-[#F7931E]/12 text-[#1E2022] border border-[#F7931E]/30'
                        : step === 1 && it.forStep === 1
                        ? 'border border-dashed border-[#F7931E]/60 bg-[#F7931E]/[0.06] text-[#C2571A]'
                        : 'border border-dashed border-[#1E2022]/15 text-[#9CA3AF]'
                    }`}
                  >
                    <span className={`shrink-0 ${it.filled ? 'text-[#C2571A]' : ''}`}>{it.icon}</span>
                    <span className="truncate">{it.main}</span>
                  </motion.span>
                ))}
              </div>

              {/* action */}
              {step < STEP_LABELS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => goTo(step + 1)}
                  aria-label="Continue"
                  className={`group ml-1 h-12 rounded-full ${brandGrad} text-white text-md font-medium inline-flex items-center justify-center gap-2 pl-6 pr-4 shadow-[0_10px_30px_-8px_rgba(229,80,26,0.6)] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 cursor-pointer transition-all duration-300 ease-out ${softContinue ? 'opacity-60 grayscale-[.6] shadow-none' : ''}`}
                >
                  Continue
                  <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-[3px] group-disabled:translate-x-0 motion-reduce:group-hover:translate-x-0" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className={`group ml-1 h-12 rounded-full ${brandGrad} text-white text-md font-medium inline-flex items-center justify-center gap-2 pl-6 pr-4 shadow-[0_10px_30px_-8px_rgba(229,80,26,0.7)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(229,80,26,0.8)] motion-reduce:hover:translate-y-0 cursor-pointer transition-all duration-200 ease-out`}
                >
                  Build my trip
                  <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 group-hover:translate-x-[3px] motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:translate-x-0 transition-transform duration-200 ease-out" />
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};
