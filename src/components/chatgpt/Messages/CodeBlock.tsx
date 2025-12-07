import React from 'react';

interface CodeBlockProps {
  text: string;
}

export default function CodeBlock({ text }: CodeBlockProps) {
  const code = text.replace(/```/g, '');
  return (
    <pre className="bg-black text-green-400 p-4 rounded-xl overflow-auto text-sm whitespace-pre">
      {code}
    </pre>
  );
}