import React, { useState, useEffect } from 'react'
import { Plus, Calendar, MapPin, Users, Edit3, ExternalLink, LogOut, ChevronRight, Users2, ArrowLeft } from 'lucide-react'
import { eventService } from '../../services/eventService'
import { useAuth } from '../../contexts/AuthContext'
import EventForm from '../../components/dashboard/EventForm'
import StudentList from '../../components/dashboard/StudentList'

const DashboardPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // View States
  const [view, setView] = useState('events') // 'events' | 'students'
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // Modal/Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  
  const { signOut, user } = useAuth()

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await eventService.getEvents()
      setEvents(data)
    } catch (err) {
      setError('Erro ao carregar eventos administrativos.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

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
    setSelectedEvent(event)
    setView('students')
  }

  const handleFormClose = (refresh = false) => {
    setIsFormOpen(false)
    setEditingEvent(null)
    if (refresh) fetchEvents()
  }

  return (
    <div className="min-h-screen bg-cetadmi-cream font-sans selection:bg-cetadmi-navy selection:text-cetadmi-cream">
      {/* Sidebar / Topbar Administrativa */}
      <header className="bg-cetadmi-navy text-cetadmi-cream p-6 brutalist-border border-x-0 border-t-0 flex justify-between items-center shadow-md relative z-50">
        <div className="flex items-center gap-6">
          <div className="bg-white p-1.5 brutalist-border border-cetadmi-cream/20 shadow-[2px_2px_0px_0px_theme(colors.cetadmi.red)]">
            <img src="/logo-cetadmi.png" alt="CETADMI" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-black tracking-tight uppercase">CETADMI</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-50">
              Colegiado Superior de Gestão
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black tracking-wide">{user?.email}</p>
            <p className="text-[10px] uppercase opacity-40 font-black tracking-widest">Acesso Autorizado</p>
          </div>
          <button 
            onClick={signOut}
            className="p-3 bg-cetadmi-red text-white hover:bg-white hover:text-cetadmi-red transition-all brutalist-border border-cetadmi-red shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        {view === 'events' ? (
          <>
            {/* Header de Ação - Visão de Eventos */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 animate-in slide-in-from-top duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-5xl font-serif font-black text-cetadmi-navy tracking-tighter uppercase">Painel de Eventos</h2>
                  <div className="h-0.5 flex-grow bg-cetadmi-navy/10 min-w-[50px] md:min-w-[100px]" />
                </div>
                <p className="text-cetadmi-navy/60 font-medium max-w-2xl text-lg leading-relaxed font-serif italic">
                  Gerenciamento acadêmico de conferências, simpósios e reuniões do Colegiado CETADMI.
                </p>
              </div>

              <button 
                onClick={handleCreateNew}
                className="brutalist-button flex items-center justify-center gap-3 py-5 px-10 text-xl font-black shadow-[8px_8px_0px_0px_theme(colors.cetadmi.red)]"
              >
                <Plus className="w-6 h-6" />
                NOVO EVENTO
              </button>
            </div>

            {/* Listagem de Estados */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3].map(i => (
                  <div key={i} className="brutalist-card h-80 animate-pulse bg-white/50 border-cetadmi-navy/10" />
                ))}
              </div>
            ) : error ? (
              <div className="brutalist-card bg-cetadmi-red/5 border-cetadmi-red text-center py-16">
                <p className="text-cetadmi-red font-black uppercase tracking-widest text-lg mb-6">{error}</p>
                <button onClick={fetchEvents} className="brutalist-button py-4 px-10 text-xs">
                  TENTAR NOVAMENTE
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="brutalist-card bg-white text-center py-24 shadow-[12px_12px_0px_0px_theme(colors.cetadmi.navy)]">
                <Calendar className="w-20 h-20 text-cetadmi-navy/10 mx-auto mb-8" />
                <p className="text-3xl font-serif font-black text-cetadmi-navy/30 mb-4 uppercase tracking-tighter">Nenhum evento registrado</p>
                <button onClick={handleCreateNew} className="text-cetadmi-red font-black uppercase tracking-[0.3em] text-[10px] hover:underline underline-offset-8">
                  Criar Primeiro Evento Acadêmico
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {events.map(event => (
                  <div key={event.id} className="brutalist-card bg-white hover:shadow-[12px_12px_0px_0px_theme(colors.cetadmi.navy)] transition-all group flex flex-col h-full relative cursor-pointer" onClick={() => handleOpenStudents(event)}>
                    {/* Banner Preview */}
                    <div className="h-48 bg-cetadmi-navy/5 -mx-6 -mt-6 mb-6 overflow-hidden brutalist-border border-x-0 border-t-0 p-1">
                      {event.banner_url ? (
                        <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cetadmi-navy/5 font-serif text-8xl font-black">
                          CET
                        </div>
                      )}
                    </div>

                    <div className="flex-grow space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-black tracking-widest px-2 py-1 brutalist-border ${event.is_published ? 'bg-green-100 text-green-800 border-green-800' : 'bg-cetadmi-red/10 text-cetadmi-red border-cetadmi-red'}`}>
                          {event.is_published ? 'PUBLICADO' : 'RASCUNHO'}
                        </span>
                        <div className="flex gap-2">
                           {/* Shortcut Edit */}
                           <button onClick={(e) => handleEdit(event, e)} className="p-2 brutalist-border hover:bg-cetadmi-navy hover:text-cetadmi-cream transition-colors">
                              <Edit3 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>

                      <h3 className="text-2xl font-serif font-black text-cetadmi-navy mb-4 line-clamp-2 leading-none uppercase tracking-tight">
                        {event.title}
                      </h3>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/70">
                          <Calendar className="w-4 h-4 text-cetadmi-red" />
                          {new Date(event.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/70">
                          <MapPin className="w-4 h-4 text-cetadmi-red" />
                          <span className="line-clamp-1">{event.location || 'Local a definir'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-6 border-t-2 border-cetadmi-navy/10 mt-auto">
                      <button 
                        className="flex-1 flex items-center justify-center gap-3 p-4 bg-cetadmi-navy text-cetadmi-cream text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cetadmi-blue transition-colors shadow-[4px_4px_0px_0px_theme(colors.cetadmi.red)] active:shadow-none translate-x-0 active:translate-x-1 active:translate-y-1"
                      >
                        <Users2 className="w-4 h-4" />
                        Ver Inscritos
                      </button>
                      <a 
                        href={`/evento/${event.slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-4 brutalist-border hover:bg-cetadmi-navy hover:text-cetadmi-cream transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Visão de Inscritos */
          <div className="animate-in slide-in-from-bottom duration-500">
            <StudentList 
              event={selectedEvent} 
              onBack={() => setView('events')} 
            />
          </div>
        )}
      </main>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <EventForm 
          event={editingEvent} 
          onClose={handleFormClose} 
        />
      )}

      {/* Estética de Rodapé Administrativo */}
      <footer className="max-w-7xl mx-auto p-12 border-t-2 border-cetadmi-navy/5 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 grayscale pointer-events-none">
          <div className="flex items-center gap-4">
             <img src="/logo-cetadmi.png" alt="" className="w-12 h-12 grayscale" />
             <div className="text-[10px] font-black uppercase tracking-[0.2em]">SISTEMA DE GESTÃO ACADÊMICA</div>
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-center">
             &copy; {new Date().getFullYear()} CETADMI - TODOS OS DIREITOS RESERVADOS À ADMINISTRAÇÃO SUPERIOR
          </div>
      </footer>
    </div>
  )
}

export default DashboardPage
