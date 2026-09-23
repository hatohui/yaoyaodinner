import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImagesService {
  constructor(private config: ConfigService) {}

  private client(): { client: S3Client; bucket: string } {
    const accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID');
    const accessKey = this.config.get<string>('CLOUDFLARE_ACCESS_KEY_ID');
    const secret = this.config.get<string>('CLOUDFLARE_SECRET_ACCESS_KEY');
    const bucket = this.config.get<string>('BUCKET_NAME');

    const s3Endpoint = this.config.get<string>('S3_ENDPOINT');

    if (!accessKey || !secret || !bucket || (!s3Endpoint && !accountId)) {
      throw new InternalServerErrorException('Missing storage configuration: set S3_ENDPOINT (local) or CLOUDFLARE_ACCOUNT_ID (R2)');
    }

    const endpoint = s3Endpoint ?? `https://${accountId}.r2.cloudflarestorage.com`;

    const client = new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'auto',
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secret },
      forcePathStyle: true,
    });

    return { client, bucket };
  }

  async signUrl(folder: string): Promise<{ url: string; key: string }> {
    const { client, bucket } = this.client();

    const key = `${folder}/${uuidv4()}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: 900 });

    return { url, key };
  }

  /** Best-effort delete — swallows errors so a missing/already-gone object never blocks an update. */
  async deleteKey(key: string): Promise<void> {
    const { client, bucket } = this.client();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      // storage cleanup is not critical enough to fail the caller's request
    }
  }
}
