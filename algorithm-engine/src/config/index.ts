import Redis from 'ioredis';
import { Worker, Queue } from 'bullmq';

const connection = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null, // BullMQ requirement
});

export const getWorker = (queueName: string, processor: any) => {
  return new Worker(queueName, processor, {
    connection: connection,
  });
};

export const triggerQueue = new Queue('execution', { connection });

export const getQueue = (queueName: string) => {
  return new Queue(queueName, {
    connection: connection,
  });
};

export { connection as redis };
