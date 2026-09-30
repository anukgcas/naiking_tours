import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Loader2,
  Moon,
  Pencil,
  Plane,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { Activity, ActivityCategory, DaySlot, PlanState, TripDraft } from '../types';
import {
  CATEGORIES,
  CATEGORY_STYLES,
  STAY_TIERS,
  TIER_LABEL,
  activityMap,
  autoFillPlan,
  cityOfActivity,
  cityStops,
  computeCosts,
  dayDate,
  formatDate,
  formatINR,
  getDestination,
  planInsights,
  plannedActivities,
  sortDaysBySlot,
  suggestForDay,
  transferLabel,
  tripDays,
} from '../data/planner';
import { StepIndicator } from './StepIndicator';

interface TripPlannerProps {
  draft: TripDraft;
  plan: PlanState;
  onPlanChange: (plan: PlanState) => void;
  onStayTierChange: (tier: TripDraft['stayTier']) => void;
  onEditDetails: () => void;
  onEditCities: () => void;
  onContinue: () => void;
}

type Column = number | 'ideas';
interface DragInfo {
  id: string;
  from: Column;
}

const STACK_DEPTH = 2;
const STACK_GAP = 14;

const SLOT_ICON: Record<DaySlot, React.ReactNode> = {
  Morning: <Sunrise className="w-3 h-3" />,
  Afternoon: <Sun className="w-3 h-3" />,
  Evening: <Moon className="w-3 h-3" />,
};

const CategoryChip: React.FC<{ category: ActivityCategory }> = ({ category }) => {
  const c = CATEGORY_STYLES[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {category}
    </span>
  );
};

