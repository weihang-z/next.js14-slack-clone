import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAndUpdateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
