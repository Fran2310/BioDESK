import { PartialType } from '@nestjs/swagger';
import { ValueReferenceDto } from './value-ref.dto';

export class UpdateValueReferenceDto extends PartialType(ValueReferenceDto) {}
