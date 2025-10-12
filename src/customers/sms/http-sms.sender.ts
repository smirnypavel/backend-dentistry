import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SmsSender } from './sms.sender';

export interface HttpSmsSenderOptions {
  baseUrl: string;
  apiKey?: string;
  from?: string;
  timeoutMs?: number;
}

@Injectable()
export class HttpSmsSender implements SmsSender {
  private readonly logger = new Logger(HttpSmsSender.name);
  private readonly client: AxiosInstance;

  constructor(private readonly options: HttpSmsSenderOptions) {
    this.client = axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeoutMs ?? 5000,
      headers: this.options.apiKey
        ? {
            Authorization: `Bearer ${this.options.apiKey}`,
          }
        : undefined,
    });
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      await this.client.post('/send', {
        to,
        from: this.options.from,
        message,
      });
    } catch (error) {
      this.logger.error('Failed to send SMS', (error as Error).stack);
      throw error;
    }
  }
}
