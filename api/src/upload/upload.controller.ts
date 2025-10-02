import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { CurrentUserId } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 文件上传端点
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    return this.uploadService.saveFileInfo(
      file,
      userId,
      dto.workspaceId,
      dto.description
    );
  }

  // 兼容原有的生成上传URL接口（实际返回上传信息）
  @Post('url')
  generateUploadUrl(
    @Body() body: { workspaceId?: string },
    @CurrentUserId() userId: string,
  ) {
    return this.uploadService.generateUploadInfo(userId, body.workspaceId);
  }

  // 获取文件信息
  @Get('file/:id')
  getFile(@Param('id') fileId: string, @CurrentUserId() userId: string) {
    return this.uploadService.getFile(fileId, userId);
  }

  // 删除文件
  @Delete('file/:id')
  deleteFile(@Param('id') fileId: string, @CurrentUserId() userId: string) {
    return this.uploadService.deleteFile(fileId, userId);
  }

  // 获取工作空间的所有文件
  @Get('workspace/:workspaceId')
  getWorkspaceFiles(
    @Param('workspaceId') workspaceId: string,
    @CurrentUserId() userId: string
  ) {
    return this.uploadService.getFilesByWorkspace(workspaceId, userId);
  }
}
