import { logger } from "../config/logger.js";
import {
  claimPendingOutboxEvents,
  markOutboxFailed,
  markOutboxProcessed,
  type OutboxEventType
} from "../db/repositories/outboxRepo.js";

const handlers: Record<OutboxEventType, (payload: Record<string, unknown>) => Promise<void>> = {
  "framework.created": async (payload) => {
    logger.info({ payload }, "Dispatching framework.created event");
  },
  "recommendations.generated": async (payload) => {
    logger.info({ payload }, "Dispatching recommendations.generated event");
  }
};

export const processOutboxBatch = async (limit = 20) => {
  const events = await claimPendingOutboxEvents(limit);

  for (const event of events) {
    try {
      const handler = handlers[event.event_type];
      await handler(event.payload);
      await markOutboxProcessed(event.id);
    } catch (error) {
      logger.error({ error, eventId: event.id }, "Outbox handler failed");
      await markOutboxFailed(event.id);
    }
  }

  return { processed: events.length };
};
