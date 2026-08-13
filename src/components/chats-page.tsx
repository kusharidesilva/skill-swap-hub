"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { type Role } from "@/lib/role-routes";
import { createNotification } from "@/lib/notifications";
import { getRoleBadge, getVerificationBadge } from "@/lib/identity-badges";

type Conversation = {
  id: string;
  name: string;
  skill: string;
  university: string;
  avatar: string;
  verificationLabel: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  peerId: string;
  peerRole: Role;
  serviceContext?: ServiceContext;
  updatedAtMs: number;
};

type PeerInboxSummary = {
  peerId: string;
  name: string;
  university: string;
  avatar: string;
  verificationLabel: string;
  lastMessage: string;
  time: string;
  latestSkill: string;
  latestConversationId: string;
  threadCount: number;
  updatedAtMs: number;
  online?: boolean;
  peerRole: Role;
};

type ChatMessage = {
  id: string;
  sender: "peer" | "me";
  text: string;
  time: string;
  senderName: string;
  senderRole: Role;
  attachments: ChatAttachment[];
  serviceContext?: ServiceContext;
};

type ChatsPageProps = {
  role?: Role;
};

type ChatAttachment = {
  name: string;
  size: number;
  type: string;
  url: string;
};

type ServiceContext = {
  gigId?: string;
  title?: string;
  category?: string;
  price?: number | string;
  providerName?: string;
};

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export default function ChatsPage({ role = "buyer" }: ChatsPageProps) {
  const { userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get("chatId");
  const peerIdParam = searchParams.get("peerId");
  const subjectParam = searchParams.get("subject");
  const gigIdParam = searchParams.get("gigId");
  const categoryParam = searchParams.get("category");
  const priceParam = searchParams.get("price");
  const providerNameParam = searchParams.get("providerName");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentChatId = activeId || chatIdParam;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  // Opening chat from a profile creates the conversation only if it does not exist.
  useEffect(() => {
    if (chatIdParam || !userProfile || !peerIdParam) return;

    async function initializeConversation() {
      const peerId = String(peerIdParam);
      const currentUid = String(userProfile?.uid);
      const currentName = String(userProfile?.name || "Student");
      const currentUniv = String(userProfile?.university || "");
      const currentRole = resolveChatRole(userProfile?.role);
      const threadKey = gigIdParam || (subjectParam ? `subject-${slugSegment(subjectParam)}` : null);
      const requestedServiceContext: ServiceContext = {
        title: subjectParam || "Service Chat",
        category: categoryParam || "",
        price: priceParam || "",
      };
      if (gigIdParam) {
        requestedServiceContext.gigId = gigIdParam;
      }
      if (providerNameParam) {
        requestedServiceContext.providerName = providerNameParam;
      }

      try {
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUid)
        );
        const snap = await getDocs(q);
        let existingChatId: string | null = null;

        snap.forEach((d) => {
          const data = d.data();
          const matchesPeer = data.participants?.includes(peerId);
          const matchesThread = threadKey
            ? data.threadKey === threadKey ||
              data.gigId === gigIdParam ||
              data.serviceContext?.gigId === gigIdParam
            : true;
          if (matchesPeer && matchesThread) {
            existingChatId = d.id;
          }
        });

        if (existingChatId) {
          setActiveId(existingChatId);
        } else {
          // Store a small peer snapshot so the chat list can render quickly.
          const peerSnap = await getDoc(doc(db, "users", peerId));
          let peerName = "Student Partner";
          let peerUniv = "University";
          const peerSkill = subjectParam || "Service Chat";
          let peerRole: Role = "buyer";

          if (peerSnap.exists()) {
            const peerData = peerSnap.data();
            peerName = peerData.name || "Student Partner";
            peerUniv = peerData.university || "University";
            peerRole = resolveChatRole(peerData.role);
          }

          const newChatId = threadKey
            ? `${currentUid}_${peerId}_${slugSegment(threadKey)}`
            : `${currentUid}_${peerId}`;
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
            participantRoles: {
              [currentUid]: currentRole,
              [peerId]: peerRole,
            },
            participantSkills: {
              [currentUid]: "Skills Help",
              [peerId]: peerSkill,
            },
            gigId: gigIdParam || null,
            threadKey,
            serviceContext: requestedServiceContext,
            lastMessage: "Chat started",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          setActiveId(newChatId);
        }
      } catch (err) {
        console.error("Error initializing conversation:", err);
      }
    }

    initializeConversation();
  }, [categoryParam, chatIdParam, gigIdParam, peerIdParam, priceParam, providerNameParam, subjectParam, userProfile]);

  // Listen to every conversation that includes the current user.
  useEffect(() => {
    if (!userProfile) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const peerId = data.participants?.find((p: string) => p !== userProfile.uid) || "";
          const rawServiceContext = isServiceContext(data.serviceContext)
            ? data.serviceContext
            : { title: data.participantSkills?.[peerId] || "Service Chat", category: "" };
          const skill = rawServiceContext.title || data.participantSkills?.[peerId] || "Service Chat";
          let name = data.participantNames?.[peerId] || "Student Partner";
          let university = data.participantUniversities?.[peerId] || "Sri Lankan University";
          let avatar = "";
          let verificationLabel = "";
          const serviceContext = rawServiceContext;

          let peerRole = resolveChatRole(data.participantRoles?.[peerId]);
          if (peerId) {
            try {
              const peerSnap = await getDoc(doc(db, "users", peerId));
              if (peerSnap.exists()) {
                const peerData = peerSnap.data();
                if (typeof peerData.name === "string" && peerData.name.trim()) {
                  name = peerData.name;
                }
                if (typeof peerData.university === "string" && peerData.university.trim()) {
                  university = peerData.university;
                }
                if (typeof peerData.profileImageUrl === "string") {
                  avatar = peerData.profileImageUrl;
                }
                peerRole = resolveChatRole(peerData.role);
                verificationLabel = resolveVerificationLabel(
                  peerRole,
                  Boolean(peerData.verifiedStudentProvider),
                );
              }
            } catch (error) {
              console.error("Error loading peer details for chat:", error);
            }
          }

          let updatedAtMs = 0;
          let timeStr = "Recently";
          if (data.updatedAt) {
            const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            updatedAtMs = date.getTime();
            timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }

          return {
            id: chatDoc.id,
            name,
            skill,
            university,
            avatar,
            verificationLabel,
            lastMessage: data.lastMessage || "",
            time: timeStr,
            peerId,
            peerRole,
            serviceContext,
            updatedAtMs,
          };
        })
      );

      list.sort((left, right) => right.updatedAtMs - left.updatedAtMs);

      setConversations(
        list.map((conversation) => ({
          id: conversation.id,
          name: conversation.name,
          skill: conversation.skill,
          university: conversation.university,
          avatar: conversation.avatar,
          verificationLabel: conversation.verificationLabel,
          lastMessage: conversation.lastMessage,
          time: conversation.time,
          peerId: conversation.peerId,
          peerRole: conversation.peerRole,
          serviceContext: conversation.serviceContext,
          updatedAtMs: conversation.updatedAtMs,
        }))
      );
      setLoading(false);

      if (list.length === 0) {
        return;
      }

      if (chatIdParam) {
        const requestedConversation = list.find((conversation) => conversation.id === chatIdParam);
        if (requestedConversation) {
          setActiveId(requestedConversation.id);
          return;
        }
      }

      if (!activeId && !isMobileViewport) {
        setActiveId(list[0].id);
      }
    });

    return () => unsubscribe();
  }, [userProfile, activeId, chatIdParam, isMobileViewport]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === currentChatId) || null;

  const peerSummaries = useMemo(() => {
    const grouped = new Map<string, PeerInboxSummary>();

    conversations.forEach((conversation) => {
      const existing = grouped.get(conversation.peerId);

      if (!existing) {
        grouped.set(conversation.peerId, {
          peerId: conversation.peerId,
          name: conversation.name,
          university: conversation.university,
          avatar: conversation.avatar,
          verificationLabel: conversation.verificationLabel,
          lastMessage: conversation.lastMessage,
          time: conversation.time,
          latestSkill: conversation.skill,
          latestConversationId: conversation.id,
          threadCount: 1,
          updatedAtMs: conversation.updatedAtMs,
          online: conversation.online,
          peerRole: conversation.peerRole,
        });
        return;
      }

      existing.threadCount += 1;

      if (conversation.updatedAtMs > existing.updatedAtMs) {
        grouped.set(conversation.peerId, {
          ...existing,
          name: conversation.name,
          university: conversation.university,
          avatar: conversation.avatar,
          verificationLabel: conversation.verificationLabel,
          lastMessage: conversation.lastMessage,
          time: conversation.time,
          latestSkill: conversation.skill,
          latestConversationId: conversation.id,
          updatedAtMs: conversation.updatedAtMs,
          online: conversation.online,
          peerRole: conversation.peerRole,
          threadCount: existing.threadCount,
        });
      }
    });

    return Array.from(grouped.values()).sort((left, right) => right.updatedAtMs - left.updatedAtMs);
  }, [conversations]);

  const activePeerId = activeConversation?.peerId || peerSummaries[0]?.peerId || null;

  const peerThreads = useMemo(() => {
    if (!activePeerId) {
      return [];
    }

    return conversations
      .filter((conversation) => conversation.peerId === activePeerId)
      .sort((left, right) => right.updatedAtMs - left.updatedAtMs);
  }, [activePeerId, conversations]);

  // Switching conversations also switches this message listener.
  useEffect(() => {
    if (!currentChatId) return;

    const messagesQuery = query(
      collection(db, `chats/${currentChatId}/messages`),
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
          senderName:
            typeof data.senderName === "string" && data.senderName.trim()
              ? data.senderName
              : data.senderId === userProfile?.uid
                ? userProfile?.name || "You"
                : activeConversation?.name || "Student Partner",
          senderRole: resolveChatRole(
            data.senderRole ?? (data.senderId === userProfile?.uid ? userProfile?.role : activeConversation?.peerRole)
          ),
          serviceContext: isServiceContext(data.serviceContext) ? data.serviceContext : undefined,
          attachments: Array.isArray(data.attachments)
            ? data.attachments.filter(isValidAttachment)
            : [],
        });
      });
      setMessages(list);
    });

    return () => unsubscribe();
  }, [currentChatId, userProfile, activeConversation?.name, activeConversation?.peerRole]);

  // Save the message first, then update the chat preview shown in both inboxes.
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draftMessage.trim();
    if ((!text && selectedFiles.length === 0) || !currentChatId || !userProfile || isSending) return;

    try {
      setIsSending(true);
      setComposerError(null);

      const attachments = await Promise.all(
        selectedFiles.map(async (file) => {
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const storageRef = ref(
            storage,
            `chat-attachments/${currentChatId}/${Date.now()}-${safeFileName}`
          );
          await uploadBytes(storageRef, file, { contentType: file.type });
          const url = await getDownloadURL(storageRef);
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            url,
          };
        })
      );

      await addDoc(collection(db, `chats/${currentChatId}/messages`), {
        senderId: userProfile.uid,
        senderName: userProfile.name || "You",
        senderRole: resolveChatRole(userProfile.role),
        text,
        attachments,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", currentChatId), {
        lastMessage:
          text || (attachments.length === 1 ? `Sent ${attachments[0].name}` : `Sent ${attachments.length} files`),
        updatedAt: serverTimestamp(),
      });

      const peerConversation = conversations.find((c) => c.id === currentChatId);
      if (peerConversation && peerConversation.peerId !== userProfile.uid) {
        await createNotification({
          userId: peerConversation.peerId,
          title: `New Message from ${userProfile.name}`,
          description: text.length > 60 ? `${text.slice(0, 57)}...` : text,
          type: "message",
          icon: "✉",
          tone: "emerald",
        });
      }

      setDraftMessage("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("Error sending message:", err);
      setComposerError("Could not send the message right now. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredPeers = useMemo(() => {
    const queryTerm = searchTerm.trim().toLowerCase();
    if (!queryTerm) return peerSummaries;

    return peerSummaries.filter((peer) =>
      [peer.name, peer.latestSkill, peer.lastMessage, formatRoleLabel(peer.peerRole)].some(
        (val) => val.toLowerCase().includes(queryTerm)
      )
    );
  }, [searchTerm, peerSummaries]);

  const selectConversation = (conversationId: string) => {
    setActiveId(conversationId);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("chatId", conversationId);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  const selectPeer = (peer: PeerInboxSummary) => {
    const existingActiveThread = conversations.find(
      (conversation) => conversation.peerId === peer.peerId && conversation.id === currentChatId,
    );
    const nextThread = existingActiveThread || conversations.find(
      (conversation) => conversation.id === peer.latestConversationId,
    );

    if (nextThread) {
      selectConversation(nextThread.id);
    }
  };

  const clearActiveConversation = () => {
    setActiveId(null);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("chatId");
    nextParams.delete("peerId");
    nextParams.delete("subject");
    nextParams.delete("gigId");
    nextParams.delete("category");
    nextParams.delete("price");
    nextParams.delete("providerName");
    router.replace(
      nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
      { scroll: false },
    );
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const nextFiles = Array.from(event.target.files);
    const invalidFile = nextFiles.find(
      (file) => !ALLOWED_ATTACHMENT_TYPES.has(file.type) || file.size > MAX_ATTACHMENT_BYTES
    );

    if (invalidFile) {
      setComposerError("Only images, PDF, TXT, DOC, or DOCX files up to 2MB are allowed.");
      event.target.value = "";
      return;
    }

    setSelectedFiles((current) => {
      const uniqueFiles = new Map<string, File>();
      [...current, ...nextFiles].forEach((file) => {
        uniqueFiles.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      });
      return Array.from(uniqueFiles.values()).slice(0, 5);
    });
    setComposerError(null);
    event.target.value = "";
  };

  const removeSelectedFile = (fileKey: string) => {
    setSelectedFiles((current) =>
      current.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== fileKey)
    );
  };

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
    <section className="flex min-h-[calc(100dvh-13rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-12rem)] lg:min-h-[560px] lg:max-h-[calc(100dvh-12rem)]">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(220px,260px)]">
        {/* Peer search and inbox */}
        <aside
          className={`${activeConversation ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r`}
        >
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-950">Messages</h1>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Chat with your skill-swap peers
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#0f4cbf]">
                {peerSummaries.length} {peerSummaries.length === 1 ? "person" : "people"}
              </span>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Search chats</span>
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search chats..."
                className="h-11 w-full rounded-full border border-transparent bg-slate-100 pl-11 pr-4 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="scrollbar-none min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
            {filteredPeers.length > 0 ? (
              filteredPeers.map((peer) => (
                <PeerConversationButton
                  key={peer.peerId}
                  peer={peer}
                  active={peer.peerId === activePeerId}
                  onClick={() => selectPeer(peer)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No people found.
              </div>
            )}
          </div>
        </aside>

        {/* Active conversation and message composer */}
        {activeConversation ? (
          <div className="flex min-h-0 flex-col bg-[#eef2ff]">
            <ChatHeader
              conversation={activeConversation}
              role={role}
              onBack={clearActiveConversation}
            />

            <MobileThreadRail
              activeConversationId={currentChatId}
              threads={peerThreads}
              onSelectConversation={selectConversation}
            />

            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                    />
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-400 pt-8">
                    Send a message to start the conversation!
                  </div>
                )}
              </div>
            </div>

            <Composer
              value={draftMessage}
              onChange={setDraftMessage}
              onSubmit={handleSendMessage}
              onFilePick={() => fileInputRef.current?.click()}
              onFileChange={handleFileSelection}
              selectedFiles={selectedFiles}
              onRemoveSelectedFile={removeSelectedFile}
              error={composerError}
              sending={isSending}
              fileInputRef={fileInputRef}
            />
          </div>
        ) : (
          <div className="hidden min-h-0 flex-col items-center justify-center bg-[#eef2ff] p-8 text-center lg:flex">
            <div className="rounded-full bg-blue-100 p-4 text-[#2f66e7]">
              <SendIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-800">Your Inbox</h2>
            <p className="mt-1 max-w-sm text-[13px] text-slate-500">
              Select a conversation from the sidebar or request a skill swap to message other members.
            </p>
          </div>
        )}

        {activeConversation ? (
          <ServiceThreadsPanel
            activeConversationId={currentChatId}
            peerName={activeConversation.name}
            threads={peerThreads}
            onSelectConversation={selectConversation}
          />
        ) : null}
      </div>
    </section>
  );
}

