import { createKafkaClient } from "./lib/krafka.js";

export const { publish } = createKafkaClient("menu-service");
