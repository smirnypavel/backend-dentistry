import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { PromoCodesService } from './promo-codes.service';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Promo code to validate' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

@ApiTags('promo-codes')
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly service: PromoCodesService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate a promo code' })
  @ApiBody({ type: ValidatePromoCodeDto })
  @ApiOkResponse({
    description: 'Promo code info if valid',
    schema: {
      example: {
        valid: true,
        code: 'OLEG10',
        name: 'Промо Олега',
        type: 'percent',
        value: 10,
      },
    },
  })
  async validate(@Body() dto: ValidatePromoCodeDto) {
    const promo = await this.service.validate(dto.code);
    return {
      valid: true,
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value: promo.value,
    };
  }
}
