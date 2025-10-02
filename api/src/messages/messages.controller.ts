import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { CurrentUserId } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { GetListDto } from './dto/get-list.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('create')
  create(@Body() data: CreateMessageDto & { workspaceId: string }, @CurrentUserId() userId: string) {
    return this.messagesService.create(data.workspaceId, data, userId);
  }

  @Post('list')
  async getList(@Body() data: GetListDto, @CurrentUserId() userId: string) {
    return this.messagesService.list(data.workspaceId, userId, data);
  }

  @Get(':id')
  getById(
    @Param('id') messageId: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.messagesService.getById(workspaceId, messageId, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateMessageDto, @CurrentUserId() userId: string) {
    return this.messagesService.update(id, data, userId);
  }

  @Delete(':id')
  remove(@Param('id') messageId: string, @Body() data: { workspaceId: string }, @CurrentUserId() userId: string) {
    return this.messagesService.remove(data.workspaceId, messageId, userId);
  }
}
