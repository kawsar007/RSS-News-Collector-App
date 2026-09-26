import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { RssFetchQueueService } from 'src/rss-fetch-queue/rss-fetch-queue.service';
import { RssFetchProducer } from '../rss-fetch-queue/rss-fetch.producer';
import { CreateNewsSourceDto } from './dto/create-news-source.dto';
import { UpdateNewsSourceDto } from './dto/update-news-source.dto';
import { NewsSourcesService } from './news-sources.service';

@Controller('news-sources')
export class NewsSourcesController {
  constructor(
    private readonly newsSourcesService: NewsSourcesService,
    private readonly rssFetchProducer: RssFetchProducer,
    private readonly rssFetchQueueService: RssFetchQueueService,
  ) {}

  @Post()
  create(@Body() dto: CreateNewsSourceDto) {
    return this.newsSourcesService.create(dto);
  }

  @Get()
  findAll() {
    return this.newsSourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsSourcesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNewsSourceDto,
  ) {
    return this.newsSourcesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsSourcesService.remove(id);
  }

  @Post(':id/fetch')
  async fetchNews(@Param('id', ParseIntPipe) id: number) {
    // Fail fast, synchronously, on things we already know before queueing:
    // no point enqueueing a job for a source that doesn't exist or is
    // inactive — same validation Phase 6/12 already had, just moved
    // earlier so a bad request never touches Redis at all.
    const source = await this.newsSourcesService.findOne(id);
    if (!source.isActive) {
      // Reuse the same error NewsSourcesService.fetchNews() would throw,
      // by calling it — this keeps the "inactive source" message in ONE
      // place (news-sources.service.ts) rather than duplicating it here.
      // fetchNews() will throw before doing any real work in this case.
      await this.newsSourcesService.fetchNews(id);
    }

    const jobId = await this.rssFetchProducer.enqueueFetch(id);
    return { jobId, message: 'Fetch job queued' };
  }

  @Get('fetch-jobs/:jobId')
  async getFetchJobStatus(@Param('jobId') jobId: string) {
    return this.rssFetchQueueService.getJobStatus(jobId);
  }
}
