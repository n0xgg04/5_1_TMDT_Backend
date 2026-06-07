import { Injectable, MessageEvent } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Observable, Subject, finalize } from "rxjs";

export const CHAT_MESSAGE_CREATED_EVENT = "chat.message.created" as const;

export interface ChatRealtimeMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatRealtimeConversation {
  id: string;
  customerId: string;
  staffId: string | null;
  bookingId: string | null;
  subject: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ChatMessageCreatedPayload {
  type: typeof CHAT_MESSAGE_CREATED_EVENT;
  conversationId: string;
  bookingId: string | null;
  bookingStatus: string | null;
  customerId: string;
  staffId: string | null;
  senderId: string;
  message: ChatRealtimeMessage;
  latestMessage: ChatRealtimeMessage;
  conversation: ChatRealtimeConversation;
  updatedAt: Date;
}

interface ChatStreamRegistration {
  userId: string;
  role: Role;
}

@Injectable()
export class ChatRealtimeService {
  private readonly userStreams = new Map<string, Set<Subject<MessageEvent>>>();
  private readonly staffStreams = new Set<Subject<MessageEvent>>();

  streamForUser(user: ChatStreamRegistration): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    const set =
      this.userStreams.get(user.userId) ?? new Set<Subject<MessageEvent>>();
    set.add(subject);
    this.userStreams.set(user.userId, set);

    const isStaff = this.isStaffRole(user.role);
    if (isStaff) this.staffStreams.add(subject);

    return subject.asObservable().pipe(
      finalize(() => {
        set.delete(subject);
        if (set.size === 0) this.userStreams.delete(user.userId);
        if (isStaff) this.staffStreams.delete(subject);
      }),
    );
  }

  publishMessageCreated(payload: ChatMessageCreatedPayload) {
    const event: MessageEvent = {
      type: CHAT_MESSAGE_CREATED_EVENT,
      data: payload,
    };

    this.publishToCustomer(payload.customerId, event);
    this.publishToStaff(event);
  }

  private publishToCustomer(customerId: string, event: MessageEvent) {
    const streams = this.userStreams.get(customerId);
    if (!streams?.size) return;
    for (const stream of streams) {
      stream.next(event);
    }
  }

  private publishToStaff(event: MessageEvent) {
    if (!this.staffStreams.size) return;
    for (const stream of this.staffStreams) {
      stream.next(event);
    }
  }

  private isStaffRole(role: Role) {
    return role === Role.ADMIN || role === Role.RECEPTIONIST;
  }
}
