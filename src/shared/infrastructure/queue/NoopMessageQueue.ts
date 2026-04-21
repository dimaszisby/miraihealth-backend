import type { MessageQueuePort } from "@/shared/application/ports/MessageQueuePort.js";

export class NoopMessageQueue implements MessageQueuePort {
  isEnabled(): boolean {
    return false;
  }

  async publish(): Promise<void> {
    // intentional noop
  }

  async close(): Promise<void> {
    // intentional noop
  }
}
