import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.service';
import { RssParserModule } from './rss-parser/rss-parser.module';

@Module({
  imports: [PrismaModule, RssParserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
