import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

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

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    return this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: { conversation: true },
    });
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
