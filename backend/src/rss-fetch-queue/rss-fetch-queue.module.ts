// backend/src/rss-fetch-queue/rss-fetch-queue.module.ts (final version)
import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { NewsSourcesModule } from '../news-sources/news-sources.module';
import { RssFetchQueueService } from './rss-fetch-queue.service';
import { RssFetchProducer } from './rss-fetch.producer';
import { RssFetchWorker } from './rss-fetch.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'rss-fetch' }),
    forwardRef(() => NewsSourcesModule),
  ],
  providers: [RssFetchProducer, RssFetchWorker, RssFetchQueueService],
  exports: [RssFetchProducer, RssFetchQueueService],
})
export class RssFetchQueueModule {}
