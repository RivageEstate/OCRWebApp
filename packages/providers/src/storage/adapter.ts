import type { StorageAdapter } from "@ocrwebapp/domain";

class LocalStubStorageAdapter implements StorageAdapter {
  async upload(file: File): Promise<string> {
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    return `stub/${now}-${file.name}`;
  }

  async getSignedUrl(path: string): Promise<string> {
    return `https://example.invalid/${encodeURIComponent(path)}`;
  }

  async delete(_path: string): Promise<void> {
    return;
  }
}

export function getStorageAdapter(): StorageAdapter {
  return new LocalStubStorageAdapter();
}

