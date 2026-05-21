"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Conversation = {
  id: number;
  name: string;
  skill: string;
  university: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
};

type ChatMessage = {
  id: number;
  sender: "peer" | "me";
  text: string;
  time: string;
};

const conversations: Conversation[] = [
  {
    id: 1,
    name: "Alex Rivera",
    skill: "Python Data Analysis",
    university: "Tech University",
    avatar: "/img/chats/alex-rivera.jpg",
    lastMessage: "Hey Alex! Thanks for reaching out...",
    time: "10:42 AM",
    online: true,
  },
  {
    id: 2,
    name: "Sarah Chen",
    skill: "Advanced Calculus Tutoring",
    university: "Science Faculty",
    avatar: "/img/chats/sarah-chen.jpg",
    lastMessage: "When are you free next week?",
    time: "Yesterday",
    unread: 2,
  },
  {
    id: 3,
    name: "Marcus Johnson",
    skill: "Graphic Design Portfolio",
    university: "Arts Institute",
    avatar: "/img/chats/marcus-johnson.jpg",
    lastMessage: "Sounds good, talk then!",
    time: "Mon",
  },
];

const messagesByConversation: Record<number, ChatMessage[]> = {
  1: [
    {
      id: 1,
      sender: "peer",
      text: "Hi! I saw your request for help with pandas and numpy arrays. I'm available this Thursday at 2 PM if that works for you?",
      time: "10:42 AM",
    },
    {
      id: 2,
      sender: "me",
      text: "Hey Alex! Thanks for reaching out. Yes, Thursday at 2 PM works perfectly for me. Should we meet at the main library or do this over Zoom?",
      time: "10:45 AM",
    },
  ],
  2: [
    {
      id: 1,
      sender: "peer",
      text: "When are you free next week? I can help you go through limits and derivatives before your quiz.",
      time: "Yesterday",
    },
  ],
  3: [
    {
      id: 1,
      sender: "me",
      text: "I will send over my portfolio draft tonight.",
      time: "Mon",
    },
    {
      id: 2,
      sender: "peer",
      text: "Sounds good, talk then!",
      time: "Mon",
    },
  ],
};

export default function ChatsPage() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];

  const filteredConversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [conversation.name, conversation.skill, conversation.lastMessage].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [searchTerm]);

  const messages = messagesByConversation[activeConversation.id] ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[720px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-950">Messages</h1>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Chat with your skill-swap peers
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0f4cbf]">
                3 chats
              </span>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Search chats</span>
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search chats..."
                className="h-11 w-full rounded-full border border-transparent bg-slate-100 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredConversations.map((conversation) => (
              <ConversationButton
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeConversation.id}
                onClick={() => setActiveId(conversation.id)}
              />
            ))}
          </div>
        </aside>

        <div className="flex min-h-[720px] flex-col bg-[#eef2ff]">
          <ChatHeader conversation={activeConversation} />

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <div className="mb-6 flex justify-center">
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-400">
                Today
              </span>
            </div>

            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  avatar={activeConversation.avatar}
                />
              ))}
            </div>
          </div>

          <Composer value={draftMessage} onChange={setDraftMessage} />
        </div>
      </div>
    </section>
  );
}

function ConversationButton({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 px-5 py-4 text-left transition ${
        active ? "bg-blue-50/80" : "hover:bg-slate-50"
      }`}
    >
      <div className="relative shrink-0">
        <Image
          src={conversation.avatar}
          alt={conversation.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
        />
        {conversation.online ? (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {conversation.name}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#0f4cbf]">
              {conversation.skill}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400">
            {conversation.time}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-sm text-slate-500">
            {conversation.lastMessage}
          </p>
          {conversation.unread ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2f66e7] px-1.5 text-xs font-bold text-white">
              {conversation.unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ChatHeader({ conversation }: { conversation: Conversation }) {
  return (
    <header className="border-b border-blue-200 bg-[#eef2ff] px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <Image
              src={conversation.avatar}
              alt={conversation.name}
              width={52}
              height={52}
              className="h-13 w-13 rounded-full object-cover"
            />
            {conversation.online ? (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#eef2ff] bg-emerald-500" />
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-950">
                {conversation.name}
              </h2>
              <VerifiedIcon className="h-4 w-4 shrink-0 text-[#2f66e7]" />
            </div>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {conversation.university} | {conversation.skill}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderActionButton
            icon={<UserIcon className="h-4 w-4" />}
            label="View Profile"
          />
          <HeaderActionButton
            icon={<StarIcon className="h-4 w-4" />}
            label="Submit Review"
          />
          <HeaderActionButton
            icon={<FlagIcon className="h-4 w-4" />}
            label="Report Issue"
            tone="danger"
          />
        </div>
      </div>
    </header>
  );
}

function HeaderActionButton({
  icon,
  label,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
        tone === "danger"
          ? "border-red-100 bg-red-100 text-red-700 hover:bg-red-200"
          : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-950"
      }`}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function MessageBubble({
  message,
  avatar,
}: {
  message: ChatMessage;
  avatar: string;
}) {
  const isMine = message.sender === "me";

  return (
    <div
      className={`flex items-end gap-3 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {!isMine ? (
        <Image
          src={avatar}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : null}

      <div
        className={`max-w-[min(620px,82%)] rounded-2xl px-4 py-3 shadow-sm ${
          isMine
            ? "rounded-br-md bg-[#2f66e7] text-white"
            : "rounded-bl-md bg-white text-slate-900"
        }`}
      >
        <p className="text-sm leading-6 sm:text-[15px]">{message.text}</p>
        <p
          className={`mt-2 text-right text-xs ${isMine ? "text-blue-100" : "text-slate-400"}`}
        >
          {message.time}
        </p>
      </div>

      {isMine ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f66e7] text-sm font-bold text-white">
          U
        </span>
      ) : null}
    </div>
  );
}

function Composer({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <form className="border-t border-slate-200 bg-white/85 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>

        <label className="sr-only" htmlFor="chat-message">
          Type your message
        </label>
        <input
          id="chat-message"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your message..."
          className="h-12 min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="submit"
          aria-label="Send message"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2f66e7] text-white shadow-sm transition hover:bg-[#2455c8]"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.8 14.1 5l3-.5.9 2.9 2.8 1.3-1.4 2.7 1.4 2.7-2.8 1.3-.9 2.9-3-.5L12 20l-2.1-2.2-3 .5-.9-2.9-2.8-1.3 1.4-2.7-1.4-2.7L6 7.4l.9-2.9 3 .5z" />
      <path
        d="m9.6 12.1 1.6 1.6 3.4-3.5"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path d="M4 20c1.7-3 5-4.5 8-4.5s6.3 1.5 8 4.5" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.8 6.8 19.3l1-5.9L3.5 9.3l5.9-.9z" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 20V4" />
      <path d="M6 5h10l-1 4 1 4H6" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="m21 8-9.8 9.8a5 5 0 0 1-7.1-7.1L13 1.8a3.4 3.4 0 0 1 4.8 4.8L8.9 15.5a1.8 1.8 0 0 1-2.5-2.5L14.8 4.6" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.8 4.4a1 1 0 0 1 1.1-.1l15 7a1 1 0 0 1 0 1.8l-15 7a1 1 0 0 1-1.4-1.2L5.8 13H12a1 1 0 1 0 0-2H5.8L3.5 5.6a1 1 0 0 1 .3-1.2z" />
    </svg>
  );
}
