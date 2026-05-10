/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import path from 'node:path';

// sharp is optional — import lazily
let sharp: typeof import('sharp') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp') as typeof import('sharp');
} catch { /* not available */ }

export interface UploadedImage {
  url: string; secure_url?: string; public_id: string;
  width?: number; height?: number; format?: string;
}
export interface CloudinaryFolder { name: string; path: string; }
export interface CloudinaryFile {
  public_id: string; secure_url: string; url: string;
  width: number; height: number; format: string; bytes: number;
  created_at: string; folder: string;
}

@Injectable()
export class UploadsService {
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return;
    const env = process.env as {
      CLOUDINARY_CLOUD_NAME?: string; CLOUDINARY_API_KEY?: string;
      CLOUDINARY_API_SECRET?: string; CLOUDINARY_URL?: string;
    };
    let cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
    let apiKey = env.CLOUDINARY_API_KEY?.trim();
    let apiSecret = env.CLOUDINARY_API_SECRET?.trim();
    if ((!cloudName || !apiKey || !apiSecret) && env.CLOUDINARY_URL) {
      try {
        const u = new URL(env.CLOUDINARY_URL);
        cloudName = cloudName || u.host;
        apiKey = apiKey || decodeURIComponent(u.username);
        apiSecret = apiSecret || decodeURIComponent(u.password);
      } catch { /* ignore */ }
    }
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary is not configured.');
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    this.configured = true;
  }

  private async compressBuffer(buffer: Buffer, originalname: string): Promise<Buffer> {
    if (!sharp) return buffer;
    const ext = path.extname(originalname).toLowerCase().replace('.', '');
    try {
      let pipeline = (sharp as unknown as (buf: Buffer) => import('sharp').Sharp)(buffer).rotate();
      pipeline = pipeline.resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true });
      let compressed: Buffer;
      if (ext === 'png') {
        compressed = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
      } else if (ext === 'webp') {
        compressed = await pipeline.webp({ quality: 90, effort: 4 }).toBuffer();
      } else {
        compressed = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
      }
      return compressed.length < buffer.length ? compressed : buffer;
    } catch { return buffer; }
  }

  async uploadBuffer(buffer: Buffer, filename?: string, folder?: string): Promise<UploadedImage> {
    this.ensureConfigured();
    const compressed = filename ? await this.compressBuffer(buffer, filename) : buffer;
    const publicId = filename ? path.parse(filename).name : undefined;
    const res = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', public_id: publicId, quality: 'auto:best' },
        (error: unknown, result?: UploadApiResponse) => {
          if (error) return reject(error instanceof Error ? error : new Error('Cloudinary upload error'));
          if (!result) return reject(new Error('Upload failed: empty result'));
          return resolve(result);
        },
      );
      stream.end(compressed);
    });
    return { url: res.url, secure_url: res.secure_url, public_id: res.public_id, width: res.width, height: res.height, format: res.format };
  }

  async delete(publicId: string): Promise<{ result: string }> {
    this.ensureConfigured();
    const res: unknown = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return { result: (res as { result?: string }).result ?? 'ok' };
  }

  async listFolders(prefix?: string): Promise<{ folders: CloudinaryFolder[] }> {
    this.ensureConfigured();
    const res: unknown = prefix ? await cloudinary.api.sub_folders(prefix) : await cloudinary.api.root_folders();
    return { folders: ((res as { folders?: unknown[] }).folders ?? []) as CloudinaryFolder[] };
  }

  async listFiles(folder?: string, cursor?: string): Promise<{ files: CloudinaryFile[]; next_cursor?: string }> {
    this.ensureConfigured();
    const params: Record<string, unknown> = { type: 'upload', max_results: 100, resource_type: 'image' };
    if (folder) params.prefix = folder + '/';
    if (cursor) params.next_cursor = cursor;
    const res: unknown = await cloudinary.api.resources(params as Parameters<typeof cloudinary.api.resources>[0]);
    const r = res as { resources?: CloudinaryFile[]; next_cursor?: string };
    return { files: r.resources ?? [], next_cursor: r.next_cursor };
  }

  async createFolder(folderPath: string): Promise<{ success: boolean }> {
    this.ensureConfigured();
    await cloudinary.api.create_folder(folderPath);
    return { success: true };
  }

  async deleteFolder(folderPath: string): Promise<{ success: boolean }> {
    this.ensureConfigured();
    await cloudinary.api.delete_folder(folderPath);
    return { success: true };
  }
}
