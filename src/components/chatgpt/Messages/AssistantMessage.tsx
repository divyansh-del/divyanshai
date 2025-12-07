import React from 'react';
import CodeBlock from './CodeBlock';

interface AssistantMessageProps {
  text: string;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ text }) => {
  const cls = 'message-enter message-enter-active';
  const hasCode = text.includes('```');
  return (
    <div className={cls}>
      <div className="flex justify-start">
        <div className="max-w-xl px-4 py-3 rounded-xl bg-neutral-100 text-black">
          {hasCode ? <CodeBlock text={text} /> : text}
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;