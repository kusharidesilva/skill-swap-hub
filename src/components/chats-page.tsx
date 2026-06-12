"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { type Role } from "@/lib/role-routes";

type Conversation = {
  id: string;
  name: string;
  skill: string;
  university: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  peerId: string;
};

type ChatMessage = {
  id: string;
  sender: "peer" | "me";
  text: string;
  time: string;
};

type ChatsPageProps = {
  role?: Role;
};

export default function ChatsPage({ role = "buyer" }: ChatsPageProps) {
  const { userProfile } = useAuth();
  const searchParams = useSearchParams();
  const peerIdParam = searchParams.get("peerId");
  const subjectParam = searchParams.get("subject");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Check/create conversation when peerId is passed in URL query parameter
  useEffect(() => {
    if (!userProfile || !peerIdParam) return;

    async function initializeConversation() {
      const peerId = String(peerIdParam);
      const currentUid = String(userProfile?.uid);
      const currentName = String(userProfile?.name || "Student");
      const currentUniv = String(userProfile?.university || "");

      try {
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUid)
        );
        const snap = await getDocs(q);
        let existingChatId: string | null = null;

        snap.forEach((d) => {
          const data = d.data();
          if (data.participants?.includes(peerId)) {
            existingChatId = d.id;
          }
        });

        if (existingChatId) {
          setActiveId(existingChatId);
        } else {
          // Fetch peer info to initialize the chat doc
          const peerSnap = await getDoc(doc(db, "users", peerId));
          let peerName = "Student Partner";
          let peerUniv = "University";
          let peerSkill = subjectParam || "Skill Swap";

          if (peerSnap.exists()) {
            const peerData = peerSnap.data();
            peerName = peerData.name || "Student Partner";
            peerUniv = peerData.university || "University";
          }

          const newChatId = `${currentUid}_${peerId}`;
          const chatDocRef = doc(db, "chats", newChatId);

          await setDoc(chatDocRef, {
            participants: [currentUid, peerId],
            participantNames: {
              [currentUid]: currentName,
              [peerId]: peerName,
            },
            participantUniversities: {
              [currentUid]: currentUniv,
              [peerId]: peerUniv,
            },
            participantSkills: {
              [currentUid]: "Skills Help",
              [peerId]: peerSkill,
            },
            lastMessage: "Chat started",
            updatedAt: serverTimestamp(),
          });

          setActiveId(newChatId);
        }
      } catch (err) {
        console.error("Error initializing conversation:", err);
      }
    }

    initializeConversation();
  }, [userProfile, peerIdParam, subjectParam]);

  // 2. Load list of conversations in real-time from Firestore
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const peerId = data.participants?.find((p: string) => p !== userProfile.uid) || "";
        const name = data.participantNames?.[peerId] || "Student Partner";
        const skill = data.participantSkills?.[peerId] || "Skill Exchange";
        const university = data.participantUniversities?.[peerId] || "Sri Lankan University";

        let timeStr = "Recently";
        if (data.updatedAt) {
          const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
          timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        list.push({
          id: d.id,
          name,
          skill,
          university,
          avatar: "", // rendered using Initials fallback
          lastMessage: data.lastMessage || "",
          time: timeStr,
          peerId,
        });
      });

      setConversations(list);
      setLoading(false);

      // Select first conversation if none is active
      if (list.length > 0 && !activeId) {
        setActiveId(list[0].id);
      }
    });

    return () => unsubscribe();
  }, [userProfile, activeId]);

  // 3. Load messages for the active conversation in real-time
  useEffect(() => {
    if (!activeId) return;

    const messagesQuery = query(
      collection(db, `chats/${activeId}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        let timeStr = "Recently";
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        list.push({
          id: d.id,
          sender: data.senderId === userProfile?.uid ? "me" : "peer",
          text: data.text || "",
          time: timeStr,
        });
      });
      setMessages(list);
    });

    return () => unsubscribe();
  }, [activeId, userProfile]);

  // 4. Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draftMessage.trim();
    if (!text || !activeId || !userProfile) return;

    try {
      await addDoc(collection(db, `chats/${activeId}/messages`), {
        senderId: userProfile.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", activeId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });

      setDraftMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) || null;

  const filteredConversations = useMemo(() => {
    const queryTerm = searchTerm.trim().toLowerCase();
    if (!queryTerm) return conversations;

    return conversations.filter((conversation) =>
      [conversation.name, conversation.skill, conversation.lastMessage].some(
        (val) => val.toLowerCase().includes(queryTerm)
      )
    );
  }, [searchTerm, conversations]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2b62e6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[720px] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar */}
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
                {conversations.length} {conversations.length === 1 ? "chat" : "chats"}
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

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[580px]">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <ConversationButton
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeConversation?.id}
                  onClick={() => setActiveId(conversation.id)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No conversations found.
              </div>
            )}
          </div>
        </aside>

        {/* Conversation Pane */}
        {activeConversation ? (
          <div className="flex min-h-[720px] flex-col bg-[#eef2ff]">
            <ChatHeader conversation={activeConversation} role={role} />

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 max-h-[540px]">
              <div className="space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      peerName={activeConversation.name}
                    />
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-400 pt-8">
                    Send a message to start the conversation!
                  </div>
                )}
              </div>
            </div>

            <Composer value={draftMessage} onChange={setDraftMessage} onSubmit={handleSendMessage} />
          </div>
        ) : (
          <div className="flex min-h-[720px] flex-col items-center justify-center bg-[#eef2ff] p-8 text-center">
            <div className="rounded-full bg-blue-100 p-4 text-[#2f66e7]">
              <SendIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">Your Inbox</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Select a conversation from the sidebar or request a skill swap to message other members.
            </p>
          </div>
        )}
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
  const initials = conversation.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 px-5 py-4 text-left transition ${
        active ? "bg-blue-50/80" : "hover:bg-slate-50"
      }`}
    >
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
          {initials}
        </div>
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

function ChatHeader({
  conversation,
  role,
}: {
  conversation: Conversation;
  role: Role;
}) {
  const peerProfileHref = `/provider-profile/${conversation.peerId}?role=${role}`;
  const reportPeerHref = `/report-profile/${conversation.peerId}?role=${role}`;
  const initials = conversation.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="border-b border-blue-200 bg-[#eef2ff] px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-md">
              {initials}
            </div>
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
            href={peerProfileHref}
          />

          <HeaderActionButton
            icon={<FlagIcon className="h-4 w-4" />}
            label="Report Issue"
            tone="danger"
            href={reportPeerHref}
          />
        </div>
      </div>
    </header>
  );
}

function HeaderActionButton({
  icon,
  label,
  href,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  tone?: "default" | "danger";
}) {
  const className = `inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
    tone === "danger"
      ? "border-red-100 bg-red-100 text-red-700 hover:bg-red-200"
      : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-950"
  }`;

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={className}>
        {icon}
        <span className="sr-only">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" title={label} aria-label={label} className={className}>
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function MessageBubble({
  message,
  peerName,
}: {
  message: ChatMessage;
  peerName: string;
}) {
  const isMine = message.sender === "me";
  const peerInitials = peerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`flex items-end gap-3 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {!isMine ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-xs font-bold text-white shadow-sm">
          {peerInitials}
        </div>
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f66e7] text-sm font-bold text-white shadow-sm">
          ME
        </span>
      ) : null}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white/85 p-4">
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
