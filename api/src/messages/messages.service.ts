import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClient, Reaction, User } from '../../generated/prisma';

type ListParams = {
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
  limit?: number;
  cursor?: string | null; // last message id from previous page
};

type ReactionView = {
  value: string;
  count: number;
  memberIds: string[]; // unique
};

type ThreadMeta = {
  threadCount: number;
  threadImageUrl?: string;
  threadName?: string | null;
  threadTimestamp?: Date | null;
};


@Injectable()
export class MessagesService {

  constructor(private prisma: PrismaService) {}

  async getById(workspaceId: string, id: string, userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember) throw new ForbiddenException('Member not found');

    const message = await this.prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        memberId: true,
        text: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!message || message.workspaceId !== workspaceId) {
      throw new NotFoundException('Message not found');
    }

    const authorMember = await this.prisma.member.findUnique({
      where: { id: message.memberId },
      include: {
        user: { select: { id: true, email: true, name: true, image: true } },
      },
    });
    if (!authorMember) {
      throw new NotFoundException('Message not found');
    }

    const reactions = await this.prisma.reaction.findMany({
      where: { id },
      select: { value: true, memberId: true },
    });

    const mapByValue = new Map<string, Set<string>>();
    for (const r of reactions) {
      if (!mapByValue.has(r.value)) mapByValue.set(r.value, new Set<string>());
      mapByValue.get(r.value)!.add(r.memberId);
    }

    const reactionsWithCount: ReactionView[] = Array.from(mapByValue.entries()).map(
      ([value, set]) => ({ value, count: set.size, memberIds: Array.from(set) }),
    );

    return {
      ...message,
      userId,
      authorMember,
      reactions: reactionsWithCount,
    }
  }

  async list(
    workspaceId: string,
    userId: string,
    params: ListParams,
  ): Promise<{
    page: Array<{
      id: string;
      body: string;
      imageUrl?: string | null;
      memberId: string;
      workspaceId: string;
      channelId: string | null;
      conversationId: string | null;
      parentMessageId: string | null;
      createdAt: Date;
      updatedAtMs: bigint | null;
      member: {
        id: string;
        userId: string;
        user: { id: string; email: string; name: string | null; image: string | null };
      };
      user: User;
      reactions: ReactionView[];
      threadCount: number;
      threadImageUrl?: string;
      threadName?: string | null;
      threadTimestamp?: Date | null;
    }>;
    nextCursor: string | null;
    isDone: boolean;
  }> {
    const { channelId, parentMessageId, limit = 25 } = params;
    let conversationId = params.conversationId ?? null;

    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    if (!currentMember) throw new ForbiddenException();

    if (!conversationId && !channelId && parentMessageId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: parentMessageId },
        select: { id: true, workspaceId: true, conversationId: true },
      });
      if (!parent || parent.workspaceId !== workspaceId) {
        throw new NotFoundException('Parent message not found');
      }
      conversationId = parent.conversationId;
    }

    const rows = await this.prisma.message.findMany({
      where: {
        workspaceId,
        channelId: channelId ?? null,
        parentMessageId: parentMessageId ?? null,
        conversationId: conversationId ?? null,
      },
      include: {
        member: {
          include: {
            user: { select: { id: true, email: true, name: true, image: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: params.cursor ? 1 : 0,
      cursor: params.cursor ? { id: params.cursor } : undefined,
    });

    const messageIds = rows.map(r => r.id);

    const reactionsRaw = messageIds.length
      ? await this.prisma.reaction.findMany({
          where: { messageId: { in: messageIds } },
          select: { messageId: true, value: true, memberId: true },
        })
      : [];

    const reactionsByMessage = new Map<string, ReactionView[]>();
    const buckets = new Map<string, Map<string, Set<string>>>(); // msgId -> value -> memberIds
      for (const r of reactionsRaw) {
        if (!buckets.has(r.messageId)) buckets.set(r.messageId, new Map());
        const byValue = buckets.get(r.messageId)!;
        if (!byValue.has(r.value)) byValue.set(r.value, new Set());
        byValue.get(r.value)!.add(r.memberId);
      }
      for (const [msgId, byValue] of buckets.entries()) {
        const views: ReactionView[] = [];
        for (const [value, members] of byValue.entries()) {
          const memberIds = Array.from(members);
          views.push({ value, count: memberIds.length, memberIds });
        }
        reactionsByMessage.set(msgId, views);
      }

    // 5) Thread meta (count + latest child message)
    const threadMeta = new Map<string, ThreadMeta>();
    await Promise.all(
      messageIds.map(async (parentId) => {
        const count = await this.prisma.message.count({
          where: { parentMessageId: parentId },
        });
        if (count === 0) {
          threadMeta.set(parentId, { threadCount: 0 });
          return;
        }
        const latest = await this.prisma.message.findFirst({
          where: { parentMessageId: parentId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: { member: { include: { user: { select: { name: true } } } } },
        });
        threadMeta.set(parentId, {
          threadCount: count,
          threadImageUrl: latest?.imageUrl ?? undefined,
          threadName: latest?.member?.user?.name ?? null,
          // If you want to favor edits, you could prefer updatedAtMs here:
          threadTimestamp: latest?.createdAt ?? null,
        });
      }),
    );

    // 6) Build page; hide messages with missing author member/user
    const page = rows
      .map((m) => {
        if (!m.member || !m.member.user) return null;
        return {
          id: m.id,
          body: m.body,
          imageUrl: m.imageUrl ?? null, // already a URL in your schema
          memberId: m.memberId,
          workspaceId: m.workspaceId,
          channelId: m.channelId ?? null,
          conversationId: m.conversationId ?? null,
          parentMessageId: m.parentMessageId ?? null,
          createdAt: m.createdAt,
          updatedAtMs: m.updatedAtMs ?? null,
          member: m.member,
          user: m.member.user,
          reactions: reactionsByMessage.get(m.id) ?? [],
          ...threadMeta.get(m.id),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const nextCursor = page.length === limit ? page[page.length - 1].id : null;
    return { page, nextCursor, isDone: nextCursor === null };
  }

  async create(workspaceId: string, createMessageDto: CreateMessageDto, userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember) throw new ForbiddenException('Member not found');

    const message = await this.prisma.message.create({
      data: { ...createMessageDto, memberId: currentMember.id },
    });

    return message.id;
  }

  async update(workspaceId: string, updateMessageDto: UpdateMessageDto, userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember || updateMessageDto.id !== currentMember.id) throw new ForbiddenException();

    const message = await this.prisma.message.findUnique({
      where: { id: updateMessageDto.id },
    });
    if (!message) throw new NotFoundException('Message not found');

    const newMessage = await this.prisma.message.update({
      where: { id: updateMessageDto.id },
      data: { body: updateMessageDto.body },
    });

    return newMessage.id;
  }

  async remove(workspaceId: string, id: string, userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember || currentMember.id !== id) throw new ForbiddenException();

    const message = await this.prisma.message.findUnique({
      where: { id},
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.prisma.$transaction(async (tx: PrismaClient) => {
      await tx.reaction.deleteMany({ where: { messageId: id } });
      await tx.message.delete({ where: { id } });
    });
    return id;
  }
}
