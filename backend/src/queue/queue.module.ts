import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TestQueueProducer } from './test-queue.producer';
import { TestQueueWorker } from './test-queue.worker';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'test-queue',
    }),
  ],
  providers: [TestQueueProducer, TestQueueWorker],
  exports: [TestQueueProducer],
})
export class QueueModule {}
