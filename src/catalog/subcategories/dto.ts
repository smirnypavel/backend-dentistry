import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class I18nNameCreateDto {
  @IsString()
  @IsNotEmpty()
  uk!: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class I18nNameUpdateDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

class I18nDescDto {
  @IsOptional()
  @IsString()
  uk?: string;

  @IsOptional()
  @IsString()
  en?: string;
}

export class CreateSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ValidateNested()
  @Type(() => I18nNameCreateDto)
  @IsObject()
  nameI18n!: I18nNameCreateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDescDto)
  @IsObject()
  descriptionI18n?: I18nDescDto;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  // Empty string / absent = top-level. Otherwise the parent subcategory id.
  @IsString()
  @IsOptional()
  parentSubcategoryId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedProductIds?: string[];
}

export class UpdateSubcategoryDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nNameUpdateDto)
  @IsObject()
  nameI18n?: I18nNameUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDescDto)
  @IsObject()
  descriptionI18n?: I18nDescDto;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  parentSubcategoryId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedProductIds?: string[];
}
