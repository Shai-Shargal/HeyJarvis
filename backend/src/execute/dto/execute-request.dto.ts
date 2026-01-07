import { IsObject, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ActionPlan } from '../../chat/chat.types';

export class ExecuteRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => Object) // ActionPlan is a plain object, not a class
  plan!: ActionPlan;

  @IsOptional()
  @IsBoolean()
  confirm?: boolean;

  @IsOptional()
  message?: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}

