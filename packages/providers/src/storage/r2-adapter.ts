import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { StorageAdapter } from "@ocrwebapp/domain";

export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const endpoint = process.env.R2_ENDPOINT;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
      throw new Error("Missing required R2 environment variables");
    }

    this.bucket = bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  async upload(file: File): Promise<string> {
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `uploads/${now}-${file.name}`;
    const bytes = await file.arrayBuffer();

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: new Uint8Array(bytes),
        ContentType: file.type
      })
    );

    return key;
  }

  async getSignedUrl(path: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async delete(path: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path
      })
    );
  }
}
