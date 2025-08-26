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

  @Post('list')
  getAll(
    @Body() data: { workspaceId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.membersService.getAll(data.workspaceId, userId);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.membersService.getById(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateData: { workspaceId: string; role: 'admin' | 'member' },
    @CurrentUserId() userId: string,
  ) {
    return this.membersService.updateRole(updateData.workspaceId, id, updateData.role, userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Body() data: { workspaceId: string },
    @CurrentUserId() userId: string
  ) {
    return this.membersService.remove(data.workspaceId, id, userId);
  }
}