export const TripPlanner: React.FC<TripPlannerProps> = ({
  draft,
  plan,
  onPlanChange,
  onStayTierChange,
  onEditDetails,
  onEditCities,
  onContinue,
}) => {
  const dest = getDestination(draft.destinationId)!;
  const days = tripDays(draft);
  const guests = draft.adults + draft.children;

  const [filter, setFilter] = useState<ActivityCategory | 'All'>('All');
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const [overColumn, setOverColumn] = useState<Column | null>(null);
  const [openAddId, setOpenAddId] = useState<string | null>(null);
  const [aiDay, setAiDay] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [activeDay, setActiveDayRaw] = useState(0);
  const prevDayRef = useRef(0);
  const [dayDirection, setDayDirection] = useState(1);
  const setActiveDay = (i: number) => {
    setDayDirection(i >= prevDayRef.current ? 1 : -1);
    prevDayRef.current = i;
    setActiveDayRaw(i);
  };

  const map = useMemo(() => activityMap(plan), [plan]);
  const planned = useMemo(() => plannedActivities(plan), [plan]);
  const costs = useMemo(() => computeCosts(draft, plan), [draft, plan]);
  const insights = useMemo(() => planInsights(draft, plan), [draft, plan]);
  const totalPlanned = planned.reduce((n, d) => n + d.length, 0);

  // Days grouped under the cities on the route (one group holding every day when no cities were picked)
  const stops = useMemo(() => cityStops(draft), [draft]);
  const groups = useMemo(
    () =>
      stops.length
        ? stops.map((s) => ({
            key: s.city.id,
            title: s.city.name,
            blurb: s.city.blurb,
            nights: s.nights,
            dayIndexes: Array.from({ length: s.endDay - s.startDay + 1 }, (_, k) => s.startDay + k),
          }))
        : [
            {
              key: 'all',
              title: dest.name,
              blurb: dest.country,
              nights: Math.max(1, days - 1),
              dayIndexes: plan.days.map((_, i) => i),
            },
          ],
    [stops, dest, days, plan.days]
  );

  const groupOfDay = (dayIndex: number) => groups.find((g) => g.dayIndexes.includes(dayIndex)) ?? groups[0];

  const used = useMemo(() => new Set(plan.days.flat()), [plan]);
  const cityIdsOnRoute = useMemo(() => new Set(stops.map((s) => s.city.id)), [stops]);
  const ideaRank = (a: Activity) =>
    Number(draft.interests.includes(a.category)) +
    (cityIdsOnRoute.size && cityIdsOnRoute.has(cityOfActivity(dest.id, a.id)?.id ?? '') ? 2 : 0);
  const ideas = useMemo(
    () =>
      [...plan.extras, ...dest.activities]
        .filter((a) => !used.has(a.id) && (filter === 'All' || a.category === filter))
        // Stable sort: ideas in the chosen cities and matching the traveller's interests float to the top
        .sort((a, b) => ideaRank(b) - ideaRank(a)),
    [plan.extras, dest, used, filter, draft.interests, stops]
  );

  // The single best next pick for each day — flagged with a sparkle in the ideas lane
  const recommended = useMemo(() => {
    const ids = new Set<string>();
    plan.days.forEach((_, i) => suggestForDay(draft, plan, i, 1).forEach((a) => ids.add(a.id)));
    return ids;
  }, [draft, plan]);

  // ---------- board actions ----------

  const move = (id: string, from: Column, to: Column, beforeIndex?: number) => {
    const next = plan.days.map((d) => [...d]);
    if (to !== 'ideas' && from !== to && next[to].includes(id)) return;

    let insertAt = beforeIndex;
    if (from !== 'ideas') {
      const fromIdx = next[from].indexOf(id);
      next[from] = next[from].filter((x) => x !== id);
      if (from === to && insertAt !== undefined && fromIdx !== -1 && fromIdx < insertAt) insertAt -= 1;
    }
    if (to !== 'ideas') {
      const target = next[to];
      target.splice(insertAt === undefined ? target.length : Math.min(insertAt, target.length), 0, id);
    }
    onPlanChange({ ...plan, days: next });
  };

  const addToDay = (id: string, dayIndex: number) => {
    move(id, 'ideas', dayIndex);
    setOpenAddId(null);
  };

  const noPicksMessage = (dayIndex: number) => {
    const slots = new Set((planned[dayIndex] ?? []).map((a) => a.slot));
    return slots.size === 3
      ? `Day ${dayIndex + 1} already covers morning, afternoon and evening.`
      : 'Nothing more to suggest for the open slots. Browse the ideas lane or ask AI for fresh ones.';
  };

  const addPicksToDay = (dayIndex: number) => {
    const picks = suggestForDay(draft, plan, dayIndex, 3);
    if (!picks.length) {
      setAiNote(noPicksMessage(dayIndex));
      return;
    }
    const next = plan.days.map((d, i) => (i === dayIndex ? [...d, ...picks.map((p) => p.id)] : d));
    onPlanChange(sortDaysBySlot({ ...plan, days: next }));
    setAiNote(`Added ${picks.length} balanced pick${picks.length > 1 ? 's' : ''} to Day ${dayIndex + 1}.`);
  };

  const handleAutoPlan = () => {
    const next = autoFillPlan(draft, plan);
    const added = next.days.flat().length - plan.days.flat().length;
    onPlanChange(next);
    setAiNote(
      added > 0
        ? `AI added ${added} experiences across ${days} days, balanced for pace and variety.`
        : 'Nothing more to suggest for the open slots. Browse the ideas lane or ask AI for fresh ones.'
    );
  };

  const handleClear = () => {
    onPlanChange({ ...plan, days: plan.days.map(() => []) });
    setAiNote(null);
  };

  const handleAskAi = async () => {
    setAiLoading(true);
    setAiNote(null);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest.name,
          country: dest.country,
          day: aiDay + 1,
          totalDays: days,
          adults: draft.adults,
          children: draft.children,
          stayStyle: TIER_LABEL[draft.stayTier],
          existing: [...dest.activities, ...plan.extras].map((a) => a.name),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { suggestions: Omit<Activity, 'id'>[] };
      const known = new Set([...dest.activities, ...plan.extras].map((a) => a.name.toLowerCase()));
      const fresh: Activity[] = data.suggestions
        .filter((s) => !known.has(s.name.toLowerCase()))
        .map((s, i) => ({ ...s, id: `ai-${Date.now()}-${i}`, aiGenerated: true }));
      if (!fresh.length) throw new Error('empty');
      onPlanChange({ ...plan, extras: [...fresh, ...plan.extras] });
      setFilter('All');
      setAiNote(`AI found ${fresh.length} new ideas for Day ${aiDay + 1} — look for the ✨ cards in your ideas lane.`);
    } catch {
      // Live AI is optional: fall back to the built-in picks so the button always does something useful
      const picks = suggestForDay(draft, plan, aiDay, 3);
      if (picks.length) {
        const next = plan.days.map((d, i) => (i === aiDay ? [...d, ...picks.map((p) => p.id)] : d));
        onPlanChange(sortDaysBySlot({ ...plan, days: next }));
      }
      setAiNote(
        picks.length
          ? 'Live AI is unavailable right now, so we added our curated picks to that day instead.'
          : `Live AI is unavailable right now. ${noPicksMessage(aiDay)}`
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ---------- drag & drop ----------

  const startDrag = (e: React.DragEvent, id: string, from: Column) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDrag({ id, from });
  };
  const endDrag = () => {
    setDrag(null);
    setOverColumn(null);
  };
  const allowDrop = (e: React.DragEvent, col: Column) => {
    if (!drag) return;
    e.preventDefault();
    setOverColumn(col);
  };
  const dropOn = (e: React.DragEvent, col: Column, beforeIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (drag) move(drag.id, drag.from, col, beforeIndex);
    endDrag();
  };

  // ---------- render ----------

  const renderPlannedCard = (a: Activity, dayIndex: number, idx: number) => (
    <div
      key={a.id}
      draggable
      onDragStart={(e) => startDrag(e, a.id, dayIndex)}
      onDragEnd={endDrag}
      onDragOver={(e) => allowDrop(e, dayIndex)}
      onDrop={(e) => dropOn(e, dayIndex, idx)}
      className={`group bg-white rounded-xl border border-[#1E2022]/10 p-3 shadow-xs cursor-grab active:cursor-grabbing ${
        drag?.id === a.id ? 'opacity-40' : 'hover:shadow-md'
      } transition-shadow`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-[#9CA3AF] mt-0.5 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-bold text-[#1E2022] leading-snug">{a.name}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CategoryChip category={a.category} />
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6B7280]">
              {SLOT_ICON[a.slot]} {a.slot}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280]">
              <Clock className="w-3 h-3" /> {a.hours}h
            </span>
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-[#1E2022]">
            {a.cost === 0 ? 'Free' : `${formatINR(a.cost)} pp`}
          </p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-[#1E2022]/6 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={dayIndex === 0}
            onClick={() => move(a.id, dayIndex, dayIndex - 1)}
            className="p-1 rounded-md hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
            aria-label={`Move ${a.name} to previous day`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={dayIndex === days - 1}
            onClick={() => move(a.id, dayIndex, dayIndex + 1)}
            className="p-1 rounded-md hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
            aria-label={`Move ${a.name} to next day`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => move(a.id, dayIndex, 'ideas')}
          className="p-1 rounded-md text-[#9CA3AF] hover:text-[#C2571A] hover:bg-[#C2571A]/8 cursor-pointer"
          aria-label={`Remove ${a.name} from Day ${dayIndex + 1}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // Which days peek out behind the active card, in stack order (nearest next day first)
  const stackGhosts = useMemo(() => {
    const total = plan.days.length;
    const out: number[] = [];
    for (let k = 1; k <= STACK_DEPTH && k < total; k++) {
      out.push((activeDay + k) % total);
    }
    return out;
  }, [activeDay, plan.days.length]);

  const activeGroup = groupOfDay(activeDay);
  const activeItems = planned[activeDay] ?? [];
  const activeDayHours = activeItems.reduce((n, a) => n + a.hours, 0);
  const activeDayCost = activeItems.reduce((n, a) => n + a.cost, 0);
  const isActiveOver = overColumn === activeDay && drag !== null;
  const showTransferBefore =
    activeGroup && groups.findIndex((g) => g.key === activeGroup.key) > 0 && activeGroup.dayIndexes[0] === activeDay;

  return (
    <section className="pt-24 lg:pt-28 pb-32">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: steps + trip summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <StepIndicator current={1} />
          <button
            type="button"
            onClick={onEditDetails}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#1E2022] cursor-pointer self-start lg:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Edit trip details
          </button>
        </div>

        {/* Header */}
        <div className="mt-6 pb-6 border-b border-[#1E2022]/8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E2022]">
            Plan your {dest.name} days
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] max-w-2xl">
            {formatDate(draft.checkIn)} – {formatDate(draft.checkOut)} · {days} days · {guests} guest
            {guests > 1 ? 's' : ''} · {TIER_LABEL[draft.stayTier]} stays. Drag ideas onto a day, or tap “Add”.
          </p>
        </div>

        {/* AI assistant */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#1E2022] text-white">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#C2571A] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold">AI trip assistant</h2>
                <p className="mt-0.5 text-xs text-white/75" aria-live="polite">
                  {aiNote ?? insights[0]}
                </p>
                {!aiNote && insights[1] && <p className="mt-0.5 text-xs text-white/55">{insights[1]}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoPlan}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-[#1E2022] text-xs font-bold hover:bg-[#FAF8F5] cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-plan my days
              </button>
              <div className="inline-flex items-center rounded-full bg-white/10 border border-white/15 pl-3 pr-1 py-1">
                <label htmlFor="ai-day" className="text-xs text-white/70 mr-2">
                  Ideas for
                </label>
                <select
                  id="ai-day"
                  value={aiDay}
                  onChange={(e) => setAiDay(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold focus:outline-none mr-1 cursor-pointer"
                >
                  {plan.days.map((_, i) => (
                    <option key={i} value={i} className="text-[#1E2022]">
                      Day {i + 1}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAskAi}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C2571A] hover:bg-[#a84a15] text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Ask AI
                </button>
              </div>
              {totalPlanned > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3-column dashboard */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[17rem_1fr_19rem] gap-5 items-start">
          {/* LEFT: stay style (compact sidebar) */}
          <div className="space-y-4 xl:sticky xl:top-24">
            <div className="rounded-2xl border border-[#1E2022]/10 bg-white p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Stay style</h2>
              <div className="mt-3 space-y-2">
                {STAY_TIERS.map((t, i) => {
                  const selected = draft.stayTier === i;
                  return (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => onStayTierChange(i as TripDraft['stayTier'])}
                      aria-pressed={selected}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-white border-[#C2571A] ring-1 ring-[#C2571A] shadow-sm'
                          : 'bg-white/60 border-[#1E2022]/10 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1E2022]">{t.label}</span>
                        <span className="text-xs font-semibold text-[#C2571A] whitespace-nowrap">
                          {formatINR(dest.stayPerNight[i])}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#6B7280]">{t.blurb}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#1E2022]/10 bg-white p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Trip summary</h2>
              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Dates</span>
                  <span className="font-semibold text-[#1E2022] text-right">
                    {formatDate(draft.checkIn)} – {formatDate(draft.checkOut)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Duration</span>
                  <span className="font-semibold text-[#1E2022]">{days} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Guests</span>
                  <span className="font-semibold text-[#1E2022]">{guests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Stay style</span>
                  <span className="font-semibold text-[#1E2022]">{TIER_LABEL[draft.stayTier]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Experiences</span>
                  <span className="font-semibold text-[#1E2022]">{totalPlanned}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: day tabs + itinerary, main focus */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Your itinerary</h2>
              <span className="text-[11px] text-[#6B7280]">{totalPlanned} experience{totalPlanned === 1 ? '' : 's'} planned</span>
            </div>

            {/* Day tabs */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {plan.days.map((_, i) => {
                const dayItems = planned[i] ?? [];
                const selected = activeDay === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveDay(i)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#1E2022] border-[#1E2022] text-white'
                        : 'bg-white border-[#1E2022]/10 text-[#1E2022] hover:border-[#C2571A]/40'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70">
                      Day {i + 1}
                    </span>
                    <span className={`block text-[11px] ${selected ? 'text-white/70' : 'text-[#6B7280]'}`}>
                      {dayDate(draft.checkIn, i)} · {dayItems.length} stop{dayItems.length === 1 ? '' : 's'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active day card — stacked-deck transition */}
            <div className="relative mt-4" style={{ paddingBottom: STACK_DEPTH * STACK_GAP }}>
              {/* Background ghost slivers: purely decorative depth cues, no content or scroll */}
              {stackGhosts.map((gi, depth) => (
                <div
                  key={`ghost-${gi}`}
                  aria-hidden
                  className="absolute inset-x-0 top-0 rounded-2xl border border-[#1E2022]/10 bg-white shadow-[0_10px_30px_-22px_rgba(30,32,34,0.35)] pointer-events-none"
                  style={{
                    height: '2.5rem',
                    transform: `translateY(${(depth + 1) * STACK_GAP}px) scale(${1 - (depth + 1) * 0.035})`,
                    opacity: 1 - (depth + 1) * 0.32,
                    zIndex: STACK_DEPTH - depth,
                  }}
                />
              ))}

              <AnimatePresence mode="popLayout" custom={dayDirection} initial={false}>
                <motion.section
                  key={activeDay}
                  custom={dayDirection}
                  initial={{ opacity: 0, y: 26, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.7 }}
                  className="relative rounded-2xl border border-[#1E2022]/10 bg-white overflow-hidden shadow-[0_20px_45px_-20px_rgba(30,32,34,0.45)]"
                  style={{ zIndex: STACK_DEPTH + 1 }}
                >
                  {showTransferBefore && (
                    <div className="px-4 py-2 bg-[#FFF6EC] border-b border-[#F7931E]/20 flex items-center gap-2 text-xs font-semibold text-[#C2571A]">
                      <Car className="w-3.5 h-3.5" /> {transferLabel(dest.id, activeGroup.title)}
                    </div>
                  )}
                  <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 bg-gradient-to-r from-[#FFF1DC] to-[#FFE3D2] border-b border-[#F7931E]/20">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1E2022]">
                      {activeGroup.title} <span className="text-[#C2571A]">• {activeGroup.nights} night{activeGroup.nights === 1 ? '' : 's'}</span>
                    </h3>
                    <p className="text-xs text-[#6B7280] truncate">{activeGroup.blurb}</p>
                  </header>

                  <div
                    onDragOver={(e) => allowDrop(e, activeDay)}
                    onDragLeave={() => setOverColumn((c) => (c === activeDay ? null : c))}
                    onDrop={(e) => dropOn(e, activeDay)}
                    className={`transition-colors ${isActiveOver ? 'bg-[#C2571A]/5' : ''}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#1E2022]/8 bg-[#FAF8F5]/60">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                          Day {String(activeDay + 1).padStart(2, '0')} · {dayDate(draft.checkIn, activeDay)}
                        </p>
                        {activeItems.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-[#6B7280]">
                            {activeItems.length} stop{activeItems.length > 1 ? 's' : ''} · {activeDayHours}h · {formatINR(activeDayCost)} pp
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addPicksToDay(activeDay)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#C2571A]/10 text-[#C2571A] text-[11px] font-bold hover:bg-[#C2571A]/20 cursor-pointer shrink-0"
                        title="Fill this day's open slots with AI picks"
                      >
                        <Sparkles className="w-3 h-3" /> Suggest
                      </button>
                    </div>
                    <div className="p-4">
                      {activeItems.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {activeItems.map((a, idx) => renderPlannedCard(a, activeDay, idx))}
                        </div>
                      ) : (
                        <div className="h-24 rounded-xl border-2 border-dashed border-[#1E2022]/12 flex items-center justify-center text-[11px] text-[#9CA3AF] text-center px-4">
                          Drop ideas here, or tap Suggest
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              </AnimatePresence>
            </div>

            {/* Ideas lane */}
            <div
              onDragOver={(e) => allowDrop(e, 'ideas')}
              onDrop={(e) => dropOn(e, 'ideas')}
              className={`mt-5 rounded-2xl border p-4 ${
                overColumn === 'ideas' && drag?.from !== 'ideas'
                  ? 'border-[#C2571A] bg-[#C2571A]/5'
                  : 'border-[#1E2022]/10 bg-white/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1E2022]">Ideas in {dest.name}</h2>
                <span className="text-[11px] text-[#6B7280]">{ideas.length} available</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(['All', ...CATEGORIES] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilter(c)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                      filter === c ? 'bg-[#1E2022] text-white' : 'bg-[#1E2022]/6 text-[#1E2022] hover:bg-[#1E2022]/12'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
                {ideas.length === 0 && (
                  <p className="text-xs text-[#6B7280] py-6 text-center sm:col-span-2">
                    {filter === 'All'
                      ? 'You have used every idea. Ask AI for more.'
                      : `No more ${filter.toLowerCase()} ideas — try another category.`}
                  </p>
                )}
                {ideas.map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => startDrag(e, a.id, 'ideas')}
                    onDragEnd={endDrag}
                    className={`bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                      a.aiGenerated || recommended.has(a.id) ? 'border-[#C2571A]/40' : 'border-[#1E2022]/10'
                    } ${drag?.id === a.id ? 'opacity-40' : 'hover:shadow-md'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-bold text-[#1E2022] leading-snug">{a.name}</h3>
                      {(a.aiGenerated || recommended.has(a.id)) && (
                        <span
                          className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-bold text-[#C2571A]"
                          title={a.aiGenerated ? 'Suggested by AI' : 'AI pick for your plan'}
                        >
                          <Sparkles className="w-3 h-3" /> {a.aiGenerated ? 'AI' : 'Pick'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B7280] line-clamp-2">{a.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <CategoryChip category={a.category} />
                      {cityOfActivity(dest.id, a.id) && (
                        <span className="text-[10px] font-semibold text-[#C2571A]">{cityOfActivity(dest.id, a.id)?.name}</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6B7280]">
                        {SLOT_ICON[a.slot]} {a.slot}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280]">
                        <Clock className="w-3 h-3" /> {a.hours}h
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1E2022]">
                        {a.cost === 0 ? 'Free' : `${formatINR(a.cost)} pp`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenAddId(openAddId === a.id ? null : a.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E2022] text-white text-[11px] font-semibold hover:bg-[#C2571A] cursor-pointer"
                        aria-expanded={openAddId === a.id}
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {openAddId === a.id && (
                      <div className="mt-2 pt-2 border-t border-[#1E2022]/8 flex flex-wrap gap-1.5">
                        {plan.days.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addToDay(a.id, i)}
                            className="px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#1E2022]/10 text-[11px] font-semibold hover:border-[#C2571A] hover:text-[#C2571A] cursor-pointer"
                          >
                            Day {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: sticky package summary */}
          <div className="xl:sticky xl:top-24">
            <div className="rounded-2xl border border-[#1E2022]/10 bg-white p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Your package so far</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-[#1E2022]">{formatINR(costs.total)}</p>
              <p className="mt-2 text-[11px] text-[#6B7280] leading-relaxed">
                About {formatINR(costs.perPerson)} per guest
              </p>
              <div className="mt-3 pt-3 border-t border-[#1E2022]/8 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Stay</span>
                  <span className="font-semibold text-[#1E2022]">{formatINR(costs.stay)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Transfers</span>
                  <span className="font-semibold text-[#1E2022]">{formatINR(costs.transfers)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Experiences</span>
                  <span className="font-semibold text-[#1E2022]">{formatINR(costs.activities)}</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-[#9CA3AF]">Updates as you add or remove experiences.</p>
            </div>

            {/* Your route */}
            <div className="mt-4 rounded-2xl border border-[#1E2022]/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1E2022]">Your route</h2>
                <span className="text-[11px] text-[#6B7280]">
                  {stops.length || 1} {stops.length > 1 ? 'cities' : 'city'} · {days - 1} nights
                </span>
              </div>
              <ol className="relative mt-3">
                <span aria-hidden className="absolute left-[0.7rem] top-2 bottom-2 border-l-2 border-dashed border-[#1E2022]/15" />
                <li className="relative flex items-center gap-2.5 pb-3">
                  <span className="relative z-10 w-6 h-6 rounded-full bg-[#1E2022]/6 text-[#4B4F55] flex items-center justify-center shrink-0">
                    <Plane className="w-3 h-3" />
                  </span>
                  <span className="text-xs text-[#6B7280]">Arrival in {dest.name}</span>
                </li>
                {groups.map((g, gi) => (
                  <React.Fragment key={g.key}>
                    {gi > 0 && (
                      <li className="relative flex items-center gap-2.5 pb-3">
                        <span className="relative z-10 w-6 h-6 rounded-full bg-[#FFF6EC] text-[#C2571A] flex items-center justify-center shrink-0">
                          <Car className="w-3 h-3" />
                        </span>
                        <span className="text-[11px] text-[#6B7280]">{transferLabel(dest.id, g.title)}</span>
                      </li>
                    )}
                    <li className="relative flex items-center gap-2.5 pb-3">
                      <span className="relative z-10 w-6 h-6 rounded-full bg-[#C2571A] text-white flex items-center justify-center shrink-0 text-[10px] font-extrabold">
                        {gi + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#1E2022] truncate">{g.title}</span>
                        <span className="block text-[11px] text-[#6B7280]">
                          {g.nights} night{g.nights === 1 ? '' : 's'}
                        </span>
                      </span>
                    </li>
                  </React.Fragment>
                ))}
                <li className="relative flex items-center gap-2.5">
                  <span className="relative z-10 w-6 h-6 rounded-full bg-[#1E2022]/6 text-[#4B4F55] flex items-center justify-center shrink-0">
                    <Plane className="w-3 h-3 rotate-45" />
                  </span>
                  <span className="text-xs text-[#6B7280]">Departure</span>
                </li>
              </ol>
              <div className="mt-4 pt-3 border-t border-[#1E2022]/8 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onEditCities}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#FAF8F5] border border-[#1E2022]/10 text-xs font-semibold hover:border-[#C2571A] hover:text-[#C2571A] cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Edit route
                </button>
                <button
                  type="button"
                  onClick={onEditCities}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#FAF8F5] border border-[#1E2022]/10 text-xs font-semibold hover:border-[#C2571A] hover:text-[#C2571A] cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add city
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky continue bar */}
      <div className="sticky bottom-[4.75rem] md:bottom-4 z-30 mt-6 max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 p-3 pl-5 rounded-full bg-white border border-[#1E2022]/12 shadow-2xl">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#1E2022] truncate">
              {formatINR(costs.total)}{' '}
              <span className="text-xs font-medium text-[#6B7280]">· {totalPlanned} experiences planned</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={totalPlanned === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-sm font-semibold disabled:opacity-40 disabled:hover:bg-[#1E2022] transition-colors cursor-pointer shrink-0"
          >
            Review my package <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
