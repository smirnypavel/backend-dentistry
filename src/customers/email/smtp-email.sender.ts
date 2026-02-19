import { Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { EmailSender } from './email.sender';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for 587
  user: string;
  pass: string;
  from: string; // e.g. "Store Ortho <storeortho271@gmail.com>"
}

export class SmtpEmailSender implements EmailSender {
  private readonly logger = new Logger('SmtpEmailSender');
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(options: SmtpOptions) {
    this.from = options.from;
    this.transporter = createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.user,
        pass: options.pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info: { messageId: string } = (await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      })) as { messageId: string };
      this.logger.log(`Email sent to ${to} — messageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : 'unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
