export type NormalizedFields = Record<string, unknown>;

export type ExtractorCallOptions = {
  signal?: AbortSignal;
};

export interface Extractor {
  extract(rawText: string, options?: ExtractorCallOptions): Promise<NormalizedFields>;
}
