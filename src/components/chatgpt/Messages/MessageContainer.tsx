import React from 'react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';

interface Message {
  role: string;
  text: string;
}

interface MessageContainerProps {
  messages: Message[];
}

export default function MessageContainer({ messages }: MessageContainerProps) {
  const cls = 'message-enter message-enter-active';
  return (
    <div className={cls}>
      <div className="p-6 space-y-6">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <UserMessage key={i} text={m.text} />
          ) : (
            <AssistantMessage key={i} text={m.text} />
          )
        )}
      </div>
    </div>
  );
}