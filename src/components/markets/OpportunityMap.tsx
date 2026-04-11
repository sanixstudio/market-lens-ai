"use client";

/**
 * Mapbox stack (latest react-map-gl Mapbox integration):
 * - Map component: https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map
 * - Mapbox tokens: https://visgl.github.io/react-map-gl/docs/get-started/mapbox-tokens
 * - Map GL JS `Map`: https://docs.mapbox.com/mapbox-gl-js/api/map/
 * - Next.js: expose the token as `NEXT_PUBLIC_MAPBOX_TOKEN` so the client bundle can read it.
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

/** @see https://docs.mapbox.com/mapbox-gl-js/guides/styles/#mapbox-core-styles */
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

function readMapboxAccessToken(): string {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    ""
  );
}

/**
 * Uncontrolled map: stable `initialViewState` only (react-map-gl state-management pattern).
 * @see https://visgl.github.io/react-map-gl/docs/get-started/state-management
 */
const US_OVERVIEW = {
  longitude: -98.35,
  latitude: 39.5,
  zoom: 3.25,
  pitch: 0,
  bearing: 0,
} as const;

/**
 * Mapbox `fitBounds` options; `linear: true` uses `easeTo` instead of default `flyTo`.
 * @see https://docs.mapbox.com/mapbox-gl-js/api/properties/#fitboundsoptions
 */
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

  /**
   * `onLoad` callback: https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map#callbacks
   * Scroll zoom tuning: https://docs.mapbox.com/mapbox-gl-js/api/handlers/#scrollzoomhandler
   */
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
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Mapbox token missing</p>
        <p>
          Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
          <code className="rounded bg-muted px-1">.env.local</code> and restart the dev server.
        </p>
        <p className="text-xs">
          See react-map-gl:{" "}
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
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-lg border border-border bg-muted/30">
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
    </div>
  );
}
