import { ImageAnnotatorClient } from "@google-cloud/vision";
import type { OCRProvider, OCRResult } from "@ocrwebapp/domain";

export class GoogleVisionOCRProvider implements OCRProvider {
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = new ImageAnnotatorClient();
  }

  async extractText(imageUrl: string, _options?: { signal?: AbortSignal }): Promise<OCRResult> {
    const [result] = await this.client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
    });

    const fullText = result.fullTextAnnotation?.text ?? "";
    const pages = result.fullTextAnnotation?.pages ?? [];

    const confidence =
      pages.length > 0 && pages[0].confidence != null
        ? pages[0].confidence
        : undefined;

    const boundingBoxes = (result.textAnnotations ?? []).slice(1).map((a) => ({
      text: a.description,
      vertices: a.boundingPoly?.vertices
    }));

    return {
      raw_text: fullText,
      confidence,
      bounding_boxes: boundingBoxes
    };
  }
}
