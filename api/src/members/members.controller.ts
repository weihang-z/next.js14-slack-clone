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
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CurrentUserId } from 'src/auth/current-user.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(+id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(+id);
  }
}
