"use client";

/**
 * Mapbox stack (react-map-gl Mapbox integration):
 * @see https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map
 * Token: `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`.
 */

import "mapbox-gl/dist/mapbox-gl.css";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/mapbox";
import type { LngLatBoundsLike, Map as MapboxMap, MapEvent } from "mapbox-gl";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

function readMapboxAccessToken(): string {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    ""
  );
}

const US_OVERVIEW = {
  longitude: -98.35,
  latitude: 39.5,
  zoom: 3.25,
  pitch: 0,
  bearing: 0,
} as const;

const FIT_BOUNDS_OPTIONS = {
  padding: { top: 56, bottom: 52, left: 52, right: 52 },
  maxZoom: 6.25,
  duration: 850,
  essential: true,
  linear: true,
} as const;

const EMPTY_OVERVIEW_EASE = {
  duration: 550,
  essential: true,
} as const;

export type MapMarket = {
  regionId: string;
  regionName: string;
  centroid: { lat: number; lng: number };
  opportunityScore: number;
};

type Props = {
  markets: MapMarket[];
  selectedId: string | null;
  onSelect: (regionId: string) => void;
};

function boundsFromMarkets(markets: MapMarket[]): LngLatBoundsLike | null {
  if (markets.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const m of markets) {
    const { lng, lat } = m.centroid;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const padLng = 0.65;
  const padLat = 0.45;
  let west = minLng - padLng;
  let east = maxLng + padLng;
  let south = minLat - padLat;
  let north = maxLat + padLat;

  const minSpanLng = 2.8;
  const minSpanLat = 1.9;
  const spanLng = east - west;
  const spanLat = north - south;
  if (spanLng < minSpanLng) {
    const cx = (west + east) / 2;
    west = cx - minSpanLng / 2;
    east = cx + minSpanLng / 2;
  }
  if (spanLat < minSpanLat) {
    const cy = (south + north) / 2;
    south = cy - minSpanLat / 2;
    north = cy + minSpanLat / 2;
  }

  return [
    [west, south],
    [east, north],
  ];
}

function applyCameraToMarkets(map: MapboxMap, list: MapMarket[]): void {
  if (list.length === 0) {
    map.easeTo({
      center: [US_OVERVIEW.longitude, US_OVERVIEW.latitude],
      zoom: US_OVERVIEW.zoom,
      pitch: 0,
      bearing: 0,
      ...EMPTY_OVERVIEW_EASE,
    });
    return;
  }
  const b = boundsFromMarkets(list);
  if (!b) return;
  map.fitBounds(b, { ...FIT_BOUNDS_OPTIONS });
}

export function OpportunityMap({ markets, selectedId, onSelect }: Props) {
  const mapboxAccessToken = useMemo(() => readMapboxAccessToken(), []);
  const mapRef = useRef<MapRef>(null);
  const [mapLoadGeneration, setMapLoadGeneration] = useState(0);
  const marketsRef = useRef(markets);
  useLayoutEffect(() => {
    marketsRef.current = markets;
  }, [markets]);

  const marketsKey = useMemo(
    () => markets.map((m) => m.regionId).sort().join("|"),
    [markets]
  );

  const scoreColor = useCallback((s: number) => {
    if (s >= 0.72) return "bg-emerald-600";
    if (s >= 0.55) return "bg-amber-500";
    return "bg-slate-400";
  }, []);

  const handleLoad = useCallback((e: MapEvent) => {
    const map = e.target;
    map.scrollZoom.setWheelZoomRate(1 / 600);
    map.scrollZoom.setZoomRate(1 / 100);
    map.scrollZoom.enable({ around: "center" });
    setMapLoadGeneration((g) => g + 1);
  }, []);

  useEffect(() => {
    if (mapLoadGeneration === 0) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    applyCameraToMarkets(map, marketsRef.current);
  }, [marketsKey, mapLoadGeneration]);

  if (!mapboxAccessToken) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/25 bg-gradient-to-b from-muted/40 to-muted/20 p-8 text-center text-sm text-muted-foreground">
        <p className="font-heading font-semibold text-foreground">Mapbox token missing</p>
        <p>
          Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
          <code className="rounded bg-muted px-1">.env.local</code> and restart the dev server.
        </p>
        <p className="text-xs">
          <a
            className="text-primary underline"
            href="https://visgl.github.io/react-map-gl/docs/get-started/mapbox-tokens"
            target="_blank"
            rel="noreferrer"
          >
            About Mapbox tokens
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-b-xl bg-gradient-to-br from-muted/30 via-muted/15 to-transparent">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxAccessToken}
        initialViewState={US_OVERVIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        reuseMaps
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        maxPitch={0}
        minZoom={2}
        maxZoom={14}
        onLoad={handleLoad}
      >
        <NavigationControl position="top-left" showCompass={false} />
        {markets.map((m) => {
          const selected = m.regionId === selectedId;
          return (
            <Marker
              key={m.regionId}
              longitude={m.centroid.lng}
              latitude={m.centroid.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelect(m.regionId);
              }}
            >
              <button
                type="button"
                title={m.regionName}
                className={`h-4 w-4 rounded-full border-2 border-white shadow-md ring-2 ring-black/10 transition-transform hover:scale-125 ${scoreColor(
                  m.opportunityScore
                )} ${selected ? "ring-primary scale-125 ring-2" : ""}`}
              />
            </Marker>
          );
        })}
      </Map>
      <div
        className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[10rem] rounded-xl border border-border/60 bg-card/90 px-3 py-2.5 text-[10px] leading-tight shadow-lg shadow-black/5 backdrop-blur-md dark:shadow-black/30"
        aria-hidden
      >
        <p className="mb-2 font-heading text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Opportunity
        </p>
        <ul className="space-y-1 text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full bg-emerald-600 ring-1 ring-black/10" />
            Strong
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full bg-amber-500 ring-1 ring-black/10" />
            Medium
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full bg-slate-400 ring-1 ring-black/10" />
            Lower
          </li>
        </ul>
      </div>
    </div>
  );
}
