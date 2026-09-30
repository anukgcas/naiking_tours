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
  solo: 'Just you — total freedom to roam.',
  couple: 'Two of you — cosy, romantic pacing.',
  family: 'Family fun — kid-friendly picks first.',
  friends: 'A group getaway — shared adventures.',
};

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
  { pre: 'Where are you', em: 'going?', sub: 'Tell us your dream destination and we’ll craft the perfect trip for you.' },
  { pre: 'Who’s', em: 'travelling?', sub: 'One tap — you can fine-tune the numbers below.' },
  { pre: 'What are you', em: 'into?', sub: 'Pick as many as you like. We’ll show these first.' },
  { pre: 'When and', em: 'for how long?', sub: 'We’ve pre-filled a sensible plan — change anything you like.' },
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

/** Ambient, destination-themed scenery that fills the empty page space and changes with the place you hover or pick */
const DestinationScene: React.FC<{ dest?: { id: string; name: string }; mark?: { id: string; name: string }; reduced: boolean | null }> = ({ dest, mark, reduced }) => {
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
            style={{ WebkitTextStroke: '2px rgba(194,87,26,0.08)' }}
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

  const headingRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduced || step !== 0 || query) return;
    const id = window.setInterval(() => setHintIdx((i) => i + 1), 2200);
    return () => clearInterval(id);
  }, [reduced, step, query]);
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

  const chooseDestination = (id: string) => {
    setAiPickedId(null);
    patch({ destinationId: id, aiDestination: false });
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
  const summaryItems = [
    {
      icon: <Calendar className="w-5 h-5" />,
      main: maxStep >= 3 ? `${nights + 1} days` : 'Pick your dates',
      sub: maxStep >= 3 ? '(planned)' : '(when & how long)',
      filled: maxStep >= 3,
    },
    {
      icon: <Users className="w-5 h-5" />,
      main: draft.travellerType ? `${totalTravellers} traveller${totalTravellers === 1 ? '' : 's'}` : 'Who’s going?',
      sub: draft.travellerType ? `(${draft.travellerType})` : '(solo / couple / friends etc.)',
      filled: Boolean(draft.travellerType),
    },
    {
      icon: <Flower2 className="w-5 h-5" />,
      main: draft.aiPlan
        ? 'AI picks'
        : draft.interests.length
        ? draft.interests.map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id).slice(0, 3).join(', ')
        : maxStep >= 3
        ? 'Anything goes'
        : 'Add interests',
      sub: draft.aiPlan || draft.interests.length || maxStep >= 3 ? '(interests)' : '(beach, food, culture…)',
      filled: draft.aiPlan || draft.interests.length > 0 || maxStep >= 3,
    },
  ];
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

  const heading = (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022] focus:outline-none leading-tight"
        >
          {copy.pre} <span className={`text-saffron-gradient ${step === 0 ? 'italic pr-1' : ''}`}>{copy.em}</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#6B7280] max-w-xl">{copy.sub}</p>
      </div>
    </div>
  );

  // ---------- wizard ----------
  return (
    <section className="relative pt-6 lg:pt-8 pb-32">
      <DestinationScene dest={getDestination(hoverId ?? draft.destinationId)} mark={step === 0 ? previewDest : getDestination(draft.destinationId)} reduced={reduced} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <span className="text-sm font-extrabold text-[#1E2022]">{STEP_LABELS[step]}</span>
                    <span className="text-[11px] text-[#9CA3AF]">of {STEP_LABELS.length}</span>
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </nav>

          <button
            type="button"
            onClick={() => goTo(0)}
            className="justify-self-end flex items-center gap-2 p-1 sm:pr-4 rounded-full bg-white border border-[#1E2022]/10 shadow-sm hover:border-[#C2571A]/50 cursor-pointer transition-colors"
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
                        className="w-full h-14 sm:h-16 pl-14 pr-28 rounded-full bg-white border border-[#1E2022]/8 shadow-[0_10px_35px_-15px_rgba(30,32,34,0.3)] text-base font-semibold text-[#1E2022] focus:outline-none focus:border-[#F7931E] focus:ring-4 focus:ring-[#F7931E]/20 transition"
                      />
                      {/* Static lead-in + place names that roll upward */}
                      {!query && (
                        <div
                          className="absolute left-14 right-28 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-base pointer-events-none overflow-hidden h-7"
                          aria-hidden
                        >
                          <span className="font-medium leading-7 text-[#9CA3AF] whitespace-nowrap">Search destination</span>
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
                            className="relative px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer"
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
                    <ol className="mt-5 border-t border-[#1E2022]/10">
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
                                <span className="relative w-8 text-sm font-bold tabular-nums text-[#9CA3AF]">{String(i + 1).padStart(2, '0')}</span>
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
                                    className={`block text-3xl sm:text-4xl font-extrabold tracking-tight leading-none transition-all duration-300 ${
                                      selected ? 'text-saffron-gradient' : active ? 'text-[#1E2022] translate-x-2' : 'text-[#1E2022]/80 lg:text-[#1E2022]/35'
                                    }`}
                                  >
                                    {d.name}
                                  </span>
                                  <span className="mt-1.5 block text-xs sm:text-sm text-[#6B7280] truncate">
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
                  <div aria-hidden className="hidden lg:block sticky top-8 pt-4">
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
                              <span className="block text-[9px] font-extrabold uppercase tracking-widest">{previewDest.country}</span>
                            </div>
                            {showcasing && (
                              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                                <Sparkles className="w-3 h-3 text-[#FFC94D]" /> Popular pick
                              </span>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <p className="text-3xl font-extrabold tracking-tight leading-none">{previewDest.name}</p>
                              <p className="mt-1.5 text-xs text-white/85">{tagline(previewDest.id)}</p>
                            </div>
                          </>
                        )}
                      </div>
                      {previewDest && (
                        <div className="mt-4 px-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Experiences</p>
                            <p className="text-base font-extrabold text-[#1E2022]">{previewDest.activities.length}<span className="text-xs font-semibold text-[#6B7280]"> to choose</span></p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="mt-8">
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
                          className="relative flex items-center gap-2.5 h-14 pl-2.5 pr-5 sm:pr-7 rounded-full cursor-pointer shrink-0"
                        >
                          {selected && (
                            <motion.span
                              layoutId="who-pill"
                              className={`absolute inset-0 rounded-full ${brandGrad} shadow-[0_10px_25px_-8px_rgba(229,80,26,0.65)]`}
                              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
                            />
                          )}
                          <motion.span
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 transition-colors ${
                              selected ? 'bg-white text-[#E5501A]' : 'bg-[#1E2022]/6 text-[#1E2022]'
                            }`}
                            animate={selected && !reduced ? { rotate: [0, -14, 14, 0], scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            {t.icon}
                          </motion.span>
                          <span className={`relative text-base font-extrabold transition-colors ${selected ? 'text-white' : 'text-[#1E2022]'}`}>{t.label}</span>
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
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2571A]">Your crew</p>
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.p
                              key={draft.travellerType || 'none'}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              className="mt-1.5 text-lg sm:text-xl font-extrabold text-[#1E2022] leading-snug max-w-sm"
                            >
                              {draft.travellerType ? TRAVELLER_CAPTIONS[draft.travellerType] : 'Choose who’s travelling to build your crew.'}
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
                                  className="text-5xl font-extrabold leading-[3.5rem] text-saffron-gradient tabular-nums"
                                >
                                  {totalTravellers}
                                </motion.span>
                              </AnimatePresence>
                            </span>
                            <p className="-mt-1 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">{totalTravellers === 1 ? 'traveller' : 'travellers'}</p>
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
                                  initial={{ scale: 0, y: 24 }}
                                  animate={reduced ? { scale: 1, y: 0 } : { scale: 1, y: [0, -5, 0] }}
                                  exit={{ scale: 0, y: -20 }}
                                  transition={{
                                    scale: { type: 'spring', stiffness: 420, damping: 16 },
                                    y: { delay: 0.5 + i * 0.15, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                                  }}
                                  className={`w-12 h-12 rounded-full ${brandGrad} text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(229,80,26,0.6)]`}
                                >
                                  <User className="w-5 h-5" />
                                </motion.span>
                              ))}
                              {Array.from({ length: draft.children }).map((_, i) => (
                                <motion.span
                                  key={`c${i}`}
                                  layout
                                  initial={{ scale: 0, y: 24 }}
                                  animate={reduced ? { scale: 1, y: 0 } : { scale: 1, y: [0, -4, 0] }}
                                  exit={{ scale: 0, y: -20 }}
                                  transition={{
                                    scale: { type: 'spring', stiffness: 420, damping: 16 },
                                    y: { delay: 0.7 + i * 0.15, duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                                  }}
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
                                animate={reduced ? undefined : { opacity: [0.35, 0.9, 0.35] }}
                                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-[#C2571A]/40 flex items-center justify-center text-[#C2571A]/50"
                              >
                                <User className="w-5 h-5" />
                              </motion.span>
                            ))
                          )}
                        </div>
                        <div className="mt-4 border-t-2 border-dashed border-[#C2571A]/25" />
                      </div>
                    </div>

                    <div className="rounded-[2rem] bg-white border border-[#1E2022]/8 shadow-[0_15px_35px_-22px_rgba(30,32,34,0.4)] p-6 flex flex-col justify-center divide-y divide-[#1E2022]/8">
                      {draft.travellerType ? (
                        (
                          [
                            { key: 'adults', label: 'Adults', sub: 'Age 12+', min: 1, max: 12 },
                            { key: 'children', label: 'Children', sub: 'Age 0–11', min: 0, max: 8 },
                          ] as const
                        ).map((row) => (
                          <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                            <div>
                              <p className="text-base font-extrabold text-[#1E2022]">{row.label}</p>
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
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <span className="mx-auto w-12 h-12 rounded-full bg-[#1E2022]/6 flex items-center justify-center text-[#9CA3AF]">
                            <Users className="w-5 h-5" />
                          </span>
                          <p className="mt-3 text-sm font-bold text-[#1E2022]">Pick a group above</p>
                          <p className="mt-1 text-xs text-[#6B7280]">Then adjust adults and children here.</p>
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Floating trip tray */}
      <AnimatePresence>
        {(step > 0 || canContinue) && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="sticky bottom-4 z-30 mt-2 px-4 sm:px-6 flex justify-center"
          >
            <div className="flex items-center gap-2 sm:gap-3 p-2 pr-2 max-w-full rounded-full bg-white/90 backdrop-blur-xl border border-[#1E2022]/8 shadow-[0_24px_60px_-18px_rgba(30,32,34,0.45)]">
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
                  <span className="block text-sm font-extrabold text-[#1E2022] truncate">{dest ? dest.name : 'Pick a place'}</span>
                  <span className="block text-[11px] text-[#9CA3AF] truncate">{dest ? dest.country : 'Nothing chosen yet'}</span>
                </span>
              </div>

              {/* trip details: dashed = still to fill, solid = done */}
              <div className="hidden md:flex items-center gap-2">
                {summaryItems.map((it) => (
                  <motion.span
                    key={it.sub}
                    layout
                    className={`inline-flex items-center gap-2 h-11 px-4 rounded-full text-sm font-bold max-w-[15rem] transition-colors ${
                      it.filled
                        ? 'bg-[#F7931E]/12 text-[#1E2022] border border-[#F7931E]/30'
                        : 'border border-dashed border-[#1E2022]/25 text-[#9CA3AF]'
                    }`}
                  >
                    <span className={`shrink-0 ${it.filled ? 'text-[#C2571A]' : ''}`}>{it.icon}</span>
                    <span className="truncate">{it.main}</span>
                  </motion.span>
                ))}
              </div>

              {/* action */}
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => goTo(step + 1)}
                  aria-label="Continue"
                  className={`group ml-1 h-12 rounded-full ${brandGrad} text-white text-sm font-bold inline-flex items-center justify-center gap-2 pl-6 pr-4 shadow-[0_10px_30px_-8px_rgba(229,80,26,0.6)] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 cursor-pointer transition-all`}
                >
                  Continue
                  <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className={`group ml-1 h-12 rounded-full ${brandGrad} text-white text-sm font-bold inline-flex items-center justify-center gap-2 pl-6 pr-4 shadow-[0_10px_30px_-8px_rgba(229,80,26,0.7)] hover:brightness-110 cursor-pointer transition-all`}
                >
                  Build my trip
                  <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
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
