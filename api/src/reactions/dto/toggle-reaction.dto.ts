import { IsString } from 'class-validator';

export class ToggleReactionDto {
  @IsString()
  messageId!: string;

  @IsString()
  value!: string;
}