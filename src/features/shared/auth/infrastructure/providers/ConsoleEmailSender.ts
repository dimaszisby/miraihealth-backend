import logger from "@/utils/logger.js";
import {
  EmailMessage,
  EmailSender,
} from "../../application/ports/EmailSender.js";

export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    logger.info("[EMAIL:CONSOLE] outbound email", {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
