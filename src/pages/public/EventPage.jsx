import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, ArrowRight, Loader2, AlertCircle, ImageOff, Mic2, BookOpenText, ShieldCheck, WalletCards, MessageCircleHeart } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useInstitutionContent } from '../../hooks/useInstitutionContent';

const toSafeDate = (value, options = {}) => {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    if (options.endOfDay) {
      localDate.setHours(23, 59, 59, 999);
    }

    return localDate;
  }

  return new Date(value);
};

const formatPrice = (value) => `R$ ${(Number(value) || 0).toFixed(2)}`;

const EventPage = () => {
  const { content: institutionalContent } = useInstitutionContent();
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [bannerFailed, setBannerFailed] = useState(false);

  // Registration Form State
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    church_name: '',
  });

  useEffect(() => {
    async function fetchEvent() {
      try {
        setBannerFailed(false);
        setSelectedOption(null);
        const data = await eventService.getEventBySlug(slug);
        if (!data || !data.is_published) throw new Error('Este evento acadêmico não está disponível para inscrições públicas no momento.');
        setEvent(data);
        setSelectedOption(data.price_options?.[0] ?? null);
      } catch (err) {
        setError(err.message || 'Erro ao carregar os dados do evento.');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  const handleInputChange = (e) => {
    setValidationError(null);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!selectedOption) {
      setValidationError('Selecione uma categoria de inscricao para prosseguir.');
      return;
    }

    if (!formData.full_name || !formData.phone || !formData.email) {
      setValidationError('Preencha nome completo, WhatsApp e e-mail para continuar.');
      return;
    }

    const normalizedRegistrant = eventService.normalizeRegistrationInput(formData);

    if (!normalizedRegistrant.phone) {
      setValidationError('Informe um WhatsApp valido para continuar.');
      return;
    }
     
    setRegistering(true);
    setError(null);
    setValidationError(null);

    try {
      const registrationPayload = {
        event_id: event.id,
        ...normalizedRegistrant,
        selected_price_id: selectedOption.id,
        selected_price_label: selectedOption.label,
        amount_due: selectedOption.price,
        amount_paid: 0,
        pricing_snapshot: selectedOption,
      };

      // 1. Criar inscrição no banco
      await eventService.createRegistration(registrationPayload);
      
      // 2. Definir sucesso
      setSuccess(true);

      // 3. Preparar link de WhatsApp
      const sanitizedPhone = eventService.sanitizeWhatsAppNumber(event.whatsapp_number);
      if (!sanitizedPhone) {
        setRegistering(false);
        return;
      }

      const whatsappMsg = `Olá! Concluí minha matrícula no evento *${event.title}* via portal administrativo.\n\n` +
                          `*DADOS DA MATRÍCULA:* \n` +
                          `- Aluno: ${normalizedRegistrant.full_name}\n` +
                          `- Categoria: ${selectedOption.label}\n` +
                          `- Investimento: ${formatPrice(selectedOption.price)}\n\n` +
                          `Estarei enviando o comprovante do PIX por aqui para confirmação definitiva da minha vaga.`;
      
      const whatsappUrl = eventService.buildWhatsAppUrl(sanitizedPhone, whatsappMsg);
      
      // 4. Redirect com delay
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 2500);

    } catch (err) {
      setError(eventService.mapRegistrationError(err));
      setRegistering(false);
    }
  };

  const registrationDeadline = toSafeDate(event?.registration_deadline, { endOfDay: true });
  const registrationClosed = registrationDeadline ? registrationDeadline < new Date() : false;
  const hasPriceOptions = (event?.price_options?.length || 0) > 0;
  const canSubmit = !registering && !registrationClosed && hasPriceOptions;
  const hasBanner = Boolean(event?.banner_url) && !bannerFailed;
  const eventDate = toSafeDate(event?.event_date);
  const organizationWhatsApp = eventService.sanitizeWhatsAppNumber(event?.whatsapp_number);
  const hasValidOrganizationWhatsApp = Boolean(organizationWhatsApp);
  const eventDateLabel = event?.event_date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(eventDate)
    : 'Data a confirmar';
  const registrationDeadlineLabel = registrationDeadline
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(registrationDeadline)
    : 'Sem prazo definido';
  const speakers = Array.isArray(event?.speakers) ? event.speakers.filter((speaker) => speaker?.name) : [];
  const program = Array.isArray(event?.program) ? event.program.filter((item) => item?.title || item?.time) : [];
  const lowestPrice = event?.price_options?.length
    ? Math.min(...event.price_options.map((option) => Number(option.price) || 0))
    : null;

  if (loading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-brand-navy animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6 text-center">
      <div className="bg-white p-12 rounded-[3rem] border-2 border-red-100 shadow-2xl max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-serif font-black text-brand-navy mb-4 tracking-tighter uppercase leading-none">Acesso Restrito</h2>
        <p className="text-slate-500 font-serif italic mb-8">{error || 'Evento não localizado ou fora do prazo.'}</p>
        <a href="/" className="bg-brand-navy text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-brand-gold transition-all inline-block shadow-lg uppercase">Voltar</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream text-slate-800 font-sans">
      <header className="border-b border-white/10 bg-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <Link to="/" className="flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-brand-gold bg-white shadow-[0_14px_35px_rgba(0,0,0,0.24)]">
              <img src="/logo-cetadmi.png" alt="Logo CETADMI" width="64" height="64" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Portal Publico</p>
              <p className="text-xl font-serif font-black uppercase tracking-tight">CETADMI</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/75 lg:justify-end lg:gap-3">
            <Link to="/" className="rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Inicio</Link>
            <a href="https://cetadmi.eadplataforma.app/courses" target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Cursos</a>
            <a href={eventService.buildWhatsAppUrl(institutionalContent.supportWhatsapp, 'Olá! Gostaria de atendimento do CETADMI.')} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Contato</a>
            <Link to="/login" className="rounded-full bg-white px-5 py-3 text-brand-navy transition-colors hover:bg-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Painel</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-brand-navy text-white">
        {hasBanner ? (
          <>
            <img
              src={event.banner_url}
              alt={`Banner do evento ${event.title}`}
              className="absolute inset-0 h-full w-full object-cover"
              width="1600"
              height="900"
              fetchpriority="high"
              onError={() => setBannerFailed(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/88 to-brand-navy/70" />
            <div className="absolute inset-y-0 right-0 w-1/3 bg-brand-gold/10 backdrop-blur-[3px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-brand-navy" />
            <div className="absolute top-0 right-0 h-full w-1/2 bg-brand-gold/10 skew-x-[-12deg] translate-x-24" />
          </>
        )}

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.25fr)_380px] lg:items-end lg:px-10 lg:py-24">
          <div className="max-w-4xl">
            <span className="mb-5 inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-brand-gold backdrop-blur-sm shadow-lg shadow-brand-navy/20">
              {registrationClosed ? 'Inscricoes Encerradas' : 'Inscricoes Abertas'}
            </span>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.95] text-white md:text-7xl text-balance drop-shadow-[0_10px_30px_rgba(8,15,31,0.55)]">
              {event.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl italic leading-relaxed text-white/82 md:text-2xl">
              {event.subtitle || 'Formacao biblica, teologica e pedagogica para uma Escola Dominical forte, fiel e relevante.'}
            </p>

            <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm shadow-lg shadow-brand-navy/15">
                <Calendar size={18} className="text-brand-gold" aria-hidden="true" />
                {eventDateLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm shadow-lg shadow-brand-navy/15">
                <MapPin size={18} className="text-brand-gold" aria-hidden="true" />
                {event.location || 'Sede Central CETADMI'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm shadow-lg shadow-brand-navy/15">
                <CheckCircle size={18} className="text-brand-gold" aria-hidden="true" />
                {registrationDeadline ? `Inscreva-se ate ${registrationDeadlineLabel}` : 'Inscricao com confirmacao organizada'}
              </span>
            </div>

            <div className="mt-12 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <a href="#inscricao" className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-gold px-8 py-5 text-base font-black uppercase tracking-tight text-brand-navy shadow-xl transition-transform hover:scale-[1.02] hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy sm:w-auto sm:px-10 sm:text-lg">
                Garantir minha vaga agora <ArrowRight size={22} aria-hidden="true" />
              </a>
              <div className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm">
                {lowestPrice !== null ? `A partir de ${formatPrice(lowestPrice)}` : 'Valores em breve'}
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:max-w-4xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-sm shadow-2xl shadow-brand-navy/15">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Sobre o CETADMI</p>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{institutionalContent.mission}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-brand-gold/10 px-5 py-5 backdrop-blur-sm shadow-2xl shadow-brand-navy/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-gold bg-white/95 shadow-inner">
                    <img src="/logo-cetadmi.png" alt="Selo CETADMI" className="h-6 w-6 object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Atendimento oficial</p>
                    <p className="mt-1 text-xs text-white/65">Suporte para inscricao, comprovante e confirmacao.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm text-white/80">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">WhatsApp</span>
                    <span className="text-right font-semibold break-words">{event.whatsapp_number || institutionalContent.supportWhatsapp}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">E-mail</span>
                    <span className="text-right font-semibold break-words">{institutionalContent.supportEmail}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Horario</span>
                    <span className="text-right font-semibold">{institutionalContent.supportHours}</span>
                  </div>
                </div>
                <a href={eventService.buildWhatsAppUrl(event.whatsapp_number || institutionalContent.supportWhatsapp, `Olá! Gostaria de suporte sobre o evento ${event.title}.`)} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-brand-navy transition-colors hover:bg-brand-gold">
                  Falar com a equipe
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-2xl shadow-brand-navy/20 lg:p-8 lg:-mb-10">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-gold">Painel do Evento</p>
                <h2 className="mt-2 text-2xl font-serif font-black text-white">Resumo Rápido</h2>
              </div>
              {!hasBanner && <ImageOff className="h-8 w-8 text-white/40" aria-hidden="true" />}
            </div>

            <div className="mt-6 space-y-4 text-sm text-white/80">
              <div className="flex items-start justify-between gap-4">
                <span className="font-black uppercase tracking-widest text-white/45">Categoria</span>
                <span className="text-right font-semibold">Evento Presencial</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-black uppercase tracking-widest text-white/45">Capacidade</span>
                <span className="text-right font-semibold">{event.capacity ? `${event.capacity} vagas` : 'Livre / sob confirmacao'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-black uppercase tracking-widest text-white/45">WhatsApp</span>
                <span className="text-right font-semibold">{event.whatsapp_number || 'Nao informado'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-black uppercase tracking-widest text-white/45">Investimento</span>
                <span className="text-right font-semibold">{lowestPrice !== null ? `A partir de ${formatPrice(lowestPrice)}` : 'A confirmar'}</span>
              </div>
              <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-brand-gold">
                O formulario de inscricao completa e a confirmacao financeira ficam logo abaixo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className={`relative z-10 mx-auto max-w-6xl px-6 py-16 lg:-mt-2 lg:py-20 ${!success && !registrationClosed && hasPriceOptions ? 'pb-32 lg:pb-20' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT COLUMN: Details */}
          <div className="lg:col-span-7 space-y-16 min-w-0">
            {/* About */}
            <section>
              <h2 className="text-3xl font-bold text-brand-navy font-serif mb-6 flex items-center gap-3">
                <div className="w-8 h-1 bg-brand-gold"></div> Sobre o Evento
              </h2>
              <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                <p className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {event.description || 'A descricao completa deste encontro ainda esta sendo finalizada pela organizacao. Em breve voce vera aqui todos os objetivos, enfases ministeriais e orientacoes do evento.'}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-brand-cream p-5">
                    <ShieldCheck className="h-6 w-6 text-brand-navy" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-brand-navy">Doutrina e solidez</h3>
                    <p className="mt-2 text-sm text-slate-600">Conteudo preparado para fortalecer a sã doutrina e o ensino cristao com responsabilidade.</p>
                  </div>
                  <div className="rounded-2xl bg-brand-cream p-5">
                    <BookOpenText className="h-6 w-6 text-brand-navy" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-brand-navy">Capacitacao real</h3>
                    <p className="mt-2 text-sm text-slate-600">Exposicoes, oficinas e orientacoes praticas para professores, lideres e alunos da EBD.</p>
                  </div>
                  <div className="rounded-2xl bg-brand-cream p-5">
                    <MessageCircleHeart className="h-6 w-6 text-brand-navy" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-brand-navy">Acompanhamento</h3>
                    <p className="mt-2 text-sm text-slate-600">Inscricao organizada com confirmacao via WhatsApp e orientacao direta da equipe.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Speakers */}
            <section>
              <h2 className="text-3xl font-bold text-brand-navy font-serif mb-8 flex items-center gap-3">
                <div className="w-8 h-1 bg-brand-gold"></div> Palestrantes e Mestres
              </h2>
              {speakers.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {speakers.map((speaker, index) => (
                    <article key={speaker.id || index} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl">
                      {speaker.image ? (
                        <img
                          src={speaker.image}
                          alt={speaker.name}
                          className="h-64 w-full object-cover"
                          width="600"
                          height="600"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-brand-navy text-5xl font-black text-brand-gold">
                          {speaker.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-3 p-6">
                        <span className="inline-flex rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-navy">
                          Convidado
                        </span>
                        <h3 className="text-2xl font-serif font-black text-brand-navy text-balance">{speaker.name}</h3>
                        <p className="text-sm leading-relaxed text-slate-600">{speaker.role || 'Convidado especial do simposio.'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-brand-cream p-4 text-brand-navy">
                      <Mic2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-black text-brand-navy">Programacao de convidados em curadoria</h3>
                      <p className="mt-2 max-w-2xl text-slate-600">
                        Os nomes dos palestrantes, mestres e facilitadores serao divulgados aqui assim que a organizacao concluir a agenda oficial do simposio.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Program */}
            <section>
              <h2 className="text-3xl font-bold text-brand-navy font-serif mb-8 flex items-center gap-3">
                <div className="w-8 h-1 bg-brand-gold"></div> Cronograma Acadêmico
              </h2>
              {program.length > 0 ? (
                <div className="space-y-4">
                  {program.map((item, index) => (
                    <article key={item.id || index} className="grid gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-[110px_minmax(0,1fr)] md:items-start">
                      <div className="rounded-2xl bg-brand-navy px-4 py-4 text-center text-brand-gold shadow-lg shadow-brand-navy/10">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/70">Horario</div>
                        <div className="mt-2 text-2xl font-black">{item.time || '--:--'}</div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-serif font-black text-brand-navy text-balance">{item.title || 'Momento especial do evento'}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc || 'Detalhes deste bloco serao apresentados pela organizacao no dia do simposio.'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-brand-cream p-4 text-brand-navy">
                      <BookOpenText className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-black text-brand-navy">Cronograma completo em breve</h3>
                      <p className="mt-2 max-w-2xl text-slate-600">
                        A grade academica definitiva ainda sera publicada. Assim que os horarios forem confirmados, esta secao exibira a ordem das palestras, oficinas e momentos de abertura.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-3xl font-bold text-brand-navy font-serif mb-6 flex items-center gap-3">
                <div className="w-8 h-1 bg-brand-gold"></div> Sobre o CETADMI
              </h2>
              <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm space-y-8">
                <div className="space-y-3">
                  <p className="text-lg leading-relaxed text-slate-600">{institutionalContent.fullName} atua na capacitacao e no aperfeicoamento de vocacionados, liderancas e alunos comprometidos com a formacao crista.</p>
                  <p className="text-sm leading-relaxed text-slate-500">{institutionalContent.doctrinalLine}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{institutionalContent.audience}</p>
                  <p className="text-sm font-semibold text-brand-navy">{institutionalContent.leadership}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {institutionalContent.stats.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-brand-cream px-5 py-5">
                      <p className="text-3xl font-black text-brand-navy">{item.value}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Formacao em destaque</p>
                  <p className="mt-3 text-sm font-semibold text-slate-600">Categoria principal: {institutionalContent.categoryHighlight}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">Disciplinas publicadas no ecossistema CETADMI: {institutionalContent.featuredCourses.join(', ')}.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Voltar ao portal</Link>
                    <a href="https://cetadmi.eadplataforma.app/courses" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:border-brand-navy hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">Explorar cursos</a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Registration Form (Sticky) */}
          <div id="inscricao" className="lg:col-span-5 relative">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-2xl md:p-12 lg:sticky lg:top-10 lg:rounded-[3rem]">
              
              {success ? (
                <div className="py-12 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-green-100">
                        <CheckCircle size={40} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl font-bold text-brand-navy font-serif leading-tight">Matrícula Registrada!</h3>
                        <div className="h-1 w-12 bg-brand-gold mx-auto rounded-full"></div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed px-4">
                        {hasValidOrganizationWhatsApp
                          ? 'Estamos redirecionando voce para o WhatsApp oficial para envio do comprovante e confirmacao final.'
                          : 'Sua inscricao foi registrada com sucesso. O WhatsApp oficial deste evento ainda nao foi configurado corretamente.'}
                    </p>
                    {hasValidOrganizationWhatsApp ? (
                      <div className="flex flex-col items-center gap-4 opacity-50 pt-4">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
                          <span className="text-[10px] font-black tracking-widest uppercase">Redirecionando...</span>
                      </div>
                    ) : (
                      <a href={eventService.buildWhatsAppUrl(institutionalContent.supportWhatsapp, `Olá! Minha inscrição no evento ${event.title} foi registrada e preciso enviar o comprovante.`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 rounded-full bg-brand-navy px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">
                        Falar com o suporte
                      </a>
                    )}
                </div>
              ) : (
                <>
                  <div className="text-center mb-10">
                    <h3 className="text-2xl font-bold text-brand-navy font-serif">Inscrição Acadêmica</h3>
                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-black">Preencha seus dados oficiais</p>
                    
                       <div className="mt-8 rounded-2xl bg-slate-50 px-4 py-4 text-left">
                        <div className="flex justify-between items-center gap-4">
                           <span className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Disponibilidade</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {registrationClosed ? 'Encerrada' : event.capacity ? `${event.capacity} vagas maximas` : 'Capacidade sob consulta'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          {registrationClosed
                            ? 'O prazo final desta turma foi encerrado.'
                            : 'A confirmacao da vaga depende do envio da inscricao e da validacao financeira da organizacao.'}
                        </p>
                     </div>

                     <div className="mt-4 grid gap-3 text-left md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                          <div className="flex items-center gap-3 text-brand-navy">
                            <WalletCards className="h-5 w-5" aria-hidden="true" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Investimento</span>
                          </div>
                          <p className="mt-3 text-lg font-black text-brand-navy">
                            {selectedOption ? formatPrice(selectedOption.price) : lowestPrice !== null ? `A partir de ${formatPrice(lowestPrice)}` : 'A confirmar'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                          <div className="flex items-center gap-3 text-brand-navy">
                            <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Atendimento</span>
                          </div>
                           <div className="mt-3 space-y-1 text-sm text-slate-600">
                             <p className="font-bold text-brand-navy break-words">{hasValidOrganizationWhatsApp ? event.whatsapp_number : institutionalContent.supportWhatsapp}</p>
                             <p className="break-words">{institutionalContent.supportEmail}</p>
                             <p>{institutionalContent.supportHours}</p>
                           </div>
                        </div>
                      </div>
                   </div>

                  <form className="space-y-6" onSubmit={handleRegister}>
                    {(validationError || error || registrationClosed || !hasPriceOptions) && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" aria-live="polite">
                        {validationError || error || (registrationClosed ? 'As inscricoes para este evento foram encerradas.' : 'Este evento ainda nao possui categorias de inscricao configuradas.')}
                      </div>
                    )}

                    {/* Categoria Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-[0.14em]">Categoria de Acesso</label>
                        <div className="grid gap-3" role="radiogroup" aria-label="Categoria de Acesso">
                            {event.price_options?.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedOption(opt)}
                                    role="radio"
                                    aria-checked={selectedOption?.id === opt.id}
                                    className={`w-full p-4 border-2 transition-all flex justify-between items-center rounded-2xl ${selectedOption?.id === opt.id ? 'bg-brand-navy text-white border-brand-navy shadow-lg shadow-brand-navy/10' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700'}`}
                                >
                                    <span className="font-bold text-xs uppercase tracking-tight">{opt.label}</span>
                                    <span className={`font-black text-sm ${selectedOption?.id === opt.id ? 'text-brand-gold' : 'text-brand-navy'}`}>
                                        {formatPrice(opt.price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="full_name" className="ml-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Nome Completo</label>
                      <input id="full_name" type="text" name="full_name" autoComplete="name" value={formData.full_name} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50" placeholder="Ex.: Ronaib Fernandes…" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="ml-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">WhatsApp</label>
                      <input id="phone" type="tel" name="phone" autoComplete="tel" inputMode="tel" value={formData.phone} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50" placeholder="(91) 98189-7040" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="ml-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">E-mail Academico</label>
                      <input id="email" type="email" name="email" autoComplete="email" spellCheck={false} value={formData.email} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50" placeholder="seu@email.com…" required />
                    </div>
                    
                      <button 
                         type="submit" 
                         disabled={!canSubmit}
                         className="group mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-navy py-6 text-lg font-black text-white shadow-xl transition-transform hover:bg-brand-navy-light active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                     >
                      {registering ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            CONCLUIR MATRÍCULA <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform text-brand-gold" />
                        </>
                      )}
                    </button>
                    <p className="mt-4 text-center text-xs italic font-medium leading-relaxed text-slate-400">
                      {hasValidOrganizationWhatsApp
                        ? 'Sua inscricao e processada de forma segura e requer confirmacao via WhatsApp.'
                        : 'Sua inscricao sera registrada e o suporte oficial do CETADMI fara o acompanhamento manual.'}
                    </p>
                    {event.pix_key && (
                      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-left text-sm text-brand-navy">
                        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-navy/60">Chave Pix para pagamento</span>
                        <span className="mt-2 block break-words font-bold">{event.pix_key}</span>
                      </div>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {!success && !registrationClosed && hasPriceOptions && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-navy/10 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3 pb-[env(safe-area-inset-bottom)]">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Inscricao</p>
              <p className="mt-1 truncate text-sm font-bold text-brand-navy">
                {selectedOption ? formatPrice(selectedOption.price) : lowestPrice !== null ? `A partir de ${formatPrice(lowestPrice)}` : 'Valores em breve'}
              </p>
            </div>
            <a href="#inscricao" className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-navy px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20">
              Garantir vaga
            </a>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white py-16 border-t border-slate-200 text-center relative overflow-hidden">
        <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-brand-gold bg-white shadow-[0_14px_35px_rgba(10,25,47,0.12)]">
              <img src="/logo-cetadmi.png" alt="Logo CETADMI" className="h-10 w-10 object-contain" />
            </div>
            <h4 className="text-xl font-serif font-black text-brand-navy tracking-widest uppercase mb-4">CETADMI</h4>
            <p className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-slate-500">{institutionalContent.mission}</p>
            <div className="mb-8 grid gap-3 text-sm text-slate-500 sm:grid-cols-3 sm:text-left">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">WhatsApp</p>
                <p className="mt-2 font-semibold text-brand-navy break-words">{institutionalContent.supportWhatsapp}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">E-mail</p>
                <p className="mt-2 font-semibold text-brand-navy break-words">{institutionalContent.supportEmail}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Atendimento</p>
                <p className="mt-2 font-semibold text-brand-navy">{institutionalContent.supportHours}</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mb-8">
                <span className="w-4 h-1 bg-brand-gold rounded-full"></span>
                <span className="w-4 h-1 bg-brand-navy rounded-full"></span>
                <span className="w-4 h-1 bg-brand-gold rounded-full"></span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black italic">
                &copy; 1994 - {new Date().getFullYear()} {institutionalContent.legacyName}.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default EventPage;
