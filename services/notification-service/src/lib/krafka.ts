import { Consumer, Kafka, logLevel, Producer } from "kafkajs";
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

export type KafkaMessageHandler = (
  topic: string,
  payload: unknown,
) => void | Promise<void>;

export interface KafkaHelper {
  kafka: Kafka;
  publish: (topic: string, payload: unknown) => Promise<void>;
  consume: (
    groupId: string,
    topics: string[],
    handler: KafkaMessageHandler,
  ) => Promise<Consumer>;
}

export function createKafkaClient(clientId: string): KafkaHelper {
  const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({
    clientId,
    brokers,
    logLevel: logLevel.NOTHING,
    retry: { initialRetryTime: 300, retries: 8 },
  });

  let producer: Producer | null = null;
  let producerReady = false;

  async function ensureProducer(): Promise<Producer> {
    if (producerReady && producer) return producer;
    producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
    producerReady = true;
    producer.on(producer.events.DISCONNECT, () => {
      producerReady = false;
    });
    return producer;
  }

  async function publish(topic: string, payload: unknown): Promise<void> {
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
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[kafka] failed to produce ${topic}: ${message}`);
    }
  }

  async function consume(
    groupId: string,
    topics: string[],
    handler: KafkaMessageHandler,
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
            let payload: unknown = null;
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
              const message = err instanceof Error ? err.message : String(err);
              console.error(`[kafka] handler error on ${topic}: ${message}`);
            }
          },
        });
        return consumer;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[kafka] consumer connect failed (${message}), retrying in 5s`,
        );
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  return { kafka, publish, consume };
}
