import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export const thumbKeyOf = (key: string) => `${key}_thumb`;

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

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

  async signUrl(folder: string): Promise<{ url: string; key: string; thumbUrl: string; thumbKey: string }> {
    const { client, bucket } = this.client();

    const key = `${folder}/${uuidv4()}`;
    const thumbKey = thumbKeyOf(key);
    const [url, thumbUrl] = await Promise.all(
      [key, thumbKey].map((Key) => getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key }), { expiresIn: 900 })),
    );

    return { url, key, thumbUrl, thumbKey };
  }

  /** Best-effort delete of an image and its thumbnail — swallows errors so a missing object never blocks an update. */
  async deleteKey(key: string): Promise<void> {
    if (key.startsWith('http') || key.startsWith('backups/')) return;
    const { client, bucket } = this.client();
    await Promise.all(
      [key, thumbKeyOf(key)].map((Key) =>
        client.send(new DeleteObjectCommand({ Bucket: bucket, Key })).catch(() => {
          // storage cleanup is not critical enough to fail the caller's request
        }),
      ),
    );
  }

  /**
   * Writes an append-only, versioned JSON snapshot of a finalized event to S3.
   * Each finalization creates a new `v{N}-{timestamp}.json` object and never
   * overwrites or deletes previous versions.
   */
  async saveEventBackup(
    eventId: string,
    payload: Record<string, unknown>,
  ): Promise<{ key: string; version: number } | null> {
    try {
      const { client, bucket } = this.client();
      const prefix = `backups/events/${eventId}/`;

      const listed = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
      );
      const existingVersions = (listed.Contents ?? [])
        .map((obj) => {
          const match = /\/v(\d+)-/.exec(obj.Key ?? '');
          return match ? Number(match[1]) : 0;
        })
        .filter((v) => v > 0);
      const version =
        existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `${prefix}v${version}-${stamp}.json`;
      const body = JSON.stringify(
        {
          version,
          backedUpAt: new Date().toISOString(),
          ...payload,
        },
        null,
        2,
      );

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: 'application/json',
          IfNoneMatch: '*',
        }),
      );

      this.logger.log(`Saved immutable event backup ${key}`);
      return { key, version };
    } catch (err) {
      this.logger.error(
        `Failed to write event backup for ${eventId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
