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
import { CreateNewsSourceDto } from './dto/create-news-source.dto';
import { UpdateNewsSourceDto } from './dto/update-news-source.dto';
import { NewsSourcesService } from './news-sources.service';

@Controller('news-sources')
export class NewsSourcesController {
  constructor(private readonly newsSourcesService: NewsSourcesService) {}

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
}
