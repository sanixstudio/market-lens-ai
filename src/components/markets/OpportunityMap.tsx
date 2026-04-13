"use client";

/**
 * Mapbox stack (react-map-gl Mapbox integration):
 * @see https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map
 * Token: `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`.
 * Optional style: `NEXT_PUBLIC_MAPBOX_STYLE` (Mapbox style URL or Studio style id).
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
import { InfoTip } from "@/components/ui/info-tip";
import { heatMarkerClass, opportunityHeatBand } from "@/lib/opportunity-heat";
import { cn } from "@/lib/utils";

/** Default: minimal light canvas (good contrast for heat markers). Override for a road-map look. */
function readMapStyle(): string {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim() ||
    "mapbox://styles/mapbox/light-v12"
  );
}

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
  const mapStyle = useMemo(() => readMapStyle(), []);
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
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
        <p className="font-heading text-sm font-semibold text-foreground">Mapbox token missing</p>
        <p>
          Add <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
          <code className="rounded bg-muted px-1">.env.local</code>, then restart.
        </p>
        <a
          className="text-primary underline"
          href="https://visgl.github.io/react-map-gl/docs/get-started/mapbox-tokens"
          target="_blank"
          rel="noreferrer"
        >
          Token docs
        </a>
      </div>
    );
  }

  return (
    <div className="relative z-0 isolate h-full min-h-0 w-full overflow-hidden rounded-b-2xl bg-muted/25 dark:bg-muted/14">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxAccessToken}
        initialViewState={US_OVERVIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        projection="mercator"
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
                className={cn(
                  "h-[0.95rem] w-[0.95rem] rounded-full border border-white/75 shadow-md ring-1 ring-black/12 transition-transform hover:scale-[1.2] sm:h-4 sm:w-4",
                  heatMarkerClass[opportunityHeatBand(m.opportunityScore)],
                  selected && "scale-125 ring-2 ring-primary/90 shadow-lg"
                )}
              />
            </Marker>
          );
        })}
      </Map>
      <div className="pointer-events-none absolute bottom-3 left-3 z-20">
        <div className="pointer-events-auto max-w-48 rounded-xl border border-border/50 bg-card/97 px-3 py-2.5 text-[10px] leading-tight shadow-premium ring-1 ring-black/4 backdrop-blur-md dark:border-border/40 dark:bg-card/95 dark:ring-white/6">
          <div className="mb-2 flex items-center justify-between gap-1">
            <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Heat
            </p>
            <InfoTip
              label="Opportunity heat scale"
              side="top"
              align="end"
              className="size-6 text-muted-foreground"
            >
              Markers use an <span className="font-medium text-background">signal ramp</span>{" "}
              (slate → violet → gold), not good/bad traffic lights. Each dot is one labor
              market; shape is also encoded (ring / dot / diamond) so interpretation does not rely
              on color only.
            </InfoTip>
          </div>
          <div className="mb-2 h-1.5 rounded-full bg-linear-to-r from-(--opportunity-heat-low) via-(--opportunity-heat-mid) to-(--opportunity-heat-high) opacity-85" />
          <ul className="space-y-1 text-muted-foreground" aria-label="Opportunity heat legend">
            <li className="flex items-center gap-1.5">
              <span
                className="heat-marker--high size-2.5 shrink-0 rounded-full ring-1 ring-black/12"
                aria-hidden
              />
              Prime momentum (diamond)
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="heat-marker--mid size-2.5 shrink-0 rounded-full ring-1 ring-black/12"
                aria-hidden
              />
              Building demand (dot)
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="heat-marker--low size-2.5 shrink-0 rounded-full ring-1 ring-black/12"
                aria-hidden
              />
              Early signal (ring)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
