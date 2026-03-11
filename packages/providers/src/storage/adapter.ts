import type { StorageAdapter } from "@ocrwebapp/domain";
import { R2StorageAdapter } from "./r2-adapter";

class LocalStubStorageAdapter implements StorageAdapter {
  async upload(file: File): Promise<string> {
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const uniqueSuffix = crypto.randomUUID();
    return `stub/${now}-${uniqueSuffix}-${file.name}`;
  }

  async getSignedUrl(path: string): Promise<string> {
    return `https://example.invalid/${encodeURIComponent(path)}`;
  }

  async delete(_path: string): Promise<void> {
    return;
  }
}

export function getStorageAdapter(): StorageAdapter {
  if (process.env.R2_BUCKET) {
    return new R2StorageAdapter();
  }
  return new LocalStubStorageAdapter();
}
