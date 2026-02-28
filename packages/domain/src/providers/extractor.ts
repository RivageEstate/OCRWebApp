export type NormalizedFields = Record<string, unknown>;

export interface Extractor {
  extract(rawText: string): Promise<NormalizedFields>;
}

