'use client';

import { Chatbot } from '@/components/chatbot';

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 tracking-tight">Numeron AI Chatbot</h1>
        <Chatbot />
      </div>
    </div>
  );
}
