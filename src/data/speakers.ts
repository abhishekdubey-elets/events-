import generated from './speakers.generated.json';

/**
 * The speaker roster, lifted from the theme's speakers.html by
 * tools/extract-data.mjs. Names and designations come from Elets' own
 * published material; swap this module for a CMS query when one exists —
 * every consumer (listing, profile route, sitemap, JSON-LD) reads from here.
 */
export interface Speaker {
  slug: string;
  name: string;
  role: string;
  org: string;
  image: string;
  alt: string;
  badges: string[];
  cats: string[];
  searchText: string;
}

export const speakers: Speaker[] = generated as Speaker[];

export const getSpeaker = (slug: string): Speaker | undefined =>
  speakers.find((s) => s.slug === slug);

/** The profile the theme ships fully written out. */
export const FEATURED_SPEAKER = 'akash-tripathi';
