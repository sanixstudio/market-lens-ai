import { marketRegions } from "@/lib/db/schema";

/**
 * Curated US labor markets for seeding and (future) city/state → region resolution.
 *
 * Scope: major MSAs and state anchors (~60) for national map coverage—not full CBSA inventory
 * (380+), which belongs in a pipeline or external dataset.
 *
 * Centroids: approximate principal-city coordinates for map markers; refine with geocoding in prod.
 */
export type UsMetroRegionInsert = typeof marketRegions.$inferInsert;

const M = (
  id: string,
  name: string,
  state: string,
  lat: number,
  lng: number
): UsMetroRegionInsert => ({
  id,
  regionType: "metro",
  regionName: name,
  state,
  centroidLat: lat,
  centroidLng: lng,
  geohash: null,
});

/** US metros + DC; IDs are stable `reg_{city}_{st}` slugs. */
export const US_METRO_REGIONS: readonly UsMetroRegionInsert[] = [
  M("reg_phoenix_az", "Phoenix, AZ", "AZ", 33.4484, -112.074),
  M("reg_tucson_az", "Tucson, AZ", "AZ", 32.2226, -110.9747),
  M("reg_los_angeles_ca", "Los Angeles, CA", "CA", 34.0522, -118.2437),
  M("reg_san_diego_ca", "San Diego, CA", "CA", 32.7157, -117.1611),
  M("reg_san_jose_ca", "San Jose, CA", "CA", 37.3382, -121.8863),
  M("reg_san_francisco_ca", "San Francisco, CA", "CA", 37.7749, -122.4194),
  M("reg_sacramento_ca", "Sacramento, CA", "CA", 38.5816, -121.4944),
  M("reg_oakland_ca", "Oakland, CA", "CA", 37.8044, -122.2712),
  M("reg_denver_co", "Denver, CO", "CO", 39.7392, -104.9903),
  M("reg_colorado_springs_co", "Colorado Springs, CO", "CO", 38.8339, -104.8214),
  M("reg_hartford_ct", "Hartford, CT", "CT", 41.7658, -72.6734),
  M("reg_wilmington_de", "Wilmington, DE", "DE", 39.7459, -75.5466),
  M("reg_washington_dc", "Washington, DC", "DC", 38.9072, -77.0369),
  M("reg_miami_fl", "Miami, FL", "FL", 25.7617, -80.1918),
  M("reg_tampa_fl", "Tampa, FL", "FL", 27.9506, -82.4572),
  M("reg_orlando_fl", "Orlando, FL", "FL", 28.5383, -81.3792),
  M("reg_jacksonville_fl", "Jacksonville, FL", "FL", 30.3322, -81.6557),
  M("reg_atlanta_ga", "Atlanta, GA", "GA", 33.749, -84.388),
  M("reg_honolulu_hi", "Honolulu, HI", "HI", 21.3069, -157.8583),
  M("reg_boise_id", "Boise, ID", "ID", 43.615, -116.2023),
  M("reg_chicago_il", "Chicago, IL", "IL", 41.8781, -87.6298),
  M("reg_indianapolis_in", "Indianapolis, IN", "IN", 39.7684, -86.1581),
  M("reg_des_moines_ia", "Des Moines, IA", "IA", 41.5868, -93.625),
  M("reg_wichita_ks", "Wichita, KS", "KS", 37.6872, -97.3301),
  M("reg_louisville_ky", "Louisville, KY", "KY", 38.2527, -85.7585),
  M("reg_new_orleans_la", "New Orleans, LA", "LA", 29.9511, -90.0715),
  M("reg_portland_me", "Portland, ME", "ME", 43.6591, -70.2568),
  M("reg_baltimore_md", "Baltimore, MD", "MD", 39.2904, -76.6122),
  M("reg_boston_ma", "Boston, MA", "MA", 42.3601, -71.0589),
  M("reg_detroit_mi", "Detroit, MI", "MI", 42.3314, -83.0458),
  M("reg_grand_rapids_mi", "Grand Rapids, MI", "MI", 42.9634, -85.6681),
  M("reg_minneapolis_mn", "Minneapolis, MN", "MN", 44.9778, -93.265),
  M("reg_billings_mt", "Billings, MT", "MT", 45.7833, -108.5007),
  M("reg_kansas_city_mo", "Kansas City, MO", "MO", 39.0997, -94.5786),
  M("reg_st_louis_mo", "St. Louis, MO", "MO", 38.627, -90.1994),
  M("reg_omaha_ne", "Omaha, NE", "NE", 41.2565, -95.9345),
  M("reg_las_vegas_nv", "Las Vegas, NV", "NV", 36.1699, -115.1398),
  M("reg_manchester_nh", "Manchester, NH", "NH", 42.9956, -71.4548),
  M("reg_newark_nj", "Newark, NJ", "NJ", 40.7357, -74.1724),
  M("reg_albuquerque_nm", "Albuquerque, NM", "NM", 35.0844, -106.6504),
  M("reg_buffalo_ny", "Buffalo, NY", "NY", 42.8864, -78.8784),
  M("reg_new_york_ny", "New York, NY", "NY", 40.7128, -74.006),
  M("reg_charlotte_nc", "Charlotte, NC", "NC", 35.2271, -80.8431),
  M("reg_raleigh_nc", "Raleigh, NC", "NC", 35.7796, -78.6382),
  M("reg_fargo_nd", "Fargo, ND", "ND", 46.8772, -96.7898),
  M("reg_columbus_oh", "Columbus, OH", "OH", 39.9612, -82.9988),
  M("reg_cleveland_oh", "Cleveland, OH", "OH", 41.4993, -81.6944),
  M("reg_cincinnati_oh", "Cincinnati, OH", "OH", 39.1031, -84.512),
  M("reg_oklahoma_city_ok", "Oklahoma City, OK", "OK", 35.4676, -97.5164),
  M("reg_tulsa_ok", "Tulsa, OK", "OK", 36.154, -95.9928),
  M("reg_portland_or", "Portland, OR", "OR", 45.5152, -122.6784),
  M("reg_philadelphia_pa", "Philadelphia, PA", "PA", 39.9526, -75.1652),
  M("reg_pittsburgh_pa", "Pittsburgh, PA", "PA", 40.4406, -79.9959),
  M("reg_providence_ri", "Providence, RI", "RI", 41.824, -71.4128),
  M("reg_charleston_sc", "Charleston, SC", "SC", 32.7765, -79.9311),
  M("reg_greenville_sc", "Greenville, SC", "SC", 34.8526, -82.394),
  M("reg_sioux_falls_sd", "Sioux Falls, SD", "SD", 43.5446, -96.7311),
  M("reg_nashville_tn", "Nashville, TN", "TN", 36.1627, -86.7816),
  M("reg_memphis_tn", "Memphis, TN", "TN", 35.1495, -90.049),
  M("reg_austin_tx", "Austin, TX", "TX", 30.2672, -97.7431),
  M("reg_dallas_tx", "Dallas, TX", "TX", 32.7767, -96.797),
  M("reg_houston_tx", "Houston, TX", "TX", 29.7604, -95.3698),
  M("reg_san_antonio_tx", "San Antonio, TX", "TX", 29.4241, -98.4936),
  M("reg_salt_lake_city_ut", "Salt Lake City, UT", "UT", 40.7608, -111.891),
  M("reg_burlington_vt", "Burlington, VT", "VT", 44.4759, -73.2121),
  M("reg_richmond_va", "Richmond, VA", "VA", 37.5407, -77.436),
  M("reg_virginia_beach_va", "Virginia Beach, VA", "VA", 36.8529, -75.978),
  M("reg_seattle_wa", "Seattle, WA", "WA", 47.6062, -122.3321),
  M("reg_spokane_wa", "Spokane, WA", "WA", 47.6587, -117.426),
  M("reg_milwaukee_wi", "Milwaukee, WI", "WI", 43.0389, -87.9065),
  M("reg_madison_wi", "Madison, WI", "WI", 43.0731, -89.4012),
  M("reg_charleston_wv", "Charleston, WV", "WV", 38.3498, -81.6326),
  M("reg_cheyenne_wy", "Cheyenne, WY", "WY", 41.14, -104.8202),
  M("reg_anchorage_ak", "Anchorage, AK", "AK", 61.2181, -149.9003),
  M("reg_little_rock_ar", "Little Rock, AR", "AR", 34.7465, -92.2896),
  M("reg_birmingham_al", "Birmingham, AL", "AL", 33.5186, -86.8104),
  M("reg_jackson_ms", "Jackson, MS", "MS", 32.2988, -90.1848),
  M("reg_montgomery_al", "Montgomery, AL", "AL", 32.3668, -86.3),
  M("reg_el_paso_tx", "El Paso, TX", "TX", 31.7619, -106.485),
] as const;

