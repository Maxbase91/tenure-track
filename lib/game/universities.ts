// University pools by prestige (spec §11), anchored to QS World University
// Rankings 2026. The offer generator maps an offer's Institutional-Rep stars to
// a tier and picks a university at random. Expand freely.

export type Stars = 2 | 3 | 4 | 5;

export const UNIVERSITIES: Record<Stars, string[]> = {
  5: [
    "MIT", "Stanford", "Harvard", "Caltech", "Princeton", "Yale",
    "University of Cambridge", "University of Oxford", "Imperial College London",
    "ETH Zurich", "UC Berkeley", "University of Chicago",
  ],
  4: [
    "UCL", "Columbia", "Cornell", "University of Pennsylvania", "EPFL Lausanne",
    "University of Edinburgh", "King's College London", "Johns Hopkins",
    "LMU Munich", "Heidelberg", "KU Leuven", "Karolinska Institute",
    "TU Munich", "University of Manchester", "University of Michigan",
  ],
  3: [
    "University of Bristol", "University of Glasgow", "University of Warwick",
    "TU Delft", "University of Amsterdam", "Trinity College Dublin",
    "University of Copenhagen", "Uppsala", "Sorbonne", "University of Vienna",
    "Boston University", "UC Davis", "Wisconsin–Madison", "University of Zurich",
    "Lund",
  ],
  2: [
    "University of Leeds", "University of Nottingham", "Newcastle", "Cardiff",
    "University of Sussex", "University of Bologna", "Ghent",
    "University of Gothenburg", "University of Cologne",
    "Autonomous University of Barcelona", "Arizona State",
    "University of East Anglia",
  ],
};

// A random university from a tier, excluding any already picked for this set.
export function pickUniversity(stars: Stars, exclude: Set<string>): string {
  const pool = UNIVERSITIES[stars].filter((u) => !exclude.has(u));
  const list = pool.length ? pool : UNIVERSITIES[stars];
  return list[Math.floor(Math.random() * list.length)];
}
