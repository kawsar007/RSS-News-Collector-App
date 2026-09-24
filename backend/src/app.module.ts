import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsSourcesModule } from './news-sources/news-sources.module';
import { NewsModule } from './news/news.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RssCollectionModule } from './rss-collection/rss-collection.module';
import { RssParserModule } from './rss-parser/rss-parser.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RssParserModule,
    NewsSourcesModule,
    NewsModule,
    RssCollectionModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
