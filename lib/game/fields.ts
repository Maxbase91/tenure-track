// Research fields (spec §3). Each flavours events/topics and applies a minor
// starting tilt. Tilts are deliberately small (§3 "minor starting tilt") — the
// field is mostly a lens for events, not a power pick.

import type { Meters } from "./types";

export type FieldId =
  | "molecular-biology"
  | "neuroscience"
  | "physics"
  | "chemistry"
  | "computer-science"
  | "ecology";

export interface Field {
  id: FieldId;
  label: string;
  tilt: Partial<Meters> & { knowledge?: number };
  flavour: string;
}

export const FIELDS: Field[] = [
  { id: "molecular-biology", label: "Molecular Biology", tilt: { money: 2000 }, flavour: "Reagents, freezers, and the eternal Western blot." },
  { id: "neuroscience", label: "Neuroscience", tilt: { knowledge: 2 }, flavour: "Big questions, bigger error bars." },
  { id: "physics", label: "Physics", tilt: { reputation: 1 }, flavour: "Elegant theory, baroque apparatus." },
  { id: "chemistry", label: "Chemistry", tilt: { money: 1000 }, flavour: "If it's brown it's done; if it's black it's buggered." },
  { id: "computer-science", label: "Computer Science", tilt: { morale: 5 }, flavour: "No wet lab, just the cluster queue." },
  { id: "ecology", label: "Ecology", tilt: { morale: 8 }, flavour: "Fieldwork is just a holiday with a permit." },
];

export const FIELD_BY_ID: Record<FieldId, Field> = Object.fromEntries(
  FIELDS.map((f) => [f.id, f]),
) as Record<FieldId, Field>;

export function randomField(): FieldId {
  return FIELDS[Math.floor(Math.random() * FIELDS.length)].id;
}
