import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Edit3, 
  LogOut, 
  ArrowLeft,
  Bell,
  Settings,
  AlertCircle,
  ShieldCheck,
  Copy,
  MessageCircle,
  X,
  TrendingUp,
  CheckCircle,
  Loader2,
  UserPlus,
  Mail,
  Crown,
  Trash2,
  Menu,
  UsersRound,
  Image as ImageIcon,
  Sparkles,
  Award
} from 'lucide-react'
import { eventService } from '../../services/eventService'
import { institutionService } from '../../services/institutionService'
import { useAuth } from '../../contexts/AuthContext'
import EventForm from '../../components/dashboard/EventForm'
import StudentList from '../../components/dashboard/StudentList'
import { useInstitutionContent } from '../../hooks/useInstitutionContent'

const DashboardPage = () => {
  const { content: institutionalContent, setContent: setInstitutionalContent } = useInstitutionContent()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  
  // View States
  const [view, setView] = useState('events') // 'events' | 'students' | 'admins' | 'settings'
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // Modal/Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  
  const [adminUsers, setAdminUsers] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [institutionForm, setInstitutionForm] = useState(null)
  
  const { signOut, user, adminRole } = useAuth()

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await eventService.getEvents()
      setEvents(data)
      setError(null)
    } catch (err) {
      if (err.code === 'PGRST205' || err.message?.includes('events')) {
        setError('DATABASE_SETUP_REQUIRED')
      } else {
        setError('Erro ao carregar eventos administrativos.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    fetchAdminUsers()
  }, [])

  const fetchAdminUsers = async () => {
    try {
      setAdminLoading(true)
      const data = await eventService.getAdminUsers()
      setAdminUsers(data)
      setAdminError(null)
    } catch (err) {
      setAdminError(eventService.mapAdminError(err))
    } finally {
      setAdminLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'admins') {
      fetchAdminUsers()
    }
  }, [view])

  useEffect(() => {
    setInstitutionForm({
      ...institutionalContent,
      statsText: institutionalContent.stats.map((item) => `${item.label}: ${item.value}`).join('\n'),
      featuredCoursesText: institutionalContent.featuredCourses.join('\n'),
    })
  }, [institutionalContent])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCopyLink = async (slug) => {
    const normalizedSlug = eventService.normalizeSlug(slug)
    const fullUrl = `${window.location.origin}/evento/${normalizedSlug}`

    try {
      await navigator.clipboard.writeText(fullUrl)
      showToast("Link de inscrição copiado! ✅")
    } catch {
      setError('Nao foi possivel copiar o link automaticamente. Copie manualmente a URL publica do evento.')
    }
  }

  const handleWhatsappShare = (event) => {
    const fullUrl = `${window.location.origin}/evento/${eventService.normalizeSlug(event.slug)}`
    const message = `Olá! Convido você a se inscrever no evento *${event.title}* do CETADMI. Inscreva-se aqui: ${fullUrl}`
    window.open(eventService.buildWhatsAppUrl('', message), '_blank')
  }

  const handleInstitutionFieldChange = (field, value) => {
    setInstitutionForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSaveInstitutionSettings = async () => {
    if (!institutionForm) return

    try {
      setSettingsLoading(true)
      const payload = {
        ...institutionForm,
        stats: institutionService.normalizeStatsInput(institutionForm.statsText),
        featuredCourses: institutionService.normalizeCoursesInput(institutionForm.featuredCoursesText),
      }
      const saved = await institutionService.updateInstitutionSettings(payload)
      setInstitutionalContent(saved)
      showToast('Configuracoes institucionais salvas com sucesso.')
    } catch {
      setError('Nao foi possivel salvar as configuracoes institucionais agora.')
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingEvent(null)
    setIsFormOpen(true)
  }

  const handleEdit = (event, e) => {
    e.stopPropagation()
    setEditingEvent(event)
    setIsFormOpen(true)
  }

  const handleOpenStudents = (event) => {
    setIsFormOpen(false)
    setEditingEvent(null)
    setSelectedEvent(event)
    setView('students')
    setMobileNavOpen(false)
  }

  const handleFormClose = (refresh = false) => {
    setIsFormOpen(false)
    setEditingEvent(null)
    if (refresh) fetchEvents()
  }

  const handleEventsView = () => {
    setIsFormOpen(false)
    setEditingEvent(null)
    setView('events')
    setMobileNavOpen(false)
  }

  const handleStudentsView = () => {
    setIsFormOpen(false)
    setEditingEvent(null)

    if (selectedEvent) {
      setView('students')
    } else if (events.length > 0) {
      setSelectedEvent(events[0])
      setView('students')
    } else {
      showToast('Abra um evento para visualizar os inscritos.')
    }

    setMobileNavOpen(false)
  }

  const handleAdminsView = () => {
    setIsFormOpen(false)
    setEditingEvent(null)
    setView('admins')
    setMobileNavOpen(false)
  }

  const handleSettingsView = () => {
    setIsFormOpen(false)
    setEditingEvent(null)
    setView('settings')
    setMobileNavOpen(false)
  }

  const handleCertificateStandard = () => {
    window.open(`${window.location.origin}/certificado-padrao.html`, '_blank', 'noopener,noreferrer')
    setMobileNavOpen(false)
  }

  const handleInviteAdmin = async (e) => {
    e.preventDefault()

    if (!inviteEmail.trim()) {
      setAdminError('Informe o e-mail do usuario que deve receber acesso administrativo.')
      return
    }

    try {
      setInviteLoading(true)
      await eventService.addAdminUserByEmail(inviteEmail)
      setInviteEmail('')
      showToast('Administrador atualizado com sucesso.')
      await fetchAdminUsers()
    } catch (err) {
      setAdminError(eventService.mapAdminError(err))
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveAdmin = async (targetUserId) => {
    try {
      setAdminLoading(true)
      await eventService.removeAdminUser(targetUserId)
      showToast('Administrador removido com sucesso.')
      await fetchAdminUsers()
    } catch (err) {
      setAdminError(eventService.mapAdminError(err))
      setAdminLoading(false)
    }
  }

  // Stats Logic
  const totalEvents = events.length
  const publishedEvents = events.filter(e => e.is_published).length
  const totalStudents = events.reduce((acc, e) => acc + (e.total_registrations || 0), 0)
  const totalCapacity = events.reduce((acc, e) => acc + (e.capacity || 0), 0)
  const totalOccupiedSlots = events.reduce((acc, e) => acc + (e.occupied_slots || 0), 0)
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupiedSlots / totalCapacity) * 100) : 0

  return (
    <div className="flex min-h-screen bg-brand-cream font-sans text-slate-800 selection:bg-brand-navy selection:text-white overflow-x-hidden">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-8 right-8 z-[100] flex items-center gap-4 rounded-2xl bg-brand-navy px-8 py-4 text-white shadow-2xl animate-in slide-in-from-top-10 duration-500" aria-live="polite">
           <CheckCircle size={18} className="text-brand-gold" aria-hidden="true" />
            <span className="font-bold text-xs uppercase tracking-widest">{toast}</span>
            <button type="button" aria-label="Fechar notificacao" className="opacity-50 hover:opacity-100" onClick={() => setToast(null)}>
              <X size={16} aria-hidden="true" />
            </button>
         </div>
      )}

      {/* SIDEBAR - CONTRASTE TOTAL */}
      <aside className="w-72 bg-[#002D5C] text-white hidden xl:flex flex-col sticky top-0 h-screen border-r border-white/10 shadow-2xl z-50">
        <div className="p-10 flex flex-col items-center border-b border-blue-900/30">
          <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-brand-gold bg-white shadow-[0_22px_45px_rgba(0,0,0,0.28)]">
             <img src="/logo-cetadmi.png" alt="Logo CETADMI" className="h-14 w-14 object-contain" />
          </div>
          <h2 className="text-2xl font-serif font-black tracking-tight text-white mb-1 uppercase">CETADMI</h2>
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Capacitacao e aperfeicoamento ministerial</p>
          <div className="h-1 w-12 bg-brand-gold mt-2 rounded-full"></div>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-8">
          <NavItem 
            icon={<Calendar size={20}/>} 
            label="Eventos" 
            active={view === 'events' || view === 'students'} 
            onClick={handleEventsView}
          />
          <NavItem 
            icon={<Users size={20}/>} 
            label="Inscritos" 
            active={view === 'students'}
            onClick={handleStudentsView}
          />
          <NavItem 
            icon={<ShieldCheck size={20}/>} 
            label="Administradores" 
            active={view === 'admins'} 
            onClick={handleAdminsView}
          />
          <NavItem 
            icon={<Settings size={20}/>} 
            label="Configurações" 
            active={view === 'settings'}
            onClick={handleSettingsView}
          />
          <NavItem 
            icon={<Award size={20}/>} 
            label="Certificados" 
            active={false}
            onClick={handleCertificateStandard}
          />
        </nav>

        <div className="p-8 border-t border-blue-900/30">
          <button 
            onClick={signOut}
            className="flex items-center gap-4 px-6 py-4 w-full text-red-200 hover:bg-red-900/40 rounded-xl transition-all duration-300 font-bold uppercase text-[10px] tracking-widest group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 flex items-center justify-between px-8 md:px-12">
          <div>
            <h1 className="text-2xl font-serif font-black text-brand-navy tracking-tight leading-none uppercase">
                {view === 'admins' ? 'Gestão de Administradores' : 
                 view === 'settings' ? 'Configurações de Sistema' :
                  `Olá, ${user?.email.split('@')[0]}`}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                Painel de Controle • {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <button aria-label="Abrir menu do painel" onClick={() => setMobileNavOpen((open) => !open)} className="xl:hidden rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-brand-navy hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">
              <Menu size={20} aria-hidden="true" />
            </button>
            <button aria-label="Notificacoes" className="relative p-3 text-slate-400 transition-all duration-300 group hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">
              <Bell size={22} aria-hidden="true" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">{user?.email.split('@')[0]}</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{adminRole === 'owner' ? 'Owner' : 'Admin'}</p>
                </div>
               <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-gold bg-white shadow-lg">
                  <img src="/logo-cetadmi.png" alt="Logo CETADMI" className="h-7 w-7 object-contain" />
               </div>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200/60 bg-white px-6 py-4 xl:hidden">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <MobileNavChip icon={<Calendar size={16} />} label="Eventos" active={view === 'events' || view === 'students'} onClick={handleEventsView} />
            <MobileNavChip icon={<UsersRound size={16} />} label="Inscritos" active={view === 'students'} onClick={handleStudentsView} />
            <MobileNavChip icon={<ShieldCheck size={16} />} label="Admins" active={view === 'admins'} onClick={handleAdminsView} />
            <MobileNavChip icon={<Settings size={16} />} label="Config." active={view === 'settings'} onClick={handleSettingsView} />
            <MobileNavChip icon={<Award size={16} />} label="Certif." active={false} onClick={handleCertificateStandard} />
          </div>

          {mobileNavOpen && (
            <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <NavItem icon={<Calendar size={18} />} label="Eventos" active={view === 'events' || view === 'students'} onClick={handleEventsView} />
              <NavItem icon={<Users size={18} />} label="Inscritos" active={view === 'students'} onClick={handleStudentsView} />
              <NavItem icon={<ShieldCheck size={18} />} label="Administradores" active={view === 'admins'} onClick={handleAdminsView} />
              <NavItem icon={<Settings size={18} />} label="Configurações" active={view === 'settings'} onClick={handleSettingsView} />
              <NavItem icon={<Award size={18} />} label="Certificados" active={false} onClick={handleCertificateStandard} />
            </div>
          )}
        </div>

        <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12">
          
          {view === 'events' && (
            <>
              {/* METRIC CARDS */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MetricCard 
                  title="Total Eventos" 
                  value={events.length} 
                  icon={<Calendar />} 
                  color="blue" 
                />
                <MetricCard 
                  title="Inscritos Totais" 
                  value={totalStudents} 
                  icon={<Users />} 
                  color="green" 
                />
                <MetricCard 
                  title="Taxa de Preenchimento" 
                  value={`${occupancyRate}%`} 
                  icon={<TrendingUp />} 
                  color="gold" 
                />
                <MetricCard 
                  title="Admins Ativos" 
                  value={adminUsers.length || '-'} 
                  icon={<CheckCircle />} 
                  color="navy" 
                />
              </section>

              {/* ACTION BAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tighter">Gerenciar Eventos</h2>
                    <p className="text-sm text-slate-500 font-medium italic font-serif">{institutionalContent.mission}</p>
                  </div>
                 <button 
                  onClick={handleCreateNew}
                  className="flex items-center justify-center gap-3 bg-brand-navy text-white px-8 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-brand-navy-light transition-all duration-500 shadow-xl shadow-brand-navy/10 active:scale-95 group"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                  NOVO EVENTO ACADÊMICO
                </button>
              </div>

              {/* EVENTS GRID */}
              <section>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : error === 'DATABASE_SETUP_REQUIRED' ? (
                  <div className="bg-white border-2 border-brand-gold/20 rounded-[3rem] p-16 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-700">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-gold"></div>
                    <div className="w-24 h-24 bg-brand-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                       <ShieldCheck className="w-12 h-12 text-brand-gold" />
                    </div>
                    <h3 className="text-4xl font-serif font-black text-brand-navy uppercase tracking-tighter mb-4">Configuração Necessária</h3>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto mb-10 leading-relaxed font-serif italic text-lg">
                       Detectamos que as tabelas de banco de dados ainda não foram criadas no seu ambiente Supabase. <br/>
                       Para ativar este portal acadêmico, execute o script SQL de migração.
                    </p>
                    <div className="p-6 bg-slate-50 rounded-2xl inline-block border border-slate-100 mb-10">
                       <code className="text-[10px] font-mono text-brand-navy font-black tracking-widest uppercase">ERR_SCHEMA_CACHE_MISS: public.events</code>
                    </div>
                    <div>
                        <button onClick={fetchEvents} className="bg-brand-navy text-white px-12 py-5 rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl hover:bg-brand-gold transition-all uppercase">
                           Verificar Novamente
                        </button>
                    </div>
                  </div>
                ) : error ? (
                   <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-16 text-center animate-in shake duration-500">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-40" />
                    <p className="text-red-500 font-black uppercase tracking-[0.2em] text-xs mb-8">{error}</p>
                    <button onClick={fetchEvents} className="bg-brand-navy text-white px-10 py-4 rounded-xl font-black text-[10px] tracking-widest hover:opacity-90 transition-all">
                      TENTAR NOVAMENTE
                    </button>
                  </div>
                ) : events.length === 0 ? (
                  <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-24 text-center shadow-sm">
                    <Calendar className="w-24 h-24 text-slate-100 mx-auto mb-8" />
                    <h3 className="text-3xl font-serif font-black text-slate-300 uppercase tracking-tighter mb-4">Nenhum evento registrado</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                       Sua lista de eventos está vazia. Comece criando seu primeiro ciclo acadêmico teológico.
                    </p>
                    <button onClick={handleCreateNew} className="text-brand-gold font-black uppercase tracking-[0.3em] text-[10px] hover:scale-105 transition-all">
                      + Criar Primeiro Ciclo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event) => (
                      <article 
                        key={event.id} 
                        className="group flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:border-brand-gold/50 hover:shadow-2xl"
                      >
                         <div className="relative h-48 overflow-hidden border-b border-slate-100 bg-brand-navy">
                           {event.banner_url ? (
                             <img
                               src={event.banner_url}
                               alt={`Banner do evento ${event.title}`}
                               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                               width="800"
                               height="400"
                               loading="lazy"
                             />
                           ) : (
                             <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy text-white">
                               <div className="text-center">
                                 <ImageIcon className="mx-auto mb-3 h-10 w-10 text-brand-gold/70" aria-hidden="true" />
                                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Evento CETADMI</p>
                               </div>
                             </div>
                           )}

                           <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent" />
                            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                              <Sparkles size={12} aria-hidden="true" className="text-brand-gold" />
                              Evento Publico
                            </div>
                         </div>

                          <div className="p-8 flex-1 flex flex-col">
                             <div className="flex justify-between items-start mb-6">
                                 <span className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${event.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {event.is_published ? 'Publicado' : 'Rascunho'}
                                 </span>
                                <div className="text-right">
                                   <p className="text-xs font-bold text-slate-800">{event.occupied_slots || 0}/{event.capacity || 'Livre'} Vagas</p>
                                   <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                      <div 
                                          className="h-full bg-brand-gold transition-all duration-1000" 
                                          style={{ width: `${event.capacity ? Math.min(((event.occupied_slots || 0) / event.capacity) * 100, 100) : 22}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-brand-navy transition-colors font-serif leading-tight mb-2">
                               {event.title}
                            </h3>
                             <p className="text-sm text-slate-500 font-serif italic mb-6">
                                {event.subtitle || "Evento Acadêmico Especial"}
                             </p>

                             <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-500">
                               {event.description || 'Pagina publica pronta para receber banner, palestrantes, cronograma e inscricoes oficiais.'}
                             </p>

                             <div className="space-y-3 mb-8">
                               <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                  <Calendar size={16} className="text-brand-gold" />
                                  {new Date(event.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                               </div>
                               <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                  <MapPin size={16} className="text-brand-gold" />
                                  <span className="truncate">{event.location || "A definir"}</span>
                               </div>
                            </div>

                              <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-50 pt-6 xl:grid-cols-3">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleCopyLink(event.slug); }}
                                    aria-label={`Copiar link do evento ${event.title}`}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20"
                                  >
                                   <Copy size={16} aria-hidden="true" /> Link
                               </button>
                                <button 
                                   onClick={(e) => { e.stopPropagation(); handleWhatsappShare(event); }}
                                   aria-label={`Compartilhar evento ${event.title} no WhatsApp`}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-green-100 transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                                  >
                                    <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => handleOpenStudents(event)}
                                   className="rounded-2xl border border-brand-navy/10 bg-brand-cream px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20"
                                 >
                                  Inscritos
                                </button>
                                <button 
                                   onClick={(e) => handleEdit(event, e)}
                                   aria-label={`Editar evento ${event.title}`}
                                   className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400 transition-all hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 xl:col-span-1"
                                  >
                                   <Edit3 size={18} aria-hidden="true" />
                                </button>
                             </div>
                          </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {view === 'students' && (
            <div className="animate-in slide-in-from-bottom duration-700">
              <div className="mb-10 flex items-center gap-4">
                 <button 
                  onClick={handleEventsView}
                   className="p-4 bg-white border border-slate-100 rounded-2xl text-brand-navy hover:bg-brand-navy hover:text-white transition-all duration-300 shadow-sm"
                 >
                     <ArrowLeft size={20} />
                  </button>
                  <div>
                     <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tighter">Lista de Matriculados</h2>
                     <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">
                       {selectedEvent ? `Gestão de Participantes • ${selectedEvent.title}` : 'Selecione um evento para visualizar os participantes'}
                     </p>
                  </div>
               </div>

               {selectedEvent ? (
                 <StudentList 
                   event={selectedEvent} 
                   onBack={handleEventsView} 
                 />
               ) : (
                 <div className="rounded-[2.5rem] border border-slate-100 bg-white p-16 text-center shadow-sm">
                   <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-brand-cream text-brand-navy shadow-inner">
                     <Users className="h-10 w-10" aria-hidden="true" />
                   </div>
                   <h3 className="text-3xl font-serif font-black uppercase tracking-tighter text-brand-navy">Nenhum evento selecionado</h3>
                   <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
                     Abra a lista de eventos e clique em <span className="font-black text-brand-navy">Inscritos</span> no card do evento que voce deseja acompanhar.
                   </p>
                   <button
                     type="button"
                     onClick={handleEventsView}
                     className="mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-navy px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20"
                   >
                     Voltar para eventos
                   </button>
                 </div>
               )}
            </div>
          )}

          {view === 'admins' && (
            <div className="animate-in fade-in duration-700 space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div>
                   <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tighter">Gestão de Acessos</h2>
                   <p className="text-sm text-slate-400 font-medium font-serif italic mt-1">Somente o owner pode promover ou remover administradores.</p>
                 </div>

                 <form onSubmit={handleInviteAdmin} className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                    <label className="space-y-2">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Conceder acesso por e-mail</span>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                        <input
                          type="email"
                         value={inviteEmail}
                         onChange={(e) => setInviteEmail(e.target.value)}
                         placeholder="usuario@dominio.com"
                         disabled={adminRole !== 'owner' || inviteLoading}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 transition-all focus-visible:outline-none focus-visible:border-brand-navy focus-visible:ring-2 focus-visible:ring-brand-navy/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    </label>

                   <button
                     type="submit"
                     disabled={adminRole !== 'owner' || inviteLoading}
                     className="inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-navy px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-brand-navy-light disabled:cursor-not-allowed disabled:opacity-60 lg:self-end"
                   >
                     {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                     Adicionar Admin
                   </button>
                 </form>

                 <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                   O usuario precisa ter feito login ao menos uma vez para existir na tabela `profiles` e poder receber permissao administrativa.
                 </div>

                 {adminError && (
                   <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                     {adminError}
                   </div>
                 )}
              </div>

               <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
                 <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Administrador</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nível</th>
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cadastro</th>
                       <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-sans">
                     {adminLoading ? (
                       <tr>
                         <td colSpan="4" className="px-10 py-16 text-center text-slate-400">
                           <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                         </td>
                       </tr>
                     ) : adminUsers.length === 0 ? (
                       <tr>
                         <td colSpan="4" className="px-10 py-16 text-center text-sm font-semibold text-slate-400">
                           Nenhum administrador carregado.
                         </td>
                       </tr>
                     ) : adminUsers.map((admin) => {
                       const isCurrentUser = admin.user_id === user?.id
                       const label = admin.role === 'owner' ? 'OWNER' : 'ADMIN'
                       const displayName = admin.profile?.full_name || admin.profile?.email || admin.user_id
                       const canRemove = adminRole === 'owner' && admin.role !== 'owner' && !isCurrentUser

                       return (
                         <tr key={admin.user_id}>
                           <td className="px-10 py-8">
                             <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cream font-black text-brand-navy border border-brand-navy/10">
                                  {(admin.profile?.email || admin.user_id)[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-sm tracking-tight">{displayName}</div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{admin.profile?.email || admin.user_id}</div>
                                </div>
                             </div>
                           </td>
                           <td className="px-10 py-8">
                              <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-[8px] font-black tracking-widest uppercase ${admin.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-brand-navy text-white'}`}>
                                {admin.role === 'owner' && <Crown size={12} />}
                                {label}
                              </span>
                           </td>
                           <td className="px-10 py-8 text-[10px] font-bold text-slate-400 tracking-widest uppercase italic">
                              {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                           </td>
                           <td className="px-10 py-8">
                              <button
                                type="button"
                                disabled={!canRemove || adminLoading}
                                onClick={() => handleRemoveAdmin(admin.user_id)}
                                aria-label={`Remover administrador ${displayName}`}
                                className="inline-flex items-center gap-2 text-red-500 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Remover</span>
                              </button>
                           </td>
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="animate-in fade-in duration-700 max-w-2xl mx-auto">
               <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
                  <div className="text-center pb-8 border-b border-slate-50">
                     <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tighter">Identidade Institucional</h2>
                     <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-2">Conteudo base reaproveitado do ecossistema CETADMI</p>
                   </div>

                    <div className="space-y-8">
                      <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nome institucional</span>
                            <input value={institutionForm?.fullName || ''} onChange={(e) => handleInstitutionFieldChange('fullName', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Nome legado</span>
                            <input value={institutionForm?.legacyName || ''} onChange={(e) => handleInstitutionFieldChange('legacyName', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                        </div>

                        <label className="space-y-2">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Missao</span>
                          <textarea value={institutionForm?.mission || ''} onChange={(e) => handleInstitutionFieldChange('mission', e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Linha doutrinaria</span>
                            <textarea value={institutionForm?.doctrinalLine || ''} onChange={(e) => handleInstitutionFieldChange('doctrinalLine', e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Publico e audiencia</span>
                            <textarea value={institutionForm?.audience || ''} onChange={(e) => handleInstitutionFieldChange('audience', e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp oficial</span>
                            <input value={institutionForm?.supportWhatsapp || ''} onChange={(e) => handleInstitutionFieldChange('supportWhatsapp', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">E-mail oficial</span>
                            <input value={institutionForm?.supportEmail || ''} onChange={(e) => handleInstitutionFieldChange('supportEmail', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Horario</span>
                            <input value={institutionForm?.supportHours || ''} onChange={(e) => handleInstitutionFieldChange('supportHours', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria destaque</span>
                            <input value={institutionForm?.categoryHighlight || ''} onChange={(e) => handleInstitutionFieldChange('categoryHighlight', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Lideranca</span>
                            <input value={institutionForm?.leadership || ''} onChange={(e) => handleInstitutionFieldChange('leadership', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Diretor no certificado</span>
                            <input value={institutionForm?.certificateDirectorName || ''} onChange={(e) => handleInstitutionFieldChange('certificateDirectorName', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo no certificado</span>
                            <input value={institutionForm?.certificateDirectorRole || ''} onChange={(e) => handleInstitutionFieldChange('certificateDirectorRole', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Metricas (uma por linha: Label: Valor)</span>
                            <textarea value={institutionForm?.statsText || ''} onChange={(e) => handleInstitutionFieldChange('statsText', e.target.value)} rows={6} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                          <label className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Cursos em destaque (um por linha)</span>
                            <textarea value={institutionForm?.featuredCoursesText || ''} onChange={(e) => handleInstitutionFieldChange('featuredCoursesText', e.target.value)} rows={6} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20" />
                          </label>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-5 py-4 text-sm text-brand-navy">
                            Este bloco agora persiste no Supabase e alimenta portal, painel e certificados.
                          </div>
                          <button type="button" onClick={handleSaveInstitutionSettings} disabled={settingsLoading || !institutionForm} className="inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-navy px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-gold hover:text-brand-navy disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">
                            {settingsLoading ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} aria-hidden="true" />}
                            Salvar configuracoes
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {institutionalContent.stats.map((item) => (
                          <div key={item.label} className="rounded-2xl bg-brand-cream p-5 text-center">
                            <p className="text-2xl font-black text-brand-navy">{item.value}</p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-5 py-4 text-sm text-brand-navy">
                        Este bloco exibe informacoes institucionais extraidas do site publico para manter consistencia entre eventos, atendimento e identidade do portal.
                      </div>

                    </div>
                </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-auto px-12 py-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
           <div className="flex items-center gap-4">
              <img src="/logo-cetadmi.png" alt="" className="w-10 h-10 grayscale" />
              <div className="text-[9px] font-black uppercase tracking-[0.3em]">Gestão Acadêmica Profissional</div>
           </div>
            <div className="text-[8px] font-black uppercase tracking-widest italic">
              &copy; {new Date().getFullYear()} {institutionalContent.legacyName}. Todos os direitos reservados.
           </div>
        </footer>
      </main>

      {/* Modal de Formulário */}
      {view === 'events' && isFormOpen && (
        <EventForm 
          event={editingEvent} 
          onClose={handleFormClose} 
        />
      )}
    </div>
  )
}

// Sub-componentes
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 font-bold text-[10px] tracking-widest uppercase border ${active ? 'bg-brand-gold text-brand-navy shadow-lg scale-105' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10 hover:translate-x-1'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavChip = ({ icon, label, active = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-slate-200 bg-white text-slate-500 hover:border-brand-navy hover:text-brand-navy'}`}
  >
    <span aria-hidden="true">{icon}</span>
    <span>{label}</span>
  </button>
)

const MetricCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    gold: 'bg-amber-50 text-amber-600',
    navy: 'bg-slate-100 text-brand-navy',
  };
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center gap-6 transition-all duration-500 hover:shadow-xl hover:shadow-brand-navy/5 group">
      <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-serif font-black text-slate-800 tabular-nums">{value}</p>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 h-[400px] animate-pulse">
    <div className="h-6 bg-slate-100 rounded-full w-1/4 mb-10" />
    <div className="space-y-6">
      <div className="h-10 bg-slate-100 rounded-2xl w-3/4" />
      <div className="h-6 bg-slate-50 rounded-full w-1/2" />
      <div className="h-20 bg-slate-50 rounded-2xl mt-10" />
    </div>
  </div>
);

export default DashboardPage
