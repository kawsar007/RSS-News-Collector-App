import { Module } from '@nestjs/common';
import { NewsSourcesModule } from '../news-sources/news-sources.module';
import { RssCollectionService } from './rss-collection.service';

@Module({
  imports: [NewsSourcesModule],
  providers: [RssCollectionService],
})
export class RssCollectionModule {}
