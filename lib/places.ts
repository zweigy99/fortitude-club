export type PlaceResult = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  lat: number | null;
  lng: number | null;
};

/** Google Places API (New) text search. Needs GOOGLE_PLACES_API_KEY in Vercel. */
export async function searchPlaces(query: string, maxPages = 2): Promise<{ results: PlaceResult[]; error?: string }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { results: [], error: 'GOOGLE_PLACES_API_KEY is not set in Vercel yet.' };
  const results: PlaceResult[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location,places.businessStatus,nextPageToken',
      },
      body: JSON.stringify({ textQuery: query, pageSize: 20, regionCode: 'CA', ...(pageToken ? { pageToken } : {}) }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const t = await res.text();
      return { results, error: `Google Maps search failed (${res.status}): ${t.slice(0, 180)}` };
    }
    const j: any = await res.json();
    for (const p of j.places ?? []) {
      if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') continue;
      results.push({
        id: p.id,
        name: p.displayName?.text ?? 'Unknown',
        address: p.formattedAddress ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
      });
    }
    pageToken = j.nextPageToken;
    if (!pageToken) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { results };
}

/** Big chains that usually can't sign local deals. Edit as needed. */
export const CHAINS = [
  'goodlife', 'f45', 'orangetheory', 'barry', 'equinox', 'anytime fitness', 'planet fitness', 'fit4less', 'la fitness',
  'snap fitness', 'club pilates', 'pure barre', 'soulcycle', 'rumble', 'crunch', 'yyoga', 'shoppers', 'massage addict',
  'pt health', 'lifemark', 'kinatex', 'cbi health', 'spinco', 'oxygen yoga', 'hotel',
];
export const isChain = (name: string) => CHAINS.some((c) => name.toLowerCase().includes(c));
