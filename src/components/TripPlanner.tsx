import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  ArrowRight,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Loader2,
  Moon,
  Pencil,
  MapPin,
  Plane,
  Plus,
  Search,
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
import { RouteMap } from './RouteMap';

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
  onEditDetails,
  onEditCities,
  onContinue,
}) => {
  const dest = getDestination(draft.destinationId)!;
  const days = tripDays(draft);
  const guests = draft.adults + draft.children;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ActivityCategory | 'All'>('All');
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const [overColumn, setOverColumn] = useState<Column | null>(null);
  const [openAddId, setOpenAddId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const toggleSaved = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const [aiDay, setAiDay] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  // Which days are expanded — collapsing only hides a day, the plan data is untouched
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]));
  const toggleDay = (i: number) => {
    setActiveDay(i);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Review bar: hidden by default, eases in while scrolling down, hides again on scroll up
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    // A page too short to scroll can never reveal the bar, so keep it visible there
    const fits = () => document.documentElement.scrollHeight <= window.innerHeight + 80;
    if (fits()) setShowBar(true);
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return;
      setShowBar(y > lastY && y > 80 ? true : fits());
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [expanded, plan]);

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
        .filter((a) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return [a.name, a.description, a.category, cityOfActivity(dest.id, a.id)?.name ?? ''].some((s) =>
            s.toLowerCase().includes(q)
          );
        })
        // Stable sort: ideas in the chosen cities and matching the traveller's interests float to the top
        .sort((a, b) => ideaRank(b) - ideaRank(a)),
    [plan.extras, dest, used, filter, search, draft.interests, stops]
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

  // Clock times are derived from each activity's time-of-day slot and length: it starts at its slot's usual
  // start time (or when the previous activity ends, if later) and runs for its duration.
  const SLOT_START: Record<DaySlot, number> = { Morning: 9 * 60, Afternoon: 13 * 60, Evening: 18 * 60 };
  const clock = (mins: number) => {
    const m = Math.min(Math.round(mins), 24 * 60 - 1);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  const focusIdeas = () => {
    const el = document.getElementById('ideas-search') as HTMLInputElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };

  type Row =
    | { kind: 'activity'; a: Activity; idx: number; start: number; end: number }
    | { kind: 'transfer'; label: string }
    | { kind: 'free'; start: number; end: number };

  const buildRows = (items: Activity[]): Row[] => {
    const rows: Row[] = [];
    let cursor = 0;
    items.forEach((a, idx) => {
      const start = Math.max(SLOT_START[a.slot], cursor);
      const prev = items[idx - 1];
      if (prev) {
        const prevCity = cityOfActivity(dest.id, prev.id);
        const city = cityOfActivity(dest.id, a.id);
        if (city && prevCity && city.id !== prevCity.id) rows.push({ kind: 'transfer', label: transferLabel(dest.id, city.name) });
        if (start - cursor >= 60) rows.push({ kind: 'free', start: cursor, end: start });
      }
      const end = start + a.hours * 60;
      rows.push({ kind: 'activity', a, idx, start, end });
      cursor = end;
    });
    return rows;
  };

  const renderTimeline = (items: Activity[], dayIndex: number) => {
    const rows = buildRows(items);
    return (
      <div>
        <ol>
          {rows.map((row, ri) => {
            const last = ri === rows.length - 1;
            const spine = (node: React.ReactNode) => (
              <div className="relative w-5 shrink-0 flex justify-center">
                <span aria-hidden className={`absolute left-1/2 -translate-x-1/2 w-px bg-[#1E2022]/15 top-0 ${last ? 'h-5' : 'bottom-0'}`} />
                {node}
              </div>
            );

            if (row.kind === 'transfer') {
              return (
                <li key={`t-${ri}`} className="flex gap-2 sm:gap-3">
                  <div className="w-12 sm:w-24 shrink-0" />
                  {spine(
                    <span className="relative z-10 mt-0.5 w-5 h-5 rounded-full bg-[#FFF6EC] text-[#C2571A] flex items-center justify-center">
                      <Car className="w-3 h-3" />
                    </span>
                  )}
                  <p className="flex-1 min-w-0 pb-3 text-[11px] text-[#6B7280]">{row.label}</p>
                </li>
              );
            }

            if (row.kind === 'free') {
              return (
                <li key={`f-${ri}`} className="flex gap-2 sm:gap-3">
                  <div className="w-12 sm:w-24 shrink-0 pt-2.5 text-right text-[11px] font-semibold text-[#9CA3AF] tabular-nums leading-tight">
                    {clock(row.start)}
                    <span className="hidden sm:inline"> — {clock(row.end)}</span>
                  </div>
                  {spine(<span className="relative z-10 mt-3.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#1E2022]/25" />)}
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="rounded-xl border border-dashed border-[#1E2022]/20 bg-[#FAF8F5]/60 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Free time</p>
                      <p className="text-[11px] text-[#6B7280]">You can add any activity here</p>
                    </div>
                  </div>
                </li>
              );
            }

            const { a, idx } = row;
            const style = CATEGORY_STYLES[a.category];
            const city = cityOfActivity(dest.id, a.id);
            return (
              <li key={a.id} className="flex gap-2 sm:gap-3">
                <div className="w-12 sm:w-24 shrink-0 pt-2.5 text-right tabular-nums leading-tight">
                  <span className="block text-xs font-extrabold text-[#1E2022]">{clock(row.start)}</span>
                  <span className="hidden sm:block text-[11px] text-[#6B7280]">to {clock(row.end)}</span>
                </div>
                {spine(<span className="relative z-10 mt-3.5 w-2.5 h-2.5 rounded-full bg-[#C2571A] ring-4 ring-white" />)}
                <div className="flex-1 min-w-0 pb-3">
                  <div
                    draggable
                    onDragStart={(e) => startDrag(e, a.id, dayIndex)}
                    onDragEnd={endDrag}
                    onDragOver={(e) => allowDrop(e, dayIndex)}
                    onDrop={(e) => dropOn(e, dayIndex, idx)}
                    className={`group flex items-start gap-2 bg-white rounded-xl border border-[#1E2022]/10 p-2.5 cursor-grab active:cursor-grabbing transition-shadow ${
                      drag?.id === a.id ? 'opacity-40' : 'hover:shadow-sm'
                    }`}
                  >
                    <GripVertical className="hidden sm:block w-4 h-4 text-[#C4C8CE] mt-1 shrink-0" aria-hidden />
                    {a.image ? (
                      <img
                        src={a.image}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg shrink-0 flex items-center justify-center ${style.bg}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-[#1E2022] leading-snug">{a.name}</h4>
                      <p className="mt-0.5 text-[11px] text-[#6B7280] line-clamp-2">{a.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <CategoryChip category={a.category} />
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280]">
                          <Clock className="w-3 h-3" /> {a.hours}h
                        </span>
                        {city && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280]">
                            <MapPin className="w-3 h-3" /> {city.name}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-[#1E2022]">
                          {a.cost === 0 ? 'Free' : `${formatINR(a.cost)} pp`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-0.5 shrink-0 -mr-1">
                      <button
                        type="button"
                        disabled={dayIndex === 0}
                        onClick={() => move(a.id, dayIndex, dayIndex - 1)}
                        className="p-1 rounded-md text-[#6B7280] hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
                        aria-label={`Move ${a.name} to previous day`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={dayIndex === days - 1}
                        onClick={() => move(a.id, dayIndex, dayIndex + 1)}
                        className="p-1 rounded-md text-[#6B7280] hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
                        aria-label={`Move ${a.name} to next day`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex gap-2 sm:gap-3">
          <div className="w-12 sm:w-24 shrink-0" />
          <div className="w-5 shrink-0" />
          <button
            type="button"
            onClick={focusIdeas}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#1E2022]/20 text-xs font-semibold text-[#6B7280] hover:border-[#C2571A] hover:text-[#C2571A] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add activity
          </button>
        </div>
      </div>
    );
  };


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

        {/* Page heading */}
        <div className="mt-6 pb-5 border-b border-[#1E2022]/10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022]">
              Plan your {dest.name} days
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              {formatDate(draft.checkIn)} – {formatDate(draft.checkOut)} · {days} days · {guests} guest
              {guests === 1 ? '' : 's'} · {TIER_LABEL[draft.stayTier]} stays. Drag ideas onto a day, or tap “Add”.
            </p>
          </div>
          <div className="w-full md:w-80 shrink-0 rounded-xl border border-[#1E2022]/10 bg-white px-3.5 py-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Your package so far</p>
                <p className="text-xl font-extrabold text-[#1E2022] leading-tight">{formatINR(costs.total)}</p>
              </div>
              <p className="text-[11px] text-[#6B7280] text-right pb-0.5">≈ {formatINR(costs.perPerson)} / guest</p>
            </div>
          </div>
        </div>

        {/* AI assistant */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#1E2022] text-white">
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
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[21rem_minmax(0,1fr)_20rem] gap-5 items-start">
          {/* LEFT: Ideas browser (all ideas listed, page scrolls naturally) */}
          <aside
            onDragOver={(e) => allowDrop(e, 'ideas')}
            onDrop={(e) => dropOn(e, 'ideas')}
            className={`order-2 xl:order-1 xl:sticky xl:top-24 flex flex-col rounded-2xl border bg-white p-3.5 max-h-[70vh] xl:max-h-[calc(100vh-7rem)] ${
              overColumn === 'ideas' && drag?.from !== 'ideas' ? 'border-[#C2571A] bg-[#C2571A]/5' : 'border-[#1E2022]/10'
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
                  className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold cursor-pointer transition-colors ${
                    filter === c
                      ? 'bg-[#1E2022] border-[#1E2022] text-white'
                      : 'bg-white border-[#1E2022]/10 text-[#1E2022] hover:border-[#C2571A]/50'
                  }`}
                >
                  {c === 'All' ? 'All Activities' : c}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" aria-hidden />
              <input
                id="ideas-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities, places or experiences…"
                aria-label="Search ideas"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#1E2022]/10 text-xs text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C2571A]"
              />
            </div>

            <div className="mt-3 -mr-1.5 pr-1.5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2.5">
              {ideas.length === 0 && (
                <p className="text-xs text-[#6B7280] py-6 text-center">
                  {search.trim()
                    ? 'No ideas match your search.'
                    : filter === 'All'
                      ? 'You have used every idea. Ask AI for more.'
                      : `No more ${filter.toLowerCase()} ideas — try another category.`}
                </p>
              )}
              {ideas.map((a) => {
                const city = cityOfActivity(dest.id, a.id);
                const style = CATEGORY_STYLES[a.category];
                const highlighted = a.aiGenerated || recommended.has(a.id);
                const saved = savedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => startDrag(e, a.id, 'ideas')}
                    onDragEnd={endDrag}
                    className={`rounded-2xl border bg-white p-2.5 cursor-grab active:cursor-grabbing transition-shadow ${
                      highlighted ? 'border-[#C2571A]/40' : 'border-[#1E2022]/10'
                    } ${drag?.id === a.id ? 'opacity-40' : 'hover:shadow-md'}`}
                  >
                    <div className="flex items-stretch gap-3">
                      <div
                        aria-hidden
                        className={`w-[4.5rem] self-stretch min-h-[4.5rem] rounded-xl shrink-0 flex items-center justify-center ${style.bg}`}
                      >
                        <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[13px] font-bold text-[#1E2022] leading-snug line-clamp-2">
                            {a.name}
                            {highlighted && (
                              <Sparkles
                                className="inline w-3 h-3 ml-1 -mt-0.5 text-[#C2571A]"
                                aria-label={a.aiGenerated ? 'Suggested by AI' : 'AI pick for your plan'}
                              />
                            )}
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleSaved(a.id)}
                            aria-pressed={saved}
                            aria-label={saved ? `Unsave ${a.name}` : `Save ${a.name}`}
                            className={`shrink-0 p-0.5 cursor-pointer ${
                              saved ? 'text-[#C2571A]' : 'text-[#9CA3AF] hover:text-[#1E2022]'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <CategoryChip category={a.category} />
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#6B7280]">
                              {city && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {city.name}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {a.hours} hr{a.hours === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenAddId(openAddId === a.id ? null : a.id)}
                            className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full bg-[#1E2022] text-white hover:bg-[#C2571A] cursor-pointer"
                            aria-expanded={openAddId === a.id}
                            aria-label={`Add ${a.name} to a day`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {openAddId === a.id && (
                      <div className="mt-2.5 pt-2.5 border-t border-[#1E2022]/8 flex flex-wrap gap-1.5">
                        {plan.days.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addToDay(a.id, i)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#1E2022]/10 text-[11px] font-semibold hover:border-[#C2571A] hover:text-[#C2571A] cursor-pointer"
                          >
                            Day {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>


          {/* CENTER: itinerary, main focus */}
          <div className="order-1 xl:order-2 min-w-0">
            {/* Day accordion — every day is listed compactly; expanding reveals its full itinerary */}
            <div className="space-y-3">
              {plan.days.map((_, di) => {
                const items = planned[di] ?? [];
                const group = groupOfDay(di);
                const groupIdx = groups.findIndex((g) => g.key === group.key);
                const isGroupStart = group.dayIndexes[0] === di;
                const isOpen = expanded.has(di);
                const isActive = activeDay === di;
                const hours = items.reduce((n, a) => n + a.hours, 0);
                const cost = items.reduce((n, a) => n + a.cost, 0);
                const isOver = overColumn === di && drag !== null;
                return (
                  <section
                    key={di}
                    id={`day-section-${di}`}
                    className={`scroll-mt-28 rounded-2xl border bg-white overflow-hidden transition-shadow ${
                      isActive
                        ? 'border-[#C2571A]/50 shadow-[0_16px_40px_-22px_rgba(30,32,34,0.45)]'
                        : 'border-[#1E2022]/10 shadow-xs'
                    }`}
                  >
                    {isGroupStart && groupIdx > 0 && (
                      <div className="px-4 py-2 bg-[#FFF6EC] border-b border-[#F7931E]/20 flex items-center gap-2 text-xs font-semibold text-[#C2571A]">
                        <Car className="w-3.5 h-3.5" /> {transferLabel(dest.id, group.title)}
                      </div>
                    )}
                    {isGroupStart && (
                      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 bg-gradient-to-r from-[#FFF1DC] to-[#FFE3D2] border-b border-[#F7931E]/20">
                        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1E2022]">
                          {group.title}{' '}
                          <span className="text-[#C2571A]">
                            • {group.nights} night{group.nights === 1 ? '' : 's'}
                          </span>
                        </h3>
                        <p className="text-xs text-[#6B7280] truncate">{group.blurb}</p>
                      </header>
                    )}

                    <div
                      onDragOver={(e) => allowDrop(e, di)}
                      onDragLeave={() => setOverColumn((c) => (c === di ? null : c))}
                      onDrop={(e) => dropOn(e, di)}
                      className={`transition-colors ${isOver ? 'bg-[#C2571A]/5' : ''}`}
                    >
                      <div className="flex items-center gap-2 pr-3 bg-[#FAF8F5]/60">
                        <button
                          type="button"
                          onClick={() => toggleDay(di)}
                          aria-expanded={isOpen}
                          aria-controls={`day-panel-${di}`}
                          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                        >
                          <span
                            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                              isActive ? 'bg-[#1E2022] text-white' : 'bg-[#1E2022]/6 text-[#1E2022]'
                            }`}
                          >
                            {String(di + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                              Day {String(di + 1).padStart(2, '0')} · {dayDate(draft.checkIn, di)}
                            </span>
                            <span className="block mt-0.5 text-[11px] text-[#6B7280]">
                              {items.length === 0
                                ? 'No stops yet'
                                : isOpen
                                  ? `${items.length} stop${items.length > 1 ? 's' : ''} · ${hours}h · ${formatINR(cost)} pp`
                                  : `${items.length} stop${items.length > 1 ? 's' : ''}`}
                            </span>
                          </span>
                          <ChevronDown
                            aria-hidden
                            className={`ml-auto w-4 h-4 shrink-0 text-[#6B7280] transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <button
                            type="button"
                            onClick={() => addPicksToDay(di)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#C2571A]/10 text-[#C2571A] text-[11px] font-bold hover:bg-[#C2571A]/20 cursor-pointer shrink-0"
                            title="Fill this day's open slots with AI picks"
                          >
                            <Sparkles className="w-3 h-3" /> Suggest
                          </button>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`day-panel-${di}`}
                            key="panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden border-t border-[#1E2022]/8"
                          >
                            <div className="p-4">
                              {items.length > 0 ? (
                                renderTimeline(items, di)
                              ) : (
                                <div className="h-24 rounded-xl border-2 border-dashed border-[#1E2022]/12 flex items-center justify-center text-[11px] text-[#9CA3AF] text-center px-4">
                                  Drop ideas here, or tap Suggest
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          {/* RIGHT: compact pricing, trip summary, route */}
          <div className="order-3 space-y-4 xl:sticky xl:top-24">
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

            {/* Your route */}
            <div className="rounded-2xl border border-[#1E2022]/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1E2022]">Your route</h2>
                <span className="text-[11px] text-[#6B7280]">
                  {stops.length || 1} {stops.length > 1 ? 'cities' : 'city'} · {days - 1} nights
                </span>
              </div>
              <RouteMap stops={stops} />
              <ol className="relative mt-4">
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
        <div
          aria-hidden={!showBar}
          className={`flex items-center justify-between gap-4 p-3 pl-5 rounded-full bg-white border border-[#1E2022]/12 shadow-2xl transition-all duration-700 ease-out ${
            showBar ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
          }`}
        >
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
            tabIndex={showBar ? 0 : -1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-sm font-semibold disabled:opacity-40 disabled:hover:bg-[#1E2022] transition-colors cursor-pointer shrink-0"
          >
            Review my package <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
