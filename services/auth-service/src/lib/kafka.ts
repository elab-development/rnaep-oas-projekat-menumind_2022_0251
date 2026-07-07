import { Kafka, logLevel, type Consumer } from "kafkajs";
import client from "prom-client";

const kafkaMessagesProduced = new client.Counter({
  name: "kafka_messages_produced_total",
  help: "Total Kafka messages successfully produced",
  labelNames: ["topic"],
});

const kafkaMessagesConsumed = new client.Counter({
  name: "kafka_messages_consumed_total",
  help: "Total Kafka messages consumed",
  labelNames: ["topic"],
});

const kafkaProduceErrors = new client.Counter({
  name: "kafka_produce_errors_total",
  help: "Total failed Kafka produce attempts",
  labelNames: ["topic"],
});

export type EventHandler = (
  topic: string,
  payload: Record<string, unknown> | null,
) => Promise<void>;

export function createKafkaClient(clientId: string) {
  const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId,
    brokers,
    logLevel: logLevel.NOTHING,
    retry: { initialRetryTime: 300, retries: 8 },
  });

  let producer: ReturnType<typeof kafka.producer> | null = null;
  let producerReady = false;

  async function ensureProducer() {
    if (producerReady && producer) return producer;
    producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
    producerReady = true;
    producer.on(producer.events.DISCONNECT, () => {
      producerReady = false;
    });
    return producer;
  }

  async function publish(topic: string, payload: unknown) {
    try {
      const p = await ensureProducer();
      await p.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });
      kafkaMessagesProduced.inc({ topic });
      console.log(`[kafka] produced ${topic}`, payload);
    } catch (err) {
      producerReady = false;
      kafkaProduceErrors.inc({ topic });
      console.error(`[kafka] failed to produce ${topic}: ${(err as Error).message}`);
    }
  }

  async function consume(
    groupId: string,
    topics: string[],
    handler: EventHandler,
  ): Promise<Consumer> {
    const consumer = kafka.consumer({ groupId });
    for (;;) {
      try {
        await consumer.connect();
        for (const topic of topics) {
          await consumer.subscribe({ topic, fromBeginning: false });
        }
        await consumer.run({
          eachMessage: async ({ topic, message }) => {
            let payload: Record<string, unknown> | null = null;
            try {
              payload = JSON.parse(message.value?.toString() ?? "null");
            } catch {
              console.error(`[kafka] non-JSON message on ${topic}, skipping`);
              return;
            }
            kafkaMessagesConsumed.inc({ topic });
            try {
              await handler(topic, payload);
            } catch (err) {
              console.error(`[kafka] handler error on ${topic}: ${(err as Error).message}`);
            }
          },
        });
        return consumer;
      } catch (err) {
        console.error(
          `[kafka] consumer connect failed (${(err as Error).message}), retrying in 5s`,
        );
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  return { kafka, publish, consume };
}
