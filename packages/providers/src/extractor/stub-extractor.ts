import type { Extractor, NormalizedFields } from "@ocrwebapp/domain";

export class StubExtractor implements Extractor {
  async extract(_rawText: string): Promise<NormalizedFields> {
    return {
      propertyName: null,
      address: null,
      price: null,
      rent: null,
      yield: null,
      structure: null,
      builtYear: null,
      stationInfo: null,
      extractorVersion: "stub-v1"
    };
  }
}
