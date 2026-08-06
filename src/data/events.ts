/**
 * The 2026–27 calendar.
 *
 * Every card on the home grid, the /events index, the event detail route,
 * the sitemap and the Event JSON-LD read from this one list. Dates are ISO
 * where they are confirmed and `null` where the theme shows "TBC" — the
 * structured-data builder omits an Event's dates rather than guessing.
 *
 * Seat-allocation percentages are illustrative, exactly as the theme states.
 */
export type Sector = 'ai' | 'health' | 'edu' | 'gov' | 'city' | 'energy' | 'bfsi' | 'pharma';

export interface EventRecord {
  slug: string;
  name: string;
  /** Short label used on cards and in the sector chip. */
  sectorLabel: string;
  /** Filter categories — an event can sit in more than one. */
  cats: Sector[];
  /** Human date as printed in the theme. */
  dateLabel: string;
  /** ISO start/end, only where the date is actually fixed. */
  startDate: string | null;
  endDate: string | null;
  city: string | null;
  venue: string | null;
  image: string;
  summary: string;
  /** 0–100, illustrative. */
  allocated: number;
  status: 'open' | 'tbc' | 'soldout' | 'concluded';
  statusLabel?: string;
  featured?: boolean;
}

export const events: EventRecord[] = [
  {
    slug: 'india-energy-expo-2026',
    name: 'India Energy Expo 2026',
    sectorLabel: 'Energy',
    cats: ['energy'],
    dateLabel: '18–19 August 2026',
    startDate: '2026-08-18T09:30:00+05:30',
    endDate: '2026-08-19T17:30:00+05:30',
    city: 'New Delhi',
    venue: 'Eros Hotel, Nehru Place, New Delhi',
    image: '/assets/img/events/ev-01.svg',
    summary:
      'Two days on the grid of the future — storage, transmission, green hydrogen and the state utilities rebuilding their demand forecasting around AI.',
    allocated: 72,
    status: 'open',
    statusLabel: 'Registrations open',
    featured: true,
  },
  {
    slug: 'bfsi-gamechanger-summit-2026',
    name: '7th Elets BFSI Gamechanger Summit',
    sectorLabel: 'Banking',
    cats: ['bfsi'],
    dateLabel: 'August 2026',
    startDate: null,
    endDate: null,
    city: 'Goa',
    venue: null,
    image: '/assets/img/events/ev-02.svg',
    summary:
      'Banks, NBFCs and fintech platforms on lending infrastructure, digital public goods and the next wave of BFSI modernisation.',
    allocated: 58,
    status: 'tbc',
  },
  {
    slug: 'world-education-summit-2026',
    name: '36th Elets World Education Summit',
    sectorLabel: 'Education',
    cats: ['edu'],
    dateLabel: 'August 2026',
    startDate: null,
    endDate: null,
    city: 'New Delhi',
    venue: null,
    image: '/assets/img/events/ev-03.svg',
    summary:
      'Vice-chancellors, school leaders and edtech builders on curriculum, credentials and the operating model of the modern campus.',
    allocated: 41,
    status: 'tbc',
  },
  {
    slug: 'patient-centricity-summit-2026',
    name: '2nd Elets Patient Centricity Summit & Awards',
    sectorLabel: 'Healthcare',
    cats: ['health'],
    dateLabel: 'September 2026',
    startDate: null,
    endDate: null,
    city: 'Mumbai',
    venue: null,
    image: '/assets/img/events/ev-04.svg',
    summary:
      'Hospital chiefs, insurers and health-tech platforms on outcomes, access and the patient record that finally follows the patient.',
    allocated: 33,
    status: 'tbc',
  },
  {
    slug: 'national-psu-summit-2026',
    name: 'Elets National PSU Summit 2026',
    sectorLabel: 'Governance',
    cats: ['gov'],
    dateLabel: '2026 · date to be confirmed',
    startDate: null,
    endDate: null,
    city: 'New Delhi',
    venue: null,
    image: '/assets/img/events/ev-05.svg',
    summary:
      'Powering Atma Nirbhar Bharat through innovation, resilience and collaboration — with 50+ policymakers in the room.',
    allocated: 64,
    status: 'tbc',
    statusLabel: 'Government track',
  },
  {
    slug: 'urban-innovation-summit-2026',
    name: '6th Elets Urban Innovation Summit 2026',
    sectorLabel: 'Smart Cities',
    cats: ['city'],
    dateLabel: '2026 · date to be confirmed',
    startDate: null,
    endDate: null,
    city: 'India',
    venue: null,
    image: '/assets/img/events/ev-06.svg',
    summary:
      'Municipal commissioners and urban platforms on mobility, waste, water and the command centres tying them together.',
    allocated: 27,
    status: 'tbc',
  },
  {
    slug: 'national-skill-education-summit-up',
    name: 'National Skill & Education Summit, Uttar Pradesh',
    sectorLabel: 'Skills',
    cats: ['edu', 'gov'],
    dateLabel: '2026 · date to be confirmed',
    startDate: null,
    endDate: null,
    city: 'Lucknow',
    venue: null,
    image: '/assets/img/events/ev-07.svg',
    summary:
      'State skilling missions, universities and employers on the pipeline from classroom to payroll.',
    allocated: 49,
    status: 'tbc',
  },
  {
    slug: 'healthcare-innovation-summit-2026',
    name: '19th Elets Healthcare Innovation Summit & Awards',
    sectorLabel: 'Healthcare',
    cats: ['health'],
    dateLabel: 'December 2026',
    startDate: null,
    endDate: null,
    city: null,
    venue: null,
    image: '/assets/img/events/ev-08.svg',
    summary:
      'The nineteenth edition of the summit that put clinical leadership and hospital IT on the same agenda.',
    allocated: 18,
    status: 'tbc',
  },
  {
    slug: 'india-pharma-expo-2027',
    name: 'India Pharma Expo 2027',
    sectorLabel: 'Pharma',
    cats: ['pharma', 'health'],
    dateLabel: 'March 2027',
    startDate: null,
    endDate: null,
    city: 'Hyderabad',
    venue: null,
    image: '/assets/img/events/ev-09.svg',
    summary:
      'Manufacturing, regulation and export markets for India’s pharmaceutical industry.',
    allocated: 9,
    status: 'tbc',
  },
  {
    slug: 'india-ai-summit-2026',
    name: 'Elets India AI Summit 2026',
    sectorLabel: 'AI',
    cats: ['ai'],
    dateLabel: '22 January 2026',
    startDate: '2026-01-22T09:30:00+05:30',
    endDate: '2026-01-22T18:00:00+05:30',
    city: 'New Delhi',
    venue: 'Eros Hotel, Nehru Place, New Delhi',
    image: '/assets/img/events/ev-10.svg',
    summary:
      'Official pre-event to the India AI Impact Summit. 60+ speakers, 20+ partners, 350 delegates.',
    allocated: 100,
    status: 'concluded',
    statusLabel: 'Concluded · watch sessions',
  },
];

export const getEvent = (slug: string): EventRecord | undefined =>
  events.find((e) => e.slug === slug);

/** The event the theme's detail page is written around. */
export const FEATURED_EVENT = 'india-energy-expo-2026';

/** Sector → the event a nav entry should point at. */
export const SECTOR_LEAD: Record<string, string> = {
  ai: 'india-ai-summit-2026',
  health: 'patient-centricity-summit-2026',
  edu: 'world-education-summit-2026',
  gov: 'national-psu-summit-2026',
  city: 'urban-innovation-summit-2026',
  bfsi: 'bfsi-gamechanger-summit-2026',
  energy: 'india-energy-expo-2026',
};
