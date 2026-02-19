/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import path from 'node:path';

export interface UploadedImage {
  url: string;
  secure_url?: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}

@Injectable()
export class UploadsService {
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return;
    const env = process.env as {
      CLOUDINARY_CLOUD_NAME?: string;
      CLOUDINARY_API_KEY?: string;
      CLOUDINARY_API_SECRET?: string;
      CLOUDINARY_URL?: string;
    };

    // Support both explicit vars and single CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>)
    let cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
    let apiKey = env.CLOUDINARY_API_KEY?.trim();
    let apiSecret = env.CLOUDINARY_API_SECRET?.trim();

    if ((!cloudName || !apiKey || !apiSecret) && env.CLOUDINARY_URL) {
      try {
        const u = new URL(env.CLOUDINARY_URL);
        // username = api_key, password = api_secret, host = cloud name
        cloudName = cloudName || u.host;
        apiKey = apiKey || decodeURIComponent(u.username);
        apiSecret = apiSecret || decodeURIComponent(u.password);
      } catch {
        // ignore parse errors; we'll validate below
      }
    }

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or set CLOUDINARY_URL).',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
  }

  async uploadBuffer(buffer: Buffer, filename?: string, folder?: string): Promise<UploadedImage> {
    this.ensureConfigured();
    const publicId = filename ? path.parse(filename).name : undefined;
    const res = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', public_id: publicId },
        (error: unknown, result?: UploadApiResponse) => {
          if (error) {
            return reject(
              error instanceof Error
                ? error
                : new Error(typeof error === 'string' ? error : 'Cloudinary upload error'),
            );
          }
          if (!result) return reject(new Error('Upload failed: empty result'));
          return resolve(result);
        },
      );
      stream.end(buffer);
    });
    return {
      url: res.url,
      secure_url: res.secure_url,
      public_id: res.public_id,
      width: res.width,
      height: res.height,
      format: res.format,
    };
  }

  async delete(publicId: string): Promise<{ result: string }> {
    this.ensureConfigured();
    const res: unknown = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    const result = (res as { result?: string }).result ?? 'ok';
    return { result };
  }
}
