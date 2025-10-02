import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetListDto } from './dto/get-list.dto';

type ReactionView = {
  value: string;
  count: number;
  memberIds: string[]; // unique
};

type ThreadMeta = {
  threadCount: number;
  threadImage?: string | null;
  threadName?: string | null;
  threadTimestamp?: Date | null;
};

type MessageList = {
  messages: Array<{
    id: string;
    body: string;
    imageUrl?: string | null;
    memberId: string;
    workspaceId: string;
    channelId: string | null;
    conversationId: string | null;
    parentMessageId: string | null;
    createdAt: Date;
    updatedAt?: string;
    member: {
      id: string;
      userId: string;
      user: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
      };
    };
    reactions: ReactionView[];
    threadCount: number;
    threadName?: string | null;
    threadTimestamp?: Date | null;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
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
    });
    if (!message || message.workspaceId !== workspaceId) {
      throw new NotFoundException('Message not found');
    }

    // validate message is in the workspace
    const authorMember = await this.prisma.member.findUnique({
      where: { id: message.memberId },
      include: {
        user: { select: { id: true, email: true, name: true, image: true } },
      },
    });
    if (!authorMember || authorMember.workspaceId !== workspaceId) {
      throw new NotFoundException('Message not found');
    }

    const reactions = await this.prisma.reaction.findMany({
      where: { messageId: id },
      select: { value: true, memberId: true },
    });

    const mapByValue = new Map<string, Set<string>>();
    for (const r of reactions) {
      if (!mapByValue.has(r.value)) mapByValue.set(r.value, new Set<string>());
      mapByValue.get(r.value)!.add(r.memberId);
    }

    const reactionsWithCount: ReactionView[] = Array.from(
      mapByValue.entries(),
    ).map(([value, set]) => ({
      value,
      count: set.size,
      memberIds: Array.from(set),
    }));

    return {
      ...message,
      reactions: reactionsWithCount,
    };
  }

  async list(
    workspaceId: string,
    userId: string,
    params: GetListDto,
  ): Promise<MessageList> {
    const limitNum = Math.max(1, Math.min(100, Number(params.limit) || 25));
    const { channelId, parentMessageId } = params;
    let conversationId = params.conversationId ?? undefined;

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
      if (parent.conversationId) {
        conversationId = parent.conversationId;
      }
    }

    if (channelId) {
      const ch = await this.prisma.channel.findUnique({
        where: { id: channelId },
        select: { workspaceId: true },
      });
      if (!ch || ch.workspaceId !== workspaceId) {
        throw new ForbiddenException('Invalid channel for this workspace');
      }
    }

    if (conversationId) {
      const cv = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { workspaceId: true, memberOneId: true, memberTwoId: true },
      });
      if (!cv || cv.workspaceId !== workspaceId) {
        throw new ForbiddenException('Invalid conversation for this workspace');
      }
      if (
        cv.memberOneId !== currentMember.id &&
        cv.memberTwoId !== currentMember.id
      ) {
        throw new ForbiddenException('Not a participant of this conversation');
      }
    }

    const where: any = { workspaceId };
    if (channelId !== undefined) where.channelId = channelId;
    if (parentMessageId !== undefined) where.parentMessageId = parentMessageId;
    if (conversationId !== undefined) where.conversationId = conversationId;

    const rows = await this.prisma.message.findMany({
      where,
      include: {
        member: {
          include: {
            user: {
              select: { id: true, email: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limitNum,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : 0,
    });

    const messageIds = rows.map((r) => r.id);

    const reactionsRaw = messageIds.length
      ? await this.prisma.reaction.findMany({
          where: { messageId: { in: messageIds } },
          select: { messageId: true, value: true, memberId: true },
        })
      : [];

      const reactionsByMessage = new Map<string, ReactionView[]>();
      const bucket = new Map<string, Map<string, Set<string>>>(); // messageIds -> value -> memberIds
  
      for (const r of reactionsRaw) {
        if (!bucket.has(r.messageId))
          bucket.set(r.messageId, new Map<string, Set<string>>());
        const mapByValue = bucket.get(r.messageId)!;
  
        if (!mapByValue.has(r.value)) mapByValue.set(r.value, new Set<string>());
        mapByValue.get(r.value)!.add(r.memberId);
      }
  
      for (const [messageId, mapByValue] of bucket.entries()) {
        const reactions: ReactionView[] = [];
        for (const [value, memberIds] of mapByValue) {
          reactions.push({
            value: value,
            count: memberIds.size,
            memberIds: Array.from(memberIds),
          });
        }
  
        reactionsByMessage.set(messageId, reactions);
      }

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
          include: {
            member: { include: { user: { select: { name: true } } } },
          },
        });
        threadMeta.set(parentId, {
          threadCount: count,
          threadName: latest?.member?.user?.name ?? null,
          threadImage: latest?.imageUrl ?? null,
          threadTimestamp: latest?.createdAt ?? null,
        });
      }),
    );

    const messages = rows
      .map((m) => {
        if (!m.member || !m.member.user) return null;
        const updatedAtStr =
          m.updatedAtMs != null
            ? new Date(Number(m.updatedAtMs)).toISOString()
            : '';
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
          updatedAt: updatedAtStr,
          member: m.member,
          reactions: reactionsByMessage.get(m.id) ?? [],
          threadCount: threadMeta.get(m.id)?.threadCount ?? 0,
          threadName: threadMeta.get(m.id)?.threadName ?? null,
          threadTimestamp: threadMeta.get(m.id)?.threadTimestamp ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const nextCursor =
      messages.length === limitNum ? messages[messages.length - 1].id : null;
    return { messages, nextCursor, hasMore: nextCursor !== null };
  }

  async create(
    workspaceId: string,
    createMessageDto: CreateMessageDto,
    userId: string,
  ) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember) throw new ForbiddenException('Member not found');

    const message = await this.prisma.message.create({
      data: {
        body: createMessageDto.body,
        imageUrl: createMessageDto.imageUrl ?? null,
        channelId: createMessageDto.channelId ?? null,
        parentMessageId: createMessageDto.parentMessageId ?? null,
        conversationId: createMessageDto.conversationId ?? null,
        memberId: currentMember.id,
        workspaceId,
      },
    });

    const response = {
      id: message.id,
      body: message.body,
      imageUrl: message.imageUrl ?? undefined,
      workspaceId: message.workspaceId,
      channelId: message.channelId ?? undefined,
      parentMessageId: message.parentMessageId ?? undefined,
      conversationId: message.conversationId ?? undefined,
      memberId: message.memberId,
      createdAt: message.createdAt,
      updatedAt:
        message.updatedAtMs != null
          ? new Date(Number(message.updatedAtMs)).toISOString()
          : '',
    };

    return response;
  }

  async update(
    workspaceId: string,
    updateMessageDto: UpdateMessageDto,
    userId: string,
  ) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember || updateMessageDto.id !== currentMember.id)
      throw new ForbiddenException();

    const message = await this.prisma.message.findUnique({
      where: { id: updateMessageDto.id },
    });
    if (!message) throw new NotFoundException('Message not found');

    const newMessage = await this.prisma.message.update({
      where: { id: updateMessageDto.id },
      data: { body: updateMessageDto.body },
    });

    const response = {
      id: newMessage.id,
      body: newMessage.body,
      imageUrl: newMessage.imageUrl ?? undefined,
      workspaceId: newMessage.workspaceId,
      channelId: newMessage.channelId ?? undefined,
      parentMessageId: newMessage.parentMessageId ?? undefined,
      conversationId: newMessage.conversationId ?? undefined,
      memberId: newMessage.memberId,
      createdAt: newMessage.createdAt,
      updatedAt:
        newMessage.updatedAtMs != null
          ? new Date(Number(newMessage.updatedAtMs)).toISOString()
          : '',
    };

    return response;
  }

  async remove(workspaceId: string, id: string, userId: string) {
    const currentMember = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!currentMember || currentMember.id !== id)
      throw new ForbiddenException();

    const message = await this.prisma.message.findUnique({
      where: { id },
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.reaction.deleteMany({ where: { messageId: id } });
      await tx.message.delete({ where: { id } });
    });
    return { id };
  }
}
