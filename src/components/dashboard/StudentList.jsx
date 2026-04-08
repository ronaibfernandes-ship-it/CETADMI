import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Clock,
  ArrowRight,
  X
} from 'lucide-react'
import { eventService } from '../../services/eventService'
import { useAuth } from '../../contexts/AuthContext'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

class StudentListErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Falha inesperada ao renderizar a lista de inscritos.',
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm font-semibold text-red-700">
          {this.state.message}
        </div>
      )
    }

    return this.props.children
  }
}

const StatusBadge = ({ status }) => {
  const configs = {
    paid: { label: 'PAGO', classes: 'bg-green-100 text-green-800 border-green-800' },
    pending_payment: { label: 'PENDENTE', classes: 'bg-amber-100 text-amber-800 border-amber-800' },
    cancelled: { label: 'CANCELADO', classes: 'bg-cetadmi-red/10 text-cetadmi-red border-cetadmi-red' },
    expired: { label: 'EXPIRADO', classes: 'bg-gray-100 text-gray-800 border-gray-800' }
  }

  const config = configs[status] || { label: status, classes: 'bg-gray-200 border-gray-500' }

  return (
    <span className={cn("text-[10px] font-black px-2 py-0.5 brutalist-border", config.classes)}>
      {config.label}
    </span>
  )
}

