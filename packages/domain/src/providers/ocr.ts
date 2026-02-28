export type OCRResult = {
  raw_text: string;
  confidence?: number;
  bounding_boxes?: unknown;
};

export interface OCRProvider {
  extractText(imageUrl: string): Promise<OCRResult>;
}

