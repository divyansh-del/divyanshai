import React from 'react';

interface UserMessageProps {
  text: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ text }) => {
  const cls = 'message-enter message-enter-active';
  return (
    <div className={cls}>
      <div className="flex justify-end">
        <div className="max-w-xl px-4 py-3 rounded-xl bg-black text-white">
          {text}
        </div>
      </div>
    </div>
  );
};

export default UserMessage;