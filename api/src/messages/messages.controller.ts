import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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

  @Post(':workspaceId')
  create(@Param('workspaceId') workspaceId: string, @Body() createMessageDto: CreateMessageDto, @CurrentUserId() userId: string) {
    return this.messagesService.create(workspaceId, createMessageDto, userId);
  }

  @Get(':workspaceId/:workspaceid')
  getList(@Param('workspaceId') workspaceId: string, getListDto: GetListDto, @CurrentUserId() userId: string) {
    return this.messagesService.list(workspaceId, userId, getListDto);
  }

  @Get(':workspaceId/:workspaceid')
  getById(@Param('workspaceid') workspaceid: string, messageId: string, @CurrentUserId() userId: string) {
    return this.messagesService.getById(workspaceid, messageId,userId);
  }

  @Patch()
  update(id: string, @Body() updateMessageDto: UpdateMessageDto, @CurrentUserId() userId: string) {
    return this.messagesService.update(id, updateMessageDto, userId);
  }

  @Delete(':workspaceId/:workspaceid')
  remove(@Param('workspaceid') workspaceId: string, messageId: string, @CurrentUserId() userId: string) {
    return this.messagesService.remove(workspaceId, messageId, userId);
  }
}
