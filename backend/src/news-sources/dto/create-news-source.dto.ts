import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateNewsSourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsUrl({}, { message: 'url must be a valid URL' })
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string; // defaults to 'rss' at the DB level if omitted

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // defaults to true at the DB level if omitted
}
