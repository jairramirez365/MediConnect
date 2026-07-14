import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircleMore, Plus, Search, SendHorizonal, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const EASE = [0.16, 1, 0.3, 1] as const;

const messageRoleLabels: Record<string, string> = {
  medico: 'Médico',
  paciente: 'Paciente',
  comisionista: 'Gestor',
  administrador: 'Administrador',
  sistema: 'Sistema'
};

export function ChatCenter() {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationDetail, setConversationDetail] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function loadConversations() {
    setLoading(true);
    setError('');
    try {
      const response = await api.chatConversations({ search });
      setConversations(response.data || []);
      const preferredId = selectedConversationId && response.data?.some((conversation: any) => conversation.id === selectedConversationId)
        ? selectedConversationId
        : response.data?.[0]?.id || null;
      setSelectedConversationId(preferredId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las conversaciones.');
    } finally {
      setLoading(false);
    }
  }

  async function loadContacts() {
    try {
      const response = await api.chatContacts({ search: contactSearch });
      setContacts(response.data || []);
    } catch {
      setContacts([]);
    }
  }

  async function loadConversationDetail(conversationId: string) {
    try {
      const response = await api.chatConversationById(conversationId);
      setConversationDetail(response.data || null);
      await api.markChatRead(conversationId).catch(() => null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible abrir la conversación.');
    }
  }

  useEffect(() => {
    loadConversations();
  }, [search]);

  useEffect(() => {
    loadContacts();
  }, [contactSearch]);

  useEffect(() => {
    if (!selectedConversationId) {
      setConversationDetail(null);
      return;
    }

    loadConversationDetail(selectedConversationId);
    const interval = window.setInterval(() => loadConversationDetail(selectedConversationId), 12000);
    return () => window.clearInterval(interval);
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || conversationDetail,
    [conversations, selectedConversationId, conversationDetail]
  );

  async function handleOpenConversation(counterpartUserId: string) {
    setError('');
    try {
      const response = await api.openChatConversation({
        counterpartUserId,
        subject: 'Conversación operativa MediConnect'
      });
      await loadConversations();
      setSelectedConversationId(response.data.id);
      setConversationDetail(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar la conversación.');
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || !newMessage.trim()) {
      return;
    }

    setSending(true);
    setError('');

    try {
      await api.sendChatMessage(selectedConversationId, { content: newMessage.trim() });
      setNewMessage('');
      await loadConversationDetail(selectedConversationId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,_#0f766e_0%,_#0891b2_45%,_#2563eb_100%)] p-7 text-center text-white shadow-[0_30px_90px_rgba(8,145,178,0.28)] md:p-9"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <MessageCircleMore className="h-4 w-4" />
            Chat operativo
          </span>
          <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black tracking-[-0.04em] md:text-4xl">Conversaciones Seguras entre Roles</h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-cyan-50 md:text-base">
            Centraliza soporte de citas, pagos, agenda y coordinación operativa entre paciente, médico, gestor y administración con trazabilidad completa.
          </p>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar conversaciones"
                className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 px-6 py-12 text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando conversaciones...
                </div>
              ) : conversations.length === 0 ? (
                <PanelEmpty
                  title="Aún no hay conversaciones"
                  description="Cuando abras un hilo con un contacto permitido, aparecerá aquí con su historial."
                />
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedConversationId === conversation.id ? 'border-blue-500 bg-blue-50/70' : 'border-slate-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{conversation.subject || 'Conversación MediConnect'}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{conversation.type}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          {conversation.participants?.map((participant: any) => participant.displayName).join(' · ')}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Iniciar Nueva Conversación</h2>
                <p className="mt-1 text-sm text-slate-600">Solo verás contactos permitidos por tus reglas de alcance.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white shadow-md shadow-cyan-600/20">
                <Plus className="h-5 w-5" />
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
                placeholder="Buscar contactos"
                className="w-full rounded-2xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-4 space-y-3">
              {contacts.length === 0 ? (
                <PanelEmpty
                  title="Sin contactos disponibles"
                  description="A medida que se creen vinculaciones reales entre pacientes, médicos y gestores, aparecerán aquí."
                  compact
                />
              ) : (
                contacts.map((contact) => (
                  <div key={contact.userId} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-3 text-white shadow-md shadow-cyan-600/20">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{contact.displayName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{contact.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenConversation(contact.userId)}
                      className="inline-flex min-h-[44px] items-center rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                    >
                      Abrir chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          {selectedConversation ? (
            <div className="flex h-full min-h-[640px] flex-col">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">{String(selectedConversation.type || '').replaceAll('_', ' ')}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">{String(selectedConversation.status || '').replaceAll('_', ' ')}</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">{selectedConversation.subject || 'Conversación Operativa'}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedConversation.participants?.map((participant: any) => participant.displayName).join(' · ')}
                </p>
              </div>

              <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-2">
                {(conversationDetail?.messages || []).map((message: any) => {
                  const isSystem = message.type === 'sistema' || message.role === 'sistema';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center py-1">
                        <div className="max-w-[90%] rounded-full bg-slate-100 px-4 py-1.5 text-center text-xs font-medium text-slate-500">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  const isMine = Boolean(user?.email) && message.email === user?.email;

                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMine && (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white shadow-sm">
                            {(message.role || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className={`mb-1 text-xs font-semibold ${isMine ? 'text-right text-cyan-700' : 'text-left text-slate-600'}`}>
                            {isMine ? 'Tú' : messageRoleLabels[message.role] || message.role}
                          </p>
                          <div
                            className={`rounded-3xl px-4 py-3 ${
                              isMine
                                ? 'rounded-br-md bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                                : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm'
                            }`}
                          >
                            <p className="break-words text-sm leading-6">{message.content}</p>
                            <p className={`mt-2 text-[11px] ${isMine ? 'text-cyan-50/80' : 'text-slate-400'}`}>
                              {new Date(message.createdAt).toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="mt-5 border-t border-slate-100 pt-4">
                {error && <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Escribe un mensaje claro y profesional..."
                    className="min-h-[110px] w-full min-w-0 flex-1 rounded-3xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    disabled={sending}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:opacity-70 sm:w-auto sm:min-w-36"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <PanelEmpty
              title="Selecciona una conversación"
              description="Elige un hilo existente o abre uno nuevo con un contacto permitido para empezar a coordinar citas, pagos o soporte operativo."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function PanelEmpty({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={`rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center ${compact ? 'px-5 py-8' : 'px-6 py-12'}`}>
      <MessageCircleMore className="mx-auto h-10 w-10 text-slate-400" />
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
