import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsSourcesModule } from './news-sources/news-sources.module';
import { NewsModule } from './news/news.module';
import { PrismaModule } from './prisma/prisma.module';
import { RssParserModule } from './rss-parser/rss-parser.module';

@Module({
  imports: [PrismaModule, RssParserModule, NewsSourcesModule, NewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
