import type { OCRProvider, OCRResult } from "@ocrwebapp/domain";

export class StubOCRProvider implements OCRProvider {
  async extractText(_imageUrl: string, _options?: { signal?: AbortSignal }): Promise<OCRResult> {
    return {
      raw_text: "stub OCR text",
      confidence: 1.0,
      bounding_boxes: []
    };
  }
}
