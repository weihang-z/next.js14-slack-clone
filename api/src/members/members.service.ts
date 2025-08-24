import { Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  create(createMemberDto: CreateMemberDto) {
    return 'This action adds a new member';
  }

  async getAll(workspaceId: string, userId: string) {
    const members = await this.prisma.member.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, email: true, name: true, image: true },
        },
      },
    });

    return members; // each member now has member.user with typed fields
  }

  async getById(id: string, userId: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) return null;

    const current = await this.prisma.member.findUnique({
      where: {
        workspaceId_userId: { workspaceId: member.workspaceId, userId },
      },
    });
    if (!current) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: member.userId },
    });
    if (!user) return null;

    return {
      ...member,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }

  update(id: number, updateMemberDto: UpdateMemberDto) {
    return `This action updates a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }
}
