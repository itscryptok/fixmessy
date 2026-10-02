export type AnalyzeMode = "reorganize" | "decor";

export interface ResultItem {
  name: string;
  price: number;
  quantity: number;
  url: string | null;
}

export interface AnalyzeResult {
  mode: AnalyzeMode;
  tidy: boolean;
  guide: string;
  items: ResultItem[];
  suggestion: string | null;
  beforeImage: string;
  afterImage: string | null;
  shared: boolean;
}

export const RESULT_KEY = "fixmessy:last-result";

export interface GalleryPair {
  id: string;
  mode: "reorganize" | "decor";
  createdAt: string;
  hasAfter: boolean;
}
