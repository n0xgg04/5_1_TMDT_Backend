"use client";

import { api } from "./api";

export interface SseEvent<T = unknown> {
  type: string;
  data: T;
}

interface SubscribeToSseOptions<T> {
  accessToken: string;
  onEvent: (event: SseEvent<T>) => void;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
}

export function subscribeToSse<T>(
  path: string,
  { accessToken, onEvent, onOpen, onError }: SubscribeToSseOptions<T>,
) {
  const controller = new AbortController();

  void (async () => {
    try {
      const baseURL = api.defaults.baseURL;
      if (!baseURL) throw new Error("Missing API base URL");
      const response = await fetch(`${baseURL}${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE stream failed with ${response.status}`);
      }
      if (!response.body) {
        throw new Error("SSE response body is not readable");
      }

      onOpen?.();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = flushSseBuffer(buffer, onEvent);
      }

      if (!controller.signal.aborted) {
        throw new Error("SSE stream ended");
      }
    } catch (error) {
      if (!controller.signal.aborted) onError?.(error);
    }
  })();

  return () => controller.abort();
}

function flushSseBuffer<T>(
  raw: string,
  onEvent: (event: SseEvent<T>) => void,
) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const chunks = normalized.split("\n\n");
  const rest = chunks.pop() ?? "";

  for (const chunk of chunks) {
    const parsed = parseSseChunk<T>(chunk);
    if (parsed) onEvent(parsed);
  }

  return rest;
}

function parseSseChunk<T>(chunk: string): SseEvent<T> | null {
  let type = "message";
  const dataLines: string[] = [];

  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) {
      type = line.slice("event:".length).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (!dataLines.length) return null;

  try {
    return { type, data: JSON.parse(dataLines.join("\n")) as T };
  } catch {
    return null;
  }
}
