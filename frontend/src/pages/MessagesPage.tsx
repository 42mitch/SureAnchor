import { useEffect, useState } from 'react';
import { Mail, CheckCircle, RotateCcw, ExternalLink, Filter, Inbox } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

interface ContactMessage {
  contactMessageId: number;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt: string | null;
}

type Filter = 'all' | 'unresolved' | 'resolved';

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>('unresolved');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);

  function loadMessages(f: Filter) {
    setLoading(true);
    const query = f === 'all' ? '' : `?resolved=${f === 'resolved'}`;
    apiFetch(`/api/contact-messages${query}`)
      .then(r => r.ok ? r.json() : [])
      .then(setMessages)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadMessages(filter); }, [filter]);

  async function handleResolve(id: number) {
    setActioning(id);
    await apiFetch(`/api/contact-messages/${id}/resolve`, { method: 'PATCH' });
    setMessages(prev => prev.map(m =>
      m.contactMessageId === id ? { ...m, isResolved: true, resolvedAt: new Date().toISOString() } : m
    ));
    if (filter === 'unresolved') setMessages(prev => prev.filter(m => m.contactMessageId !== id));
    setActioning(null);
  }

  async function handleUnresolve(id: number) {
    setActioning(id);
    await apiFetch(`/api/contact-messages/${id}/unresolve`, { method: 'PATCH' });
    setMessages(prev => prev.map(m =>
      m.contactMessageId === id ? { ...m, isResolved: false, resolvedAt: null } : m
    ));
    if (filter === 'resolved') setMessages(prev => prev.filter(m => m.contactMessageId !== id));
    setActioning(null);
  }

  const pag = useListPagination(messages, [messages.length, filter]);
  const unresolvedCount = messages.filter(m => !m.isResolved).length;

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Messages</h1>
            <p className="text-dark/50 text-sm mt-1">Contact form submissions from the public site</p>
          </div>
          <a
            href="https://mail.google.com/mail/u/0/#inbox"
            target="_blank" rel="noopener noreferrer"
            className="btn-primary text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <ExternalLink size={15} />
            Open Gmail Inbox
          </a>
        </div>

        {/* Filter tabs */}
        <div className="card py-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-dark/30" />
            {(['unresolved', 'all', 'resolved'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  filter === f
                    ? 'bg-navy text-white'
                    : 'text-dark/50 hover:bg-dark/6 hover:text-dark'
                }`}>
                {f}
                {f === 'unresolved' && filter !== 'resolved' && unresolvedCount > 0 && (
                  <span className="ml-1.5 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {unresolvedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Messages list */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox size={40} className="text-dark/20 mx-auto mb-3" />
              <p className="text-dark/40 text-sm">
                {filter === 'unresolved' ? 'No unresolved messages.' : 'No messages found.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-dark/5">
                {pag.pageItems.map(msg => (
                  <div key={msg.contactMessageId}
                    className={`p-5 transition-colors ${msg.isResolved ? 'bg-dark/2' : 'bg-white'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          msg.isResolved ? 'bg-green-100' : 'bg-teal/10'
                        }`}>
                          {msg.isResolved
                            ? <CheckCircle size={16} className="text-green-600" />
                            : <Mail size={16} className="text-teal" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-navy">{msg.name}</span>
                            {msg.topic && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-navy/8 text-navy">
                                {msg.topic}
                              </span>
                            )}
                            {msg.isResolved && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Resolved
                              </span>
                            )}
                          </div>
                          <a href={`mailto:${msg.email}`}
                            className="text-xs text-teal hover:underline">{msg.email}</a>
                          <p className="text-xs text-dark/40 mt-0.5">{msg.createdAt}</p>

                          {/* Message preview / expanded */}
                          <div className="mt-2">
                            {expanded === msg.contactMessageId ? (
                              <>
                                <p className="text-sm text-dark/70 leading-relaxed whitespace-pre-wrap">
                                  {msg.message}
                                </p>
                                <button onClick={() => setExpanded(null)}
                                  className="text-xs text-teal mt-1 hover:underline">
                                  Show less
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-dark/60 line-clamp-2">{msg.message}</p>
                                {msg.message.length > 120 && (
                                  <button onClick={() => setExpanded(msg.contactMessageId)}
                                    className="text-xs text-teal mt-1 hover:underline">
                                    Read more
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <a href={`mailto:${msg.email}?subject=Re: Your SureAnchor message`}
                          className="px-3 py-1.5 rounded-lg border border-teal/30 text-teal text-xs font-semibold hover:bg-teal/6 transition-colors flex items-center gap-1.5">
                          <Mail size={12} /> Reply
                        </a>
                        {msg.isResolved ? (
                          <button onClick={() => handleUnresolve(msg.contactMessageId)}
                            disabled={actioning === msg.contactMessageId}
                            className="px-3 py-1.5 rounded-lg border border-dark/15 text-dark/50 text-xs font-semibold hover:bg-dark/5 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                            <RotateCcw size={12} /> Unresolve
                          </button>
                        ) : (
                          <button onClick={() => handleResolve(msg.contactMessageId)}
                            disabled={actioning === msg.contactMessageId}
                            className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                            <CheckCircle size={12} /> Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ListPaginationBar
                page={pag.page} pageCount={pag.pageCount} pageSize={pag.pageSize}
                setPage={pag.setPage} setPageSize={pag.setPageSize}
                total={pag.total} startIndex={pag.startIndex} endIndex={pag.endIndex}
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}