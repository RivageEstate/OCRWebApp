import type { OCRProvider } from "@ocrwebapp/domain";
import { GoogleVisionOCRProvider } from "./vision-provider";
import { StubOCRProvider } from "./stub-provider";

export { GoogleVisionOCRProvider };
export { StubOCRProvider };

export function getOCRProvider(): OCRProvider {
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return new GoogleVisionOCRProvider();
  }
  return new StubOCRProvider();
}
