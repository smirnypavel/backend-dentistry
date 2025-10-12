import { Injectable, Logger } from '@nestjs/common';
import twilio, { Twilio } from 'twilio';
import { SmsSender } from './sms.sender';

interface TwilioSmsOptions {
  accountSid: string;
  from: string;
  authToken?: string;
  apiKeySid?: string;
  apiKeySecret?: string;
}

@Injectable()
export class TwilioSmsSender implements SmsSender {
  private readonly logger = new Logger(TwilioSmsSender.name);
  private readonly client: Twilio;

  constructor(private readonly options: TwilioSmsOptions) {
    if (this.options.authToken) {
      this.client = twilio(this.options.accountSid, this.options.authToken);
      return;
    }

    if (this.options.apiKeySid && this.options.apiKeySecret) {
      this.client = twilio(this.options.apiKeySid, this.options.apiKeySecret, {
        accountSid: this.options.accountSid,
      });
      return;
    }

    throw new Error('Twilio authToken or API key credentials must be provided');
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      await this.client.messages.create({
        from: this.options.from,
        to,
        body: message,
      });
    } catch (error) {
      this.logger.error('Failed to send SMS via Twilio', (error as Error).stack);
      throw error;
    }
  }
}
