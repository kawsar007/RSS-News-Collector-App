import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RssParserService } from '../rss-parser/rss-parser.service';
import { CreateNewsSourceDto } from './dto/create-news-source.dto';
import { UpdateNewsSourceDto } from './dto/update-news-source.dto';

export interface FetchStats {
  fetched: number;
  inserted: number;
  duplicates: number;
}

@Injectable()
export class NewsSourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rssParserService: RssParserService,
  ) {}

  async create(dto: CreateNewsSourceDto) {
    try {
      return await this.prisma.newsSource.create({
        data: {
          name: dto.name,
          url: dto.url,
          type: dto.type ?? 'rss',
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A source with url "${dto.url}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.newsSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { news: true } } },
    });
  }

  async findOne(id: number) {
    const source = await this.prisma.newsSource.findUnique({
      where: { id },
      include: { _count: { select: { news: true } } },
    });

    if (!source) {
      throw new NotFoundException(`NewsSource with id ${id} not found`);
    }

    return source;
  }

  async update(id: number, dto: UpdateNewsSourceDto) {
    await this.findOne(id);

    try {
      return await this.prisma.newsSource.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A source with url "${dto.url}" already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.newsSource.delete({ where: { id } });
    return { message: `NewsSource with id ${id} deleted successfully` };
  }

  async fetchNews(id: number): Promise<FetchStats> {
    const source = await this.findOne(id);

    // Business rule: an inactive source shouldn't be collected from.
    // 400 (not 403) because this isn't a permissions problem — it's the
    // caller trying an operation that's invalid given the resource's state.
    if (!source.isActive) {
      throw new BadRequestException(
        `Cannot fetch news from an inactive source. Activate "${source.name}" first.`,
      );
    }

    // Let RSS parsing errors surface as 400 — from the API consumer's
    // perspective, "the RSS URL doesn't work" is a bad-request situation.
    // Phase 11 will split this into more precise error types (timeout,
    // network failure, malformed XML).
    let items;
    try {
      items = await this.rssParserService.fetchAndParse(source.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to fetch or parse RSS feed: ${message}`,
      );
    }

    const fetched = items.length;

    // Skip items that are unusable even before touching the database.
    // We don't count these as "duplicates" — they're structurally invalid.
    // Phase 11 will log these properly instead of silently dropping them.
    const validItems = items.filter((item) => item.title && item.link);

    let inserted = 0;

    if (validItems.length > 0) {
      const result = await this.prisma.news.createMany({
        data: validItems.map((item) => ({
          sourceId: source.id,
          title: item.title,
          description: item.description,
          link: item.link,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          guid: item.guid,
        })),
        skipDuplicates: true, // relies on our @@unique([sourceId, guid]) constraint
      });

      inserted = result.count;
    }

    const duplicates = validItems.length - inserted;

    await this.prisma.newsSource.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date() },
    });

    return { fetched, inserted, duplicates };
  }
}
