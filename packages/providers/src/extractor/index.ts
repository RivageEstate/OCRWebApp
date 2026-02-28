import type { Extractor } from "@ocrwebapp/domain";
import { OpenAIExtractor } from "./openai-extractor";
import { StubExtractor } from "./stub-extractor";

export { OpenAIExtractor };
export { StubExtractor };

export function getExtractor(): Extractor {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIExtractor();
  }
  return new StubExtractor();
}
