import { Injectable } from '@nestjs/common';
import { SmsSender } from './sms.sender';

@Injectable()
export class NoopSmsSender implements SmsSender {
  sendSms(): Promise<void> {
    return Promise.resolve();
  }
}
