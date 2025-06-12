// src/types.ts
export interface Feature {
  name: string;
  description: string;
}

export interface Subclass {
  name: string;
  description: string;
}

export interface ProgressionEntry {
  level: number | string;
  columns: string[];
}

export interface SpellListEntry {
  label: string;
  url: string;
}

export interface ClassData {
  id: number;
  slug: string;
  name: string;
  description: string;
  source: string;
  tags: string[];
  prerequisites: string[];
  coreTraits: Record<string, string>;
  spellLists: SpellListEntry[];
  sidebars: string[];
  progression: ProgressionEntry[];
  features: Feature[];
  subclasses: Subclass[];
}
