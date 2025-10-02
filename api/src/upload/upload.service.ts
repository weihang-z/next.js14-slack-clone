import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = './uploads';
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  constructor(private prisma: PrismaService) {
    // 确保上传目录存在
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFileInfo(
    file: Express.Multer.File,
    userId: string,
    workspaceId?: string,
    description?: string
  ) {
    const fileUrl = `${this.baseUrl}/uploads/${file.filename}`;
    
    const fileRecord = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key: file.filename, // 本地存储使用filename作为key
        url: fileUrl,
        uploadedBy: userId,
        workspaceId,
        description,
      },
    });

    return {
      id: fileRecord.id,
      filename: fileRecord.filename,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      url: fileRecord.url,
      uploadedAt: fileRecord.createdAt,
    };
  }

  async getFile(fileId: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        // 确保用户有权限访问文件
        OR: [
          { uploadedBy: userId },
          {
            workspace: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!file) {
      throw new NotFoundException('文件不存在或无权限访问');
    }

    return file;
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        uploadedBy: userId, // 只能删除自己上传的文件
      },
    });

    if (!file) {
      throw new BadRequestException('文件不存在或无权限删除');
    }

    try {
      // 从文件系统删除文件
      const filePath = join(this.uploadDir, file.key);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
      // 即使文件删除失败，也继续删除数据库记录
    }

    // 从数据库删除记录
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true };
  }

  async getFilesByWorkspace(workspaceId: string, userId: string) {
    // 验证用户是否是工作空间成员
    const member = await this.prisma.member.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        }
      }
    });

    if (!member) {
      throw new BadRequestException('无权限访问该工作空间的文件');
    }

    const files = await this.prisma.file.findMany({
      where: {
        workspaceId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return files;
  }

  // 为了保持与之前Hook的兼容性，提供一个生成上传URL的方法
  // 实际上本地存储不需要预签名URL，这里返回上传端点
  async generateUploadInfo(userId: string, workspaceId?: string) {
    return {
      uploadUrl: `${this.baseUrl}/upload/file`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`, // 这里需要传递实际的token
      },
      formData: {
        workspaceId: workspaceId || '',
      }
    };
  }
}
