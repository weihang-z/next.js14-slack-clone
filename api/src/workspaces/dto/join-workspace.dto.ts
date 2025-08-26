import { IsString } from "class-validator";

export class JoinWorkspaceDto {
    @IsString()
    joinCode!: string;
  }