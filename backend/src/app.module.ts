import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsSourcesModule } from './news-sources/news-sources.module';
import { NewsModule } from './news/news.module';
import { PrismaModule } from './prisma/prisma.module';
import { RssCollectionModule } from './rss-collection/rss-collection.module';
import { RssFetchQueueModule } from './rss-fetch-queue/rss-fetch-queue.module';
import { RssParserModule } from './rss-parser/rss-parser.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    PrismaModule,
    RssParserModule,
    NewsSourcesModule,
    NewsModule,
    RssCollectionModule,
    RssFetchQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