const StudentList = ({ event, onBack }) => {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pendingAction, setPendingAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const data = await eventService.getRegistrationsByEvent(event.id)
      setRegistrations(data)
      setError(null)
    } catch (err) {
      setError('Erro ao carregar lista de inscritos.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(showToast.timeoutId)
    showToast.timeoutId = window.setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (event.id) fetchRegistrations()
  }, [event.id])

  const handleAction = async () => {
    if (!pendingAction) return

    try {
      setActionLoading(true)

      if (pendingAction.action === 'confirmar') {
        await eventService.confirmRegistrationPayment(pendingAction.id, user.id)
      } else if (pendingAction.action === 'cancelar') {
        await eventService.cancelRegistration(pendingAction.id)
      } else if (pendingAction.action === 'expirar') {
        await eventService.expireRegistration(pendingAction.id)
      }

      setPendingAction(null)
      showToast(`Inscricao ${pendingAction.action === 'confirmar' ? 'confirmada' : pendingAction.action === 'cancelar' ? 'cancelada' : 'expirada'} com sucesso.`)
      fetchRegistrations()
    } catch (err) {
      setError(eventService.mapRegistrationError(err) || `Falha ao ${pendingAction.action} inscricao.`)
    } finally {
      setActionLoading(false)
    }
  }

  const openActionModal = (registration, action) => {
    setPendingAction({
      id: registration.id,
      action,
      name: registration.full_name,
    })
  }

  const handleExport = () => {
    eventService.exportRegistrationsToCSV(registrations, event.title)
  }

  const normalizeRegistration = (registration) => ({
    ...registration,
    id: registration.id || `temp-${registration.email || registration.phone || Math.random().toString(36).slice(2)}`,
    full_name: registration.full_name || 'Inscrito sem nome',
    email: registration.email || '',
    phone: registration.phone || '',
    church_name: registration.church_name || '',
    city: registration.city || '',
    state: registration.state || '',
    selected_price_label: registration.selected_price_label || 'Categoria nao informada',
    amount_due: Number(registration.amount_due || 0),
    amount_paid: Number(registration.amount_paid || 0),
    status: registration.status || 'pending_payment',
  })

  const normalizedRegistrations = registrations.map(normalizeRegistration)

  const filteredRegistrations = normalizedRegistrations.filter(r => {
    const matchesSearch = r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Contadores
  const stats = {
    total: normalizedRegistrations.length,
    paid: normalizedRegistrations.filter(r => r.status === 'paid').length,
    pending: normalizedRegistrations.filter(r => r.status === 'pending_payment').length,
    others: normalizedRegistrations.filter(r => r.status === 'cancelled' || r.status === 'expired').length
  }

  if (!event?.id) {
    return (
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5 text-sm font-semibold text-amber-800">
        Nenhum evento valido foi selecionado para carregar os inscritos.
      </div>
    )
  }

  return (
    <StudentListErrorBoundary>
    <div className="space-y-8 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed right-6 top-6 z-[100] flex items-center gap-3 rounded-2xl bg-cetadmi-navy px-6 py-4 text-white shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-green-300" />
          <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header de Contexto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-cetadmi-navy/10">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 brutalist-border hover:bg-cetadmi-navy hover:text-cetadmi-cream transition-colors group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-serif font-black text-cetadmi-navy uppercase tracking-tight">Gestão de Inscritos</h2>
              <StatusBadge status={event.is_published ? 'paid' : 'cancelled'} />
            </div>
            <p className="text-cetadmi-navy/50 font-bold uppercase text-[10px] tracking-[0.2em] truncate max-w-md">
              Evento: {event.title}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px]">
          <button 
            onClick={handleExport}
            disabled={registrations.length === 0}
            className="brutalist-button px-6 py-3 flex items-center justify-center gap-3 text-xs bg-white text-cetadmi-navy hover:bg-cetadmi-cream disabled:opacity-30"
          >
            <Download className="w-4 h-4" />
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* Resumo de Status (Brutalista) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Matrículas Totais', val: stats.total, color: 'text-cetadmi-navy', bg: 'bg-white' },
          { label: 'Pagos / Confirmados', val: stats.paid, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Pendentes de PIX', val: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Cancelados / Exp.', val: stats.others, color: 'text-cetadmi-red', bg: 'bg-cetadmi-red/5' }
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 brutalist-border shadow-[4px_4px_0px_0px_currentColor]", stat.color, stat.bg)}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
            <p className="text-3xl font-serif font-black">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Toolbar de Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cetadmi-navy/30" />
          <input 
            type="text" 
            placeholder="BUSCAR POR NOME OU TELEFONE..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white brutalist-border p-4 pl-12 text-xs font-bold uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_0px_theme(colors.cetadmi.navy)]"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cetadmi-navy/50" />
             <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white brutalist-border p-4 pl-10 text-xs font-black uppercase appearance-none min-w-[200px] cursor-pointer focus:outline-none"
             >
                <option value="all">TODOS OS STATUS</option>
                <option value="paid">PAGOS</option>
                <option value="pending_payment">PENDENTES</option>
                <option value="cancelled">CANCELADOS</option>
                <option value="expired">EXPIRADOS</option>
             </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Tabela de Dados */}
      <div className="brutalist-border overflow-hidden bg-white shadow-[8px_8px_0px_0px_theme(colors.cetadmi.navy)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-cetadmi-navy text-cetadmi-cream text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="p-4 border-r border-cetadmi-cream/10">INSCRITO</th>
                <th className="p-4 border-r border-cetadmi-cream/10">ORIGEM / CONTATO</th>
                <th className="p-4 border-r border-cetadmi-cream/10">CATEGORIA</th>
                <th className="p-4 border-r border-cetadmi-cream/10">FINANCEIRO</th>
                <th className="p-4 border-r border-cetadmi-cream/10 text-center">STATUS</th>
                <th className="p-4 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-cetadmi-navy/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-cetadmi-navy/20" />
                  </td>
                </tr>
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center font-serif italic text-cetadmi-navy/40">
                    Nenhum inscrito encontrado para estes critérios.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-cetadmi-cream/30 transition-colors">
                    <td className="p-4 border-r border-cetadmi-navy/5 max-w-[250px]">
                      <div className="font-serif font-bold text-lg text-cetadmi-navy leading-tight line-clamp-2" title={reg.full_name}>
                        {reg.full_name}
                      </div>
                      <div className="text-[10px] font-bold text-cetadmi-navy/40 mt-1 uppercase tracking-widest truncate" title={reg.email}>
                        {reg.email || 'SEM E-MAIL'}
                      </div>
                       <div className="text-[10px] font-bold bg-cetadmi-navy/5 px-1 py-0.5 inline-block mt-2 italic">ID: {String(reg.id).slice(0, 8)}</div>
                    </td>
                    <td className="p-4 border-r border-cetadmi-navy/5 max-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-cetadmi-navy/70 uppercase">
                          <Phone className="w-3 h-3" /> {reg.phone}
                        </div>
                        <div className="text-[10px] font-black uppercase opacity-60 line-clamp-1" title={reg.church_name}>
                           {reg.church_name ? `${reg.church_name}` : 'AVULSO'}
                        </div>
                        <div className="text-[10px] italic opacity-40 truncate">
                           {reg.city} / {reg.state}
                        </div>
                        <div className="flex gap-2 mt-2">
                           <a 
                             href={`https://wa.me/${eventService.sanitizeWhatsAppNumber(reg.phone)}`} 
                             target="_blank" 
                             rel="noreferrer"
                             className="p-1 brutalist-border hover:bg-green-500 hover:text-white transition-colors"
                             title="Abrir WhatsApp"
                           >
                             <MessageSquare className="w-3 h-3" />
                           </a>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-cetadmi-navy/5 max-w-[150px]">
                      <div className="font-black text-xs uppercase tracking-wider line-clamp-1" title={reg.selected_price_label}>
                        {reg.selected_price_label}
                      </div>
                      <div className="text-[10px] opacity-40 uppercase font-bold mt-1">Snapshot Capturado</div>
                    </td>
                    <td className="p-4 border-r border-cetadmi-navy/5 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-40 uppercase font-black text-[9px]">Devido</span>
                          <span className="font-serif font-black text-cetadmi-blue">R$ {reg.amount_due.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-40 uppercase font-black text-[9px]">Pago</span>
                          <span className={cn("font-serif font-black", reg.status === 'paid' ? 'text-green-700' : 'text-cetadmi-red/30')}>
                            R$ {reg.amount_paid.toFixed(2)}
                          </span>
                        </div>
                        {reg.paid_at && (
                          <div className="text-[9px] font-bold text-green-700 uppercase tracking-tighter text-right">
                             CONF. EM {new Date(reg.paid_at).toLocaleDateString()}
                          </div>
                        )}
                        {reg.status === 'pending_payment' && reg.expires_at && (
                          <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-amber-700 uppercase tracking-tighter">
                             <Clock className="w-2 h-2" /> EXPIRA {new Date(reg.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-r border-cetadmi-navy/5 text-center">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="p-4 min-w-[180px]">
                      <div className="flex flex-col gap-1">
                        {reg.status === 'pending_payment' && (
                          <button 
                            onClick={() => openActionModal(reg, 'confirmar')}
                            className="w-full text-left p-1.5 text-[9px] font-black uppercase tracking-widest bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 shadow-[2px_2px_0px_0px_#14532d] active:shadow-none translate-y-0 active:translate-y-[2px]"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Confirmar Pagamento
                          </button>
                        )}
                        
                        {(reg.status === 'pending_payment' || reg.status === 'paid') && (
                          <button 
                            onClick={() => openActionModal(reg, 'cancelar')}
                            className="w-full text-left p-1.5 text-[9px] font-black uppercase tracking-widest text-cetadmi-red hover:bg-cetadmi-red hover:text-white transition-colors flex items-center gap-2 brutalist-border"
                          >
                            <XCircle className="w-3 h-3" /> Cancelar Vaga
                          </button>
                        )}

                        {reg.status === 'pending_payment' && (
                          <button 
                            onClick={() => openActionModal(reg, 'expirar')}
                            className="w-full text-left p-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-500 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <AlertTriangle className="w-3 h-3" /> Marcar Expirado
                          </button>
                        )}

                        {(reg.status === 'cancelled' || reg.status === 'expired') && (
                          <span className="text-[9px] font-black opacity-20 uppercase italic text-center py-2">Inscrição Inativa</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-3 text-cetadmi-navy/40 pb-10">
        <ArrowRight className="w-4 h-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Controle Administrativo CETADMI: Auditoria Padrão Ativada.
        </p>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-cetadmi-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-serif font-black uppercase text-cetadmi-navy">Confirmar Ação</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {pendingAction.action === 'confirmar' && `Confirmar o pagamento de ${pendingAction.name}?`}
                  {pendingAction.action === 'cancelar' && `Cancelar a inscricao de ${pendingAction.name}?`}
                  {pendingAction.action === 'expirar' && `Marcar a inscricao de ${pendingAction.name} como expirada?`}
                </p>
              </div>

              <button type="button" onClick={() => setPendingAction(null)} className="text-slate-400 transition-colors hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-cetadmi-navy px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-cetadmi-blue disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </StudentListErrorBoundary>
  )
}

export default StudentList
