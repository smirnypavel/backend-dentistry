import { Injectable, Logger } from '@nestjs/common';
import { SmsSender } from './sms.sender';

@Injectable()
export class ConsoleSmsSender implements SmsSender {
  private readonly logger = new Logger(ConsoleSmsSender.name);

  sendSms(to: string, message: string): Promise<void> {
    this.logger.log(`SMS to ${to}: ${message}`);
    return Promise.resolve();
  }
}
