import { PartialType } from '@nestjs/mapped-types';
import { CreateNewsSourceDto } from './create-news-source.dto';

// PartialType makes every field from CreateNewsSourceDto optional,
// while keeping the same validation rules when a field IS provided.
export class UpdateNewsSourceDto extends PartialType(CreateNewsSourceDto) {}
