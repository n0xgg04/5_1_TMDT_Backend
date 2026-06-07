"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToSse } from "@/lib/sse";
import { useAuthStore } from "@/lib/auth-store";
import type { ChatMessageCreatedEvent } from "@/lib/types";

interface UseChatRealtimeOptions {
  enabled: boolean;
  onMessage: (event: ChatMessageCreatedEvent) => void;
  onReconnect?: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useChatRealtime({
  enabled,
  onMessage,
  onReconnect,
  onConnectionChange,
}: UseChatRealtimeOptions) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);
  const latest = useRef({ onMessage, onReconnect, onConnectionChange });

  useEffect(() => {
    latest.current = { onMessage, onReconnect, onConnectionChange };
  }, [onMessage, onReconnect, onConnectionChange]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setConnected(false);
      latest.current.onConnectionChange?.(false);
      return;
    }

    let stopped = false;
    let cleanup: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const setConnection = (value: boolean) => {
      if (stopped) return;
      setConnected(value);
      latest.current.onConnectionChange?.(value);
    };

    const connect = (isReconnect: boolean) => {
      cleanup?.();
      cleanup = subscribeToSse<ChatMessageCreatedEvent>("/chat/stream", {
        accessToken,
        onOpen: () => {
          setConnection(true);
          if (isReconnect) latest.current.onReconnect?.();
        },
        onEvent: (event) => {
          if (event.type !== "chat.message.created") return;
          latest.current.onMessage(event.data);
        },
        onError: () => {
          setConnection(false);
          if (stopped) return;
          retryTimer = setTimeout(() => connect(true), 3000);
        },
      });
    };

    connect(false);

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      cleanup?.();
      setConnected(false);
      latest.current.onConnectionChange?.(false);
    };
  }, [accessToken, enabled]);

  return { connected };
}
