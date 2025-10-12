import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export class CustomerOrdersQueryDto {
  @Transform(({ value }) => toNumber(value) ?? 1)
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => toNumber(value) ?? 20)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
