import { Logger } from '@nestjs/common';
import { EmailSender } from './email.sender';

/**
 * Development email sender — logs email content to the console.
 * Replace with a real SMTP / Resend / SendGrid sender in production.
 */
export class ConsoleEmailSender implements EmailSender {
  private readonly logger = new Logger('EmailSender');

  sendEmail(to: string, subject: string, html: string): Promise<void> {
    this.logger.log('═══════════════════════════════════════');
    this.logger.log(`📧  To: ${to}`);
    this.logger.log(`📋  Subject: ${subject}`);
    this.logger.log(`📝  Body:\n${html}`);
    this.logger.log('═══════════════════════════════════════');
    return Promise.resolve();
  }
}
