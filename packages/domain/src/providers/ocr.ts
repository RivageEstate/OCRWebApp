export type OCRResult = {
  raw_text: string;
  confidence?: number;
  bounding_boxes?: unknown;
};

export type ProviderCallOptions = {
  signal?: AbortSignal;
};

export interface OCRProvider {
  extractText(imageUrl: string, options?: ProviderCallOptions): Promise<OCRResult>;
}
