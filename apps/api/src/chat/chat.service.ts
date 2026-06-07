import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  MessageEvent,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, Role } from "@prisma/client";
import { Observable } from "rxjs";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CHAT_MESSAGE_CREATED_EVENT,
  ChatRealtimeService,
} from "./chat-realtime.service";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ChatRealtimeService,
  ) {}

  streamForUser(user: { id: string; role: Role }): Observable<MessageEvent> {
    return this.realtime.streamForUser({
      userId: user.id,
      role: user.role,
    });
  }

  async getOrCreateConversation(customerId: string, subject?: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { customerId, status: "open" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { customerId, subject },
        include: { messages: true },
      });
    }
    return conversation;
  }

  async sendMessage(
    conversationId: string,
    sender: { id: string; role: Role },
    content: string,
  ) {
    const trimmed = content?.trim();
    if (!trimmed) throw new BadRequestException("Nội dung tin nhắn bắt buộc");

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    const booking = conversation.bookingId
      ? await this.prisma.booking.findUnique({
          where: { id: conversation.bookingId },
          select: { id: true, status: true },
        })
      : null;
    if (conversation.bookingId && !booking) {
      throw new NotFoundException("Đơn đặt phòng không tồn tại");
    }

    if (booking && booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Chỉ chat theo đơn khi đơn đang chờ duyệt");
    }

    const senderIsCustomer = conversation.customerId === sender.id;
    const senderIsStaff =
      sender.role === Role.ADMIN || sender.role === Role.RECEPTIONIST;
    if (!senderIsCustomer && !senderIsStaff) {
      throw new ForbiddenException("Không có quyền gửi tin nhắn hội thoại này");
    }

    const now = new Date();
    const [message, updatedConversation] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId: sender.id, content: trimmed },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: now },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    this.realtime.publishMessageCreated({
      type: CHAT_MESSAGE_CREATED_EVENT,
      conversationId: updatedConversation.id,
      bookingId: updatedConversation.bookingId,
      bookingStatus: booking?.status ?? null,
      customerId: updatedConversation.customerId,
      staffId: updatedConversation.staffId,
      senderId: sender.id,
      message,
      latestMessage: message,
      conversation: {
        id: updatedConversation.id,
        customerId: updatedConversation.customerId,
        staffId: updatedConversation.staffId,
        bookingId: updatedConversation.bookingId,
        subject: updatedConversation.subject,
        status: updatedConversation.status,
        createdAt: updatedConversation.createdAt,
        updatedAt: updatedConversation.updatedAt,
        customer: updatedConversation.customer,
      },
      updatedAt: updatedConversation.updatedAt,
    });

    return { ...message, conversation: updatedConversation };
  }

  async getOrCreateBookingConversation(customerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");
    if (booking.customerId !== customerId) {
      throw new ForbiddenException("Không có quyền truy cập chat đơn này");
    }
    if (booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Chỉ chat theo đơn khi đơn đang chờ duyệt");
    }

    return this.getOrCreateConversationForBooking(
      booking.customerId,
      bookingId,
      `Yêu cầu đặt phòng ${booking.bookingCode}`,
    );
  }

  async getOrCreateStaffBookingConversation(
    staffId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");
    if (booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Chỉ chat theo đơn khi đơn đang chờ duyệt");
    }

    const conversation = await this.getOrCreateConversationForBooking(
      booking.customerId,
      bookingId,
      `Yêu cầu đặt phòng ${booking.bookingCode}`,
    );
    if (!conversation.staffId) {
      return this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { staffId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }
    return conversation;
  }

  async getConversationsForStaff(status?: string) {
    return this.prisma.conversation.findMany({
      where: status ? { status } : {},
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getConversation(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  async assignStaff(conversationId: string, staffId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { staffId },
    });
  }

  async markAsResolved(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "resolved" },
    });
  }

  private async getOrCreateConversationForBooking(
    customerId: string,
    bookingId: string,
    subject: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { customerId, bookingId, status: "open" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { customerId, bookingId, subject },
        include: { messages: true },
      });
    }
    return conversation;
  }
}
