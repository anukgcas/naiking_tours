import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import { CityStop } from '../data/planner';

interface RouteMapProps {
  stops: CityStop[];
}

type LatLng = [number, number];

/** Snapping further than this from a road means the leg is not drivable (e.g. a ferry crossing). */
const MAX_SNAP_METERS = 3000;

const routeCache = new Map<string, LatLng[] | null>();

/** Real road geometry from the public OSRM service; null when no drivable route exists. */
const fetchRoad = async (a: LatLng, b: LatLng, signal: AbortSignal): Promise<LatLng[] | null> => {
  const key = `${a}|${b}`;
  if (routeCache.has(key)) return routeCache.get(key) ?? null;
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}` +
      '?overview=full&geometries=geojson';
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const route = data.routes?.[0];
    const snapped = (data.waypoints as { distance: number }[] | undefined)?.every(
      (w) => w.distance <= MAX_SNAP_METERS,
    );
    const line: LatLng[] | null =
      route && snapped ? (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]) : null;
    routeCache.set(key, line);
    return line;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return null; // service unavailable: fall back to the approximate connection (not cached)
  }
};

const markerIcon = (n: number) =>
  L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#C2571A;color:#fff;border:2px solid #fff;font:800 11px/1 inherit;box-shadow:0 2px 6px rgba(0,0,0,.35)">${n}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

/** Real OpenStreetMap map of the selected destinations, joined in itinerary order. */
export const RouteMap: React.FC<RouteMapProps> = ({ stops }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Create the map once
  useEffect(() => {
    if (!hostRef.current) return;
    const map = L.map(hostRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw pins and route whenever the destinations change
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!stops.length) return;

    const pts: LatLng[] = stops.map((s) => [s.city.lat, s.city.lng]);
    const bounds = L.latLngBounds(pts);
    const center = bounds.getCenter();

    stops.forEach((s, i) => {
      const marker = L.marker(pts[i], { icon: markerIcon(i + 1), keyboard: false, title: s.city.name });
      marker.bindTooltip(s.city.name, {
        permanent: true,
        direction: pts[i][1] <= center.lng && pts.length > 1 ? 'left' : 'right',
        offset: [pts[i][1] <= center.lng && pts.length > 1 ? -10 : 10, 0],
        className: 'route-map-label',
      });
      marker.addTo(layer);
    });

    if (pts.length === 1) map.setView(pts[0], 10);
    else map.fitBounds(bounds, { padding: [34, 34], maxZoom: 11 });

    // Approximate connection first (dashed), upgraded to the real road where one exists
    const ctrl = new AbortController();
    const legs: L.Polyline[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      legs.push(
        L.polyline([pts[i], pts[i + 1]], { color: '#C2571A', weight: 3, opacity: 0.8, dashArray: '2 8', lineCap: 'round' }).addTo(layer),
      );
    }
    pts.slice(0, -1).forEach((from, i) => {
      fetchRoad(from, pts[i + 1], ctrl.signal)
        .then((line) => {
          if (!line) return;
          legs[i].setLatLngs(line).setStyle({ dashArray: undefined, weight: 4, opacity: 0.95 });
        })
        .catch(() => undefined);
    });
    return () => ctrl.abort();
  }, [stops]);

  // Resize + wheel zoom when toggling fullscreen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (fullscreen) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
    const t = window.setTimeout(() => {
      map.invalidateSize();
      if (stops.length > 1) map.fitBounds(L.latLngBounds(stops.map((s) => [s.city.lat, s.city.lng] as LatLng)), { padding: [34, 34], maxZoom: 11 });
    }, 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  if (!stops.length) return null;

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-4 z-[70] rounded-2xl overflow-hidden border border-[#1E2022]/20 shadow-2xl bg-white'
          : 'relative mt-3 h-56 rounded-xl overflow-hidden border border-[#1E2022]/10 bg-[#F6F1E9]'
      }
    >
      <style>{`
        .route-map-label{background:rgba(255,255,255,.92);border:0;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.25);color:#1E2022;font-size:11px;font-weight:700;padding:1px 6px}
        .route-map-label:before{display:none}
      `}</style>
      <div ref={hostRef} className="absolute inset-0 z-0" />
      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        aria-label={fullscreen ? 'Exit fullscreen map' : 'View map fullscreen'}
        className="absolute top-2 right-2 z-[500] w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white text-[#1E2022] shadow-md hover:text-[#C2571A] cursor-pointer"
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
