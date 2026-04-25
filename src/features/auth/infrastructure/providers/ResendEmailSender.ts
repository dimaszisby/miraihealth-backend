import { Resend } from "resend";
import logger from "@/utils/logger.js";
import {
  EmailMessage,
  EmailSender,
} from "../../application/ports/EmailSender.js";

export class ResendEmailSender implements EmailSender {
  private client: Resend;

  constructor(
    apiKey: string,
    private from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      logger.error("[EMAIL:RESEND] failed to send email", {
        to: message.to,
        subject: message.subject,
        error: error.message,
      });
      throw new Error(`Resend email send failed: ${error.message}`);
    }
  }
}
