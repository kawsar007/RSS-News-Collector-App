import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNewsDto } from './dto/query-news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryNewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'publishedAt';
    const order = query.order ?? 'desc';

    const where: Prisma.NewsWhereInput = {};

    if (query.sourceId) {
      where.sourceId = query.sourceId;
    }

    if (query.search) {
      // MySQL + Prisma: default string filtering is case-insensitive
      // already under most common collations (utf8mb4_general_ci etc.),
      // so we don't need an explicit `mode` option like Postgres requires.
      where.title = { contains: query.search };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      include: {
        source: {
          select: { id: true, name: true, url: true },
        },
      },
    });

    if (!news) {
      throw new NotFoundException(`News with id ${id} not found`);
    }

    return news;
  }
}
