import { Module } from '@nestjs/common';
import { RssParserModule } from 'src/rss-parser/rss-parser.module';
import { NewsSourcesController } from './news-sources.controller';
import { NewsSourcesService } from './news-sources.service';

@Module({
  imports: [RssParserModule],
  controllers: [NewsSourcesController],
  providers: [NewsSourcesService],
  exports: [NewsSourcesService], // Phase 6 will need this from a RssCollectionModule
})
export class NewsSourcesModule {}
