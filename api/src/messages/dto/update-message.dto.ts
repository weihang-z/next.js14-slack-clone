import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsNotEmpty()
  @IsString()
  id: string;
  
  @IsString()
  body: string;
}
