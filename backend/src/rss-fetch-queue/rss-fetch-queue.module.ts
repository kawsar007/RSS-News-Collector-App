import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NewsSourcesModule } from '../news-sources/news-sources.module';
import { RssFetchProducer } from './rss-fetch.producer';
import { RssFetchWorker } from './rss-fetch.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'rss-fetch' }),
    NewsSourcesModule, // worker needs NewsSourcesService
  ],
  providers: [RssFetchProducer, RssFetchWorker],
  exports: [RssFetchProducer],
})
export class RssFetchQueueModule {}
