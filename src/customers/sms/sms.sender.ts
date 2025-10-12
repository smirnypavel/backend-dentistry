export const SMS_SENDER = 'SMS_SENDER';

export interface SmsSender {
  sendSms(to: string, message: string): Promise<void>;
}
