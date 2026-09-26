import { Module, forwardRef } from '@nestjs/common';
import { RssFetchQueueModule } from '../rss-fetch-queue/rss-fetch-queue.module';
import { RssParserModule } from '../rss-parser/rss-parser.module';
import { NewsSourcesController } from './news-sources.controller';
import { NewsSourcesService } from './news-sources.service';

@Module({
  imports: [RssParserModule, forwardRef(() => RssFetchQueueModule)],
  controllers: [NewsSourcesController],
  providers: [NewsSourcesService],
  exports: [NewsSourcesService],
})
export class NewsSourcesModule {}
