import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CurrentUserId } from 'src/auth/current-user.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get(`workspace/:workspaceId`)
  getAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.membersService.getAll(workspaceId, userId);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.membersService.getById(id, userId);
  }

  @Patch('workspace/:workspaceId/member/:id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() role: 'admin' | 'member',
    @CurrentUserId() userId: string,
  ) {
    return this.membersService.updateRole(workspaceId, id, role, userId);
  }

  @Delete('workspace/:workspaceId/member/:id')
  remove(@Param('workspaceId') workspaceId: string, @Param('id') id: string, @CurrentUserId() userId: string) {
    return this.membersService.remove(workspaceId, id, userId);
  }
}
