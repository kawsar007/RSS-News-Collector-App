import { Module } from '@nestjs/common';
import { NewsSourcesController } from './news-sources.controller';
import { NewsSourcesService } from './news-sources.service';

@Module({
  controllers: [NewsSourcesController],
  providers: [NewsSourcesService],
  exports: [NewsSourcesService], // Phase 6 will need this from a RssCollectionModule
})
export class NewsSourcesModule {}
