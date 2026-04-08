import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, Calendar, CheckCircle, Loader2, Mail, MapPin, MessageCircleHeart, ShieldCheck, Star } from 'lucide-react'
import { eventService } from '../../services/eventService'
import { institutionalContent } from '../../config/institution'

const toSafeDate = (value) => {
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(value)
}

const formatPrice = (value) => `R$ ${(Number(value) || 0).toFixed(2)}`

const HomePage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [failedBannerIds, setFailedBannerIds] = useState({})

  useEffect(() => {
    async function fetchPublishedEvents() {
      try {
        const data = await eventService.getEvents()
        setEvents(data.filter((event) => event.is_published))
      } catch (err) {
        setError('Os eventos publicos nao puderam ser carregados agora.')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedEvents()
  }, [])

  return (
    <div className="min-h-screen bg-brand-cream text-slate-800">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="flex items-center gap-4">
            <img src="/logo-cetadmi.png" alt="Logo CETADMI" width="72" height="72" className="h-14 w-14 object-contain" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Portal Publico</p>
              <h1 className="text-2xl font-serif font-black uppercase tracking-tight text-brand-navy">CETADMI</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 rounded-[1.5rem] bg-slate-50/80 p-2 text-[10px] font-black uppercase tracking-widest text-slate-500 lg:justify-end lg:gap-3 lg:bg-transparent lg:p-0">
            <a href="#sobre" className="rounded-full px-4 py-2 transition-colors hover:bg-brand-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Sobre</a>
            <a href="#eventos" className="rounded-full px-4 py-2 transition-colors hover:bg-brand-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Eventos</a>
            <a href="https://cetadmi.eadplataforma.app/courses" target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 transition-colors hover:bg-brand-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Cursos</a>
            <a href={eventService.buildWhatsAppUrl(institutionalContent.supportWhatsapp, 'Olá! Gostaria de atendimento do CETADMI.')} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 transition-colors hover:bg-brand-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Contato</a>
            <Link to="/login" className="rounded-full bg-brand-navy px-5 py-3 text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Entrar</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-brand-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.25),_transparent_35%)]" />
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:px-10 lg:py-24">
            <div className="relative z-10 max-w-4xl">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-brand-gold">Centro Educacional e Teologico</p>
              <h2 className="mt-6 text-4xl font-black uppercase leading-[0.95] text-balance md:text-7xl">Capacitacao, eventos e formacao com identidade CETADMI.</h2>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">{institutionalContent.mission}</p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <a href="#eventos" className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-gold px-8 py-5 text-sm font-black uppercase tracking-widest text-brand-navy transition-transform hover:scale-[1.02] hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy sm:w-auto">
                  Ver proximos eventos <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href="https://cetadmi.eadplataforma.app/courses" target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-8 py-5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto">
                  Conhecer cursos
                </a>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {institutionalContent.stats.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-sm">
                    <p className="text-3xl font-black text-white">{item.value}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="relative z-10 rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur-md shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Essencia do CETADMI</p>
              <div className="mt-6 space-y-5 text-sm text-white/80">
                <div className="flex gap-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" aria-hidden="true" />
                  <p>{institutionalContent.doctrinalLine}</p>
                </div>
                <div className="flex gap-4">
                  <BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" aria-hidden="true" />
                  <p>{institutionalContent.audience}</p>
                </div>
                <div className="flex gap-4">
                  <Star className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" aria-hidden="true" />
                  <p>O ecossistema une cursos, suporte pastoral, eventos presenciais e inscricoes organizadas em um unico portal.</p>
                </div>
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-brand-gold/20 bg-brand-gold/10 px-5 py-5 text-brand-gold">
                <p className="text-[10px] font-black uppercase tracking-[0.25em]">Contato oficial</p>
                <p className="mt-3 text-sm font-semibold text-white">{institutionalContent.supportWhatsapp}</p>
                <p className="mt-2 text-sm text-white/70">{institutionalContent.supportHours}</p>
              </div>
            </aside>
          </div>
        </section>

        <section id="sobre" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Sobre o CETADMI</p>
              <h3 className="mt-5 text-3xl font-serif font-black text-brand-navy">Formacao que acolhe, orienta e equipa.</h3>
              <p className="mt-5 text-base leading-relaxed text-slate-600">{institutionalContent.fullName} existe para servir a igreja com capacitacao biblica, teologica e ministerial, preservando responsabilidade doutrinaria e clareza na formacao crista.</p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{institutionalContent.leadership}</p>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Cursos e trilhas</p>
              <h3 className="mt-5 text-2xl font-serif font-black text-brand-navy">Base institucional ja ativa no ambiente EAD.</h3>
              <div className="mt-6 flex flex-wrap gap-3">
                {institutionalContent.featuredCourses.map((course) => (
                  <span key={course} className="rounded-full bg-brand-cream px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">{course}</span>
                ))}
              </div>
              <a href="https://cetadmi.eadplataforma.app/courses" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand-navy px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">
                Abrir catalogo de cursos <ArrowRight size={16} aria-hidden="true" />
              </a>
            </article>
          </div>
        </section>

        <section id="eventos" className="border-y border-slate-200 bg-white/60">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Inscricoes publicas</p>
                <h3 className="mt-4 text-3xl font-serif font-black text-brand-navy">Eventos e encontros com matricula online.</h3>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">A ponte entre os dois mundos fica aqui: o site institucional segue apresentando cursos, e este portal concentra os eventos, congressos, simposios e inscricoes publicas do CETADMI.</p>
              </div>
              <Link to="/login" className="inline-flex items-center justify-center gap-3 rounded-full border border-brand-navy/10 bg-brand-cream px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-navy transition-colors hover:bg-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Entrar no painel</Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-brand-navy" aria-hidden="true" />
              </div>
            ) : error ? (
              <div className="mt-10 rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5 text-sm font-semibold text-amber-800">{error}</div>
            ) : events.length === 0 ? (
              <div className="mt-10 rounded-[2rem] border border-slate-100 bg-brand-cream px-8 py-10 text-center">
                <p className="text-lg font-serif font-black text-brand-navy">Nenhum evento publico publicado no momento.</p>
                <p className="mt-3 text-sm text-slate-500">Enquanto isso, voce pode explorar os cursos e falar com a equipe oficial do CETADMI.</p>
              </div>
            ) : (
              <div className="mt-10 grid gap-8 lg:grid-cols-3">
                {events.map((event) => {
                  const eventDate = toSafeDate(event.event_date)
                  const eventDateLabel = event.event_date
                    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(eventDate)
                    : 'Data a confirmar'

                  const lowestPrice = event.price_options?.length
                    ? Math.min(...event.price_options.map((option) => Number(option.price) || 0))
                    : null

                  return (
                    <article key={event.id} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                      {event.banner_url && !failedBannerIds[event.id] ? (
                        <img src={event.banner_url} alt={`Banner do evento ${event.title}`} width="960" height="540" loading="lazy" onError={() => setFailedBannerIds((prev) => ({ ...prev, [event.id]: true }))} className="h-52 w-full object-cover" />
                      ) : (
                        <div className="flex h-52 items-center justify-center bg-brand-navy px-6 text-center text-white">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold">Evento CETADMI</p>
                            <p className="mt-4 text-2xl font-black uppercase leading-tight text-balance">{event.title}</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-5 p-6">
                        <div>
                          <h4 className="text-2xl font-serif font-black text-brand-navy text-balance">{event.title}</h4>
                          <p className="mt-3 text-sm leading-relaxed text-slate-500">{event.subtitle || 'Inscricao oficial com confirmacao organizada pelo CETADMI.'}</p>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-3"><Calendar size={16} className="text-brand-gold" aria-hidden="true" />{eventDateLabel}</div>
                          <div className="flex items-center gap-3"><MapPin size={16} className="text-brand-gold" aria-hidden="true" />{event.location || 'Local a confirmar'}</div>
                          <div className="flex items-center gap-3"><CheckCircle size={16} className="text-brand-gold" aria-hidden="true" />{lowestPrice !== null ? `A partir de ${formatPrice(lowestPrice)}` : 'Valores em breve'}</div>
                        </div>

                        <Link to={`/evento/${eventService.normalizeSlug(event.slug)}`} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-navy px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 sm:w-auto">
                          Abrir pagina do evento <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <article className="rounded-[2rem] bg-brand-navy p-8 text-white shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Prova social</p>
              <h3 className="mt-5 text-3xl font-serif font-black">A mesma instituicao que oferece cursos tambem sustenta este portal de eventos.</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-semibold text-white/75">"Excelente e com uma linguagem de facil compreensao. Uma bencao."</p>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Aluno CETADMI</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-semibold text-white/75">"Muito bom. Formacao acessivel, clara e edificante."</p>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Comunidade academica</p>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Fale conosco</p>
              <h3 className="mt-5 text-3xl font-serif font-black text-brand-navy">Suporte para cursos, inscricoes e orientacao.</h3>
              <div className="mt-8 space-y-5 text-sm text-slate-600">
                <div className="flex items-start gap-4"><MessageCircleHeart className="mt-0.5 h-5 w-5 text-brand-navy" aria-hidden="true" /><div><p className="font-semibold text-brand-navy">WhatsApp oficial</p><p>{institutionalContent.supportWhatsapp}</p></div></div>
                <div className="flex items-start gap-4"><Mail className="mt-0.5 h-5 w-5 text-brand-navy" aria-hidden="true" /><div><p className="font-semibold text-brand-navy">E-mail</p><p className="break-words">{institutionalContent.supportEmail}</p></div></div>
                <div className="flex items-start gap-4"><Calendar className="mt-0.5 h-5 w-5 text-brand-navy" aria-hidden="true" /><div><p className="font-semibold text-brand-navy">Horario de atendimento</p><p>{institutionalContent.supportHours}</p></div></div>
              </div>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <a href={eventService.buildWhatsAppUrl(institutionalContent.supportWhatsapp, 'Olá! Gostaria de atendimento do CETADMI.')} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-navy px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 sm:w-auto">Chamar no WhatsApp</a>
                <a href="https://cetadmi.eadplataforma.app/contact" target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:border-brand-navy hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 sm:w-auto">Abrir fale conosco</a>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage
