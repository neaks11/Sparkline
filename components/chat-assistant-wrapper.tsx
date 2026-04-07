'use client';

// Thin client wrapper so ChatAssistant can be imported in the server layout.
// The chat fires a global CustomEvent 'sparkline:generate' which page.tsx
// listens for to trigger lead generation without needing direct prop drilling.
import { ChatAssistant } from './chat-assistant';

export function ChatAssistantWrapper() {
  return <ChatAssistant />;
}
