import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircleMore, Plus, Search, SendHorizonal, UserRound } from 'lucide-react';
import { api } from '../../services/api';

export function ChatCenter() {
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
      setError(err instanceof Error ? err.message : 'No fue posible abrir la conversacion.');
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
        subject: 'Conversacion operativa MediConnect'
      });
      await loadConversations();
      setSelectedConversationId(response.data.id);
      setConversationDetail(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar la conversacion.');
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
      <section className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(37,99,235,0.08)]">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Chat operativo
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Conversaciones seguras entre roles</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Centraliza soporte de citas, pagos, agenda y coordinacion operativa entre paciente, medico, gestor y administracion con trazabilidad completa.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
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
                  title="Aun no hay conversaciones"
                  description="Cuando abras un hilo con un contacto permitido, aparecera aqui con su historial."
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
                        <p className="text-sm font-semibold text-slate-900">{conversation.subject || 'Conversacion MediConnect'}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{conversation.type}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          {conversation.participants?.map((participant: any) => participant.displayName).join(' · ')}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
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
                <h2 className="text-lg font-bold text-slate-900">Iniciar nueva conversacion</h2>
                <p className="mt-1 text-sm text-slate-600">Solo veras contactos permitidos por tus reglas de alcance.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
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
                  description="A medida que se creen vinculaciones reales entre pacientes, medicos y gestores, apareceran aqui."
                  compact
                />
              ) : (
                contacts.map((contact) => (
                  <div key={contact.userId} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{contact.displayName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{contact.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenConversation(contact.userId)}
                      className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      Abrir chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          {selectedConversation ? (
            <div className="flex h-full min-h-[640px] flex-col">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{selectedConversation.type}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{selectedConversation.status}</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">{selectedConversation.subject || 'Conversacion operativa'}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedConversation.participants?.map((participant: any) => participant.displayName).join(' · ')}
                </p>
              </div>

              <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-2">
                {(conversationDetail?.messages || []).map((message: any) => (
                  <div key={message.id} className={`max-w-[85%] rounded-3xl px-4 py-3 ${message.type === 'sistema' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-slate-800'}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {message.role} · {message.email}
                    </p>
                    <p className="mt-2 text-sm leading-6">{message.content}</p>
                    <p className="mt-3 text-[11px] text-slate-500">{new Date(message.createdAt).toLocaleString('es-CO')}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="mt-5 border-t border-slate-100 pt-4">
                {error && <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Escribe un mensaje claro y profesional..."
                    className="min-h-[110px] flex-1 rounded-3xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    disabled={sending}
                    className="inline-flex min-w-36 items-center justify-center gap-2 self-end rounded-3xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <PanelEmpty
              title="Selecciona una conversacion"
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