/** Stable hash for deterministic synthetic pay/listing counts per region. */
export function hashRegionId(regionId: string): number {
  let h = 2166136261;
  for (let i = 0; i < regionId.length; i++) {
    h ^= regionId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type PayTier = "premium" | "strong" | "mid" | "standard";

/**
 * Coarse cost-of-labor tier by state (pragmatic; refine with BLS or COL index in production).
 */
export function payTierForState(state: string | null | undefined): PayTier {
  if (state == null || state === "") return "standard";
  const s = state.toUpperCase();
  if (["CA", "NY", "WA", "MA"].includes(s)) return "premium";
  if (["DC", "NJ", "CO", "IL", "MD", "VA", "CT"].includes(s)) return "strong";
  if (
    [
      "TX",
      "FL",
      "GA",
      "NC",
      "PA",
      "MN",
      "OR",
      "AZ",
      "UT",
      "TN",
      "MO",
      "OH",
      "MI",
      "WI",
    ].includes(s)
  ) {
    return "mid";
  }
  return "standard";
}

/** 4–5 anchor weekly pays (USD) for SWE slot synthesis; tier-based with per-region jitter. */
export function sweWeeklyAnchorsForRegion(
  regionId: string,
  state: string | null | undefined
): number[] {
  const tier = payTierForState(state);
  const h = hashRegionId(regionId);
  const jitter = (h % 5) * 35;
  const bases: Record<PayTier, number[]> = {
    premium: [4300, 4180, 4050, 3920, 3780],
    strong: [3850, 3720, 3600, 3480, 3350],
    mid: [3400, 3280, 3150, 3020, 2920],
    standard: [3100, 2980, 2880, 2780, 2680],
  };
  return bases[tier].map((n) => n + jitter - 70);
}

export function dataMlTemplateForRegion(
  regionId: string,
  state: string | null | undefined
): { baseWeekly: number; baseCount: number } {
  const tier = payTierForState(state);
  const h = hashRegionId(regionId);
  const baseWeeklyTable: Record<PayTier, number> = {
    premium: 3780,
    strong: 3480,
    mid: 3220,
    standard: 2980,
  };
  const baseWeekly = baseWeeklyTable[tier] + (h % 7) * 45 - 90;
  const baseCount = 5 + (h % 5);
  return { baseWeekly, baseCount };
}

export function devopsTemplateForRegion(
  regionId: string,
  state: string | null | undefined
): { baseWeekly: number; baseCount: number } {
  const tier = payTierForState(state);
  const h = hashRegionId(regionId + ":devops");
  const baseWeeklyTable: Record<PayTier, number> = {
    premium: 3920,
    strong: 3580,
    mid: 3320,
    standard: 3080,
  };
  const baseWeekly = baseWeeklyTable[tier] + (h % 6) * 50 - 80;
  const baseCount = 4 + (h % 5);
  return { baseWeekly, baseCount };
}
