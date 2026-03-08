import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Extractor, NormalizedFields } from "@ocrwebapp/domain";

const EXTRACTOR_VERSION = "openai-gpt-4o-2024-08-06-v1";

const PropertySchema = z.object({
  propertyName: z.string().nullable().describe("物件名称"),
  address: z.string().nullable().describe("所在地"),
  price: z.number().nullable().describe("売買価格（万円）"),
  rent: z.number().nullable().describe("賃料（万円/月）"),
  yield: z.number().nullable().describe("利回り（%）"),
  structure: z.string().nullable().describe("構造（例: RC造、木造）"),
  builtYear: z.string().nullable().describe("築年（例: 1990年）"),
  stationInfo: z.string().nullable().describe("最寄り駅・徒歩分数（例: 渋谷駅 徒歩5分）")
});

export class OpenAIExtractor implements Extractor {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required");
    }
    this.client = new OpenAI();
  }

  async extract(rawText: string, _options?: { signal?: AbortSignal }): Promise<NormalizedFields> {
    const completion = await this.client.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content:
            "あなたは不動産物件概要書のOCRテキストから構造化データを抽出するアシスタントです。" +
            "与えられたテキストから物件情報を正確に抽出してください。" +
            "情報が見つからない場合は null を返してください。"
        },
        {
          role: "user",
          content: `以下のOCRテキストから物件情報を抽出してください:\n\n${rawText}`
        }
      ],
      response_format: zodResponseFormat(PropertySchema, "property_extraction")
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error("No parsed response from OpenAI");
    }

    return { ...parsed, extractorVersion: EXTRACTOR_VERSION };
  }
}
