import { IsString, IsOptional, IsNumber } from "class-validator";

export class GetListDto {
    @IsString()
    workspaceId: string;

    @IsOptional()
    @IsString()
    channelId: string;

    @IsOptional()
    @IsString()
    conversationId: string;

    @IsOptional()
    @IsString()
    parentMessageId: string;

    @IsOptional()
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsString()
    cursor: string | null;
}