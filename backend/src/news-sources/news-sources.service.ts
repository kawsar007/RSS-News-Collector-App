import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsSourceDto } from './dto/create-news-source.dto';
import { UpdateNewsSourceDto } from './dto/update-news-source.dto';

@Injectable()
export class NewsSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

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
      if (this.isUniqueConstraintError(error)) {
        // P2002 = unique constraint violation (our @unique on `url`)
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
      include: {
        _count: { select: { news: true } }, // handy for the dashboard/sources list later
      },
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
    await this.findOne(id); // throws 404 early if it doesn't exist

    try {
      return await this.prisma.newsSource.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          `A source with url "${dto.url}" already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id); // throws 404 early if it doesn't exist

    await this.prisma.newsSource.delete({ where: { id } });

    return { message: `NewsSource with id ${id} deleted successfully` };
  }
}