function MobileThreadRail({
  activeConversationId,
  threads,
  onSelectConversation,
}: {
  activeConversationId: string | null;
  threads: Conversation[];
  onSelectConversation: (conversationId: string) => void;
}) {
  if (threads.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-blue-100 bg-white/70 px-4 py-3 lg:hidden">
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectConversation(thread.id)}
            className={`min-w-0 shrink-0 rounded-full border px-3 py-2 text-left transition ${
              thread.id === activeConversationId
                ? "border-blue-200 bg-blue-50 text-[#1453c4]"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <p className="max-w-[220px] truncate text-xs font-semibold">
              {thread.serviceContext?.title || thread.skill || "General chat"}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              {formatThreadTypeLabel(thread)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceThreadsPanel({
  activeConversationId,
  peerName,
  threads,
  onSelectConversation,
}: {
  activeConversationId: string | null;
  peerName: string;
  threads: Conversation[];
  onSelectConversation: (conversationId: string) => void;
}) {
  return (
    <aside className="hidden min-h-0 flex-col border-t border-slate-200 bg-white p-5 lg:flex lg:border-l lg:border-t-0">
      <h2 className="shrink-0 text-[13px] font-bold text-slate-900">Requested Gigs</h2>

      <div className="scrollbar-none mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectConversation(thread.id)}
            className={`w-full rounded-xl border p-4 text-left transition ${
              thread.id === activeConversationId
                ? "border-blue-200 bg-blue-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <p className="truncate text-[13px] font-bold text-slate-900">
              {thread.serviceContext?.title || thread.skill || "General chat"}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-[#1453c4]">
              {formatThreadTypeLabel(thread)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="truncate text-[11px] text-slate-500">
                {thread.lastMessage || "Open this thread"}
              </p>
              <span className="shrink-0 text-[10px] font-medium text-slate-400">
                {thread.time}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function PeerConversationButton({
  peer,
  active,
  onClick,
}: {
  peer: PeerInboxSummary;
  active: boolean;
  onClick: () => void;
}) {
  const initials = peer.name
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
        {peer.avatar ? (
          <img
            src={peer.avatar}
            alt={peer.name}
            className="h-11 w-11 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
        )}
        {peer.online ? (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-slate-900">
              {peer.name}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-[#2f66e7]">
              {peer.latestSkill}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {peer.time}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-[13px] text-slate-500">
            {peer.lastMessage}
          </p>
          {peer.threadCount > 1 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2f66e7] px-1.5 text-[11px] font-bold text-white">
              {peer.threadCount}
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
  onBack,
}: {
  conversation: Conversation;
  role: Role;
  onBack: () => void;
}) {
  const peerProfileHref =
    conversation.peerRole === "buyer"
      ? `/buyer-profile/${conversation.peerId}?role=${role}`
      : `/provider-profile/${conversation.peerId}?role=${role}`;
  const reportPeerHref = `/report-issue/${role}/${conversation.peerId}`;
  const initials = conversation.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="border-b border-blue-200 bg-[#eef2ff] px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to chats"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="relative shrink-0">
            {conversation.avatar ? (
              <img
                src={conversation.avatar}
                alt={conversation.name}
                className="h-12 w-12 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-md">
                {initials}
              </div>
            )}
            {conversation.online ? (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#eef2ff] bg-emerald-500" />
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-slate-950">
                {conversation.name}
              </h2>
              {(() => {
                const verificationBadge = conversation.verificationLabel
                  ? getVerificationBadge(
                      conversation.peerRole,
                      conversation.verificationLabel === "Verified Student",
                    )
                  : null;

                return verificationBadge ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm ${verificationBadge.className}`}>
                    <VerifiedIcon className={`h-3.5 w-3.5 shrink-0 ${verificationBadge.iconClassName}`} />
                    {verificationBadge.label}
                  </span>
                ) : null;
              })()}
            </div>
            <p className="mt-1 max-w-full truncate text-[13px] font-medium text-slate-500">
              {conversation.university} | {conversation.serviceContext?.title || conversation.skill}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
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
}: {
  message: ChatMessage;
}) {
  const isMine = message.sender === "me";
  const normalizedMessageText = normalizeServiceMessageText(message);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(100%,42rem)] rounded-[18px] px-3.5 py-2.5 sm:max-w-[min(620px,82%)] ${
          isMine
            ? "rounded-br-[6px] bg-[#2f66e7] text-white"
            : "rounded-bl-[6px] bg-white text-slate-900"
        }`}
      >
        {message.serviceContext ? (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              isMine
                ? "border-white/20 bg-white/10 text-white"
                : "border-blue-100 bg-blue-50 text-slate-700"
            }`}
          >
            <p className="font-bold">{message.serviceContext.title || "Gig"}</p>
            <p className={isMine ? "text-blue-100" : "text-slate-500"}>
              {message.serviceContext.category || "General"}
            </p>
            <p className={isMine ? "mt-1 text-blue-100" : "mt-1 text-slate-500"}>
              {formatChatPrice(message.serviceContext.price)}
            </p>
          </div>
        ) : null}
        {normalizedMessageText ? (
          <p className={`${message.serviceContext ? "mt-2.5" : ""} whitespace-pre-line text-[13px] leading-5`}>
            {normalizedMessageText}
          </p>
        ) : null}
        {message.attachments.length > 0 ? (
          <div className={`${normalizedMessageText || message.serviceContext ? "mt-2.5" : ""} space-y-2`}>
            {message.attachments.map((attachment) => (
              <a
                key={attachment.url}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                  isMine
                    ? "border-white/20 bg-white/10 hover:bg-white/15"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-[13px] font-semibold ${isMine ? "text-white" : "text-slate-800"}`}>
                    {attachment.name}
                  </p>
                  <p className={`text-[11px] ${isMine ? "text-blue-100" : "text-slate-500"}`}>
                    {formatFileKind(attachment.type)} • {formatBytes(attachment.size)}
                  </p>
                </div>
                <ExternalLinkIcon className={`h-4 w-4 shrink-0 ${isMine ? "text-white" : "text-slate-500"}`} />
              </a>
            ))}
          </div>
        ) : null}
        <div className="mt-1.5 flex justify-end">
          <span className={`text-[11px] leading-none ${isMine ? "text-blue-100/90" : "text-slate-400"}`}>
            {message.time}
          </span>
        </div>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  onFilePick,
  onFileChange,
  selectedFiles,
  onRemoveSelectedFile,
  error,
  sending,
  fileInputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFilePick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedFiles: File[];
  onRemoveSelectedFile: (fileKey: string) => void;
  error: string | null;
  sending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white/85 p-3 sm:p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.doc,.docx"
        multiple
        onChange={onFileChange}
        className="hidden"
      />
      {selectedFiles.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file) => {
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            return (
              <div
                key={fileKey}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
              >
                <span className="truncate max-w-52 font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSelectedFile(fileKey)}
                  className="text-slate-400 transition hover:text-slate-700"
                  aria-label={`Remove ${file.name}`}
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      <div className="flex items-end gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Attach file"
          onClick={onFilePick}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <PaperclipIcon className="h-5 w-5" />
        </button>

        <label className="sr-only" htmlFor="chat-message">
          Type your message
        </label>
        <textarea
          id="chat-message"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your message..."
          rows={1}
          className="max-h-28 min-h-[48px] min-w-0 flex-1 resize-none rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f66e7] focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="submit"
          aria-label="Send message"
          disabled={sending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2f66e7] text-white shadow-sm transition hover:bg-[#2455c8]"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
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

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M14 5h5v5" />
      <path d="M10 14 19 5" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function resolveChatRole(value: unknown): Role {
  return value === "provider" || value === "both" ? value : "buyer";
}

function formatRoleLabel(role: Role) {
  return getRoleBadge(role).label;
}

function resolveVerificationLabel(role: Role, verifiedStudentProvider: boolean) {
  return getVerificationBadge(role, verifiedStudentProvider)?.label || "";
}

function isValidAttachment(value: unknown): value is ChatAttachment {
  if (!value || typeof value !== "object") return false;
  const attachment = value as Record<string, unknown>;
  return (
    typeof attachment.name === "string" &&
    typeof attachment.size === "number" &&
    typeof attachment.type === "string" &&
    typeof attachment.url === "string"
  );
}

function isServiceContext(value: unknown): value is ServiceContext {
  if (!value || typeof value !== "object") return false;
  const context = value as Record<string, unknown>;
  return (
    (context.title === undefined || typeof context.title === "string") &&
    (context.category === undefined || typeof context.category === "string") &&
    (context.gigId === undefined || typeof context.gigId === "string")
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileKind(type: string) {
  if (type.startsWith("image/")) return "Image";
  if (type === "application/pdf") return "PDF";
  if (type.includes("word")) return "DOC";
  if (type === "text/plain") return "TXT";
  return "File";
}

function normalizeServiceMessageText(message: ChatMessage) {
  const trimmed = message.text.trim();
  if (!trimmed) return "";

  if (
    message.serviceContext &&
    /^Gig:\s/i.test(trimmed) &&
    /Category:\s/i.test(trimmed)
  ) {
    return "Can you tell me more about this gig?";
  }

  return trimmed;
}

function formatThreadTypeLabel(thread: Conversation) {
  if (!thread.serviceContext?.gigId) {
    return "General Request";
  }

  const category = thread.serviceContext.category?.trim();
  if (category && category.toLowerCase() !== "general") {
    return `Direct Request • ${category}`;
  }

  return "Gig Chat";
}

function formatChatPrice(price?: number | string) {
  if (typeof price === "number") {
    return price > 0 ? `LKR ${price.toLocaleString()}` : "Price on chat";
  }

  if (typeof price === "string") {
    const trimmed = price.trim();
    if (!trimmed) return "Price on chat";
    const numeric = Number(trimmed.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) && numeric > 0
      ? `LKR ${numeric.toLocaleString()}`
      : trimmed;
  }

  return "Price on chat";
}

function slugSegment(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "service"
  );
}
