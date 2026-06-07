import type { Booking, ChatMessageCreatedEvent } from "./types";

export interface ChatCacheMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  content: string;
  isRead?: boolean;
  createdAt: string;
}

export type ChatConversation = {
  id: string;
  customerId: string;
  staffId?: string | null;
  bookingId?: string | null;
  subject?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  messages?: ChatCacheMessage[];
};

export function mergeMessageIntoConversation<T extends ChatConversation>(
  current: T | null | undefined,
  event: ChatMessageCreatedEvent,
): T | ChatConversation | null | undefined {
  if (!current) {
    return {
      ...event.conversation,
      messages: [event.message],
    };
  }
  if (current.id !== event.conversationId) return current;

  return {
    ...current,
    ...event.conversation,
    customer: event.conversation.customer ?? current.customer,
    messages: appendMessage(current.messages ?? [], event.message),
  };
}

export function mergeConversationList(
  current: ChatConversation[] | undefined,
  event: ChatMessageCreatedEvent,
): ChatConversation[] {
  const conversations = current ?? [];
  let found = false;
  const next = conversations.map((conversation) => {
    if (conversation.id !== event.conversationId) return conversation;
    found = true;
    return {
      ...conversation,
      ...event.conversation,
      customer: event.conversation.customer ?? conversation.customer,
      messages: [event.latestMessage],
    };
  });

  if (!found) {
    next.unshift({
      ...event.conversation,
      messages: [event.latestMessage],
    });
  }

  return next.toSorted(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function mergeBookingConversationSummary<
  T extends { items?: Booking[]; data?: Booking[] },
>(current: T | undefined, event: ChatMessageCreatedEvent): T | undefined {
  if (!current || !event.bookingId) return current;

  const update = (booking: Booking): Booking => {
    if (booking.id !== event.bookingId) return booking;
    return {
      ...booking,
      conversation: {
        ...(booking.conversation ?? {}),
        ...event.conversation,
        messages: [event.latestMessage],
      },
    };
  };

  return {
    ...current,
    items: current.items?.map(update),
    data: current.data?.map(update),
  };
}

function appendMessage(
  messages: ChatCacheMessage[],
  message: ChatMessageCreatedEvent["message"],
) {
  const existing = new Set(messages.map((item) => item.id));
  if (existing.has(message.id)) return messages;
  return [...messages, message].toSorted(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
