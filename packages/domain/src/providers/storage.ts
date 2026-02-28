export interface StorageAdapter {
  upload(file: File): Promise<string>;
  getSignedUrl(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}

