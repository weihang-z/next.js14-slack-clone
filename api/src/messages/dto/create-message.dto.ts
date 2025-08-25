import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  channelId: string;

  @IsOptional()
  @IsString()
  parentMessageId: string;

  @IsOptional()
  @IsString()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  memberId: string;
}
