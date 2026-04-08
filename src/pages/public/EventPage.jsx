import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, ArrowRight, Loader2, AlertCircle, ImageOff, Mic2, BookOpenText, ShieldCheck, WalletCards, MessageCircleHeart } from 'lucide-react';
import { eventService } from '../../services/eventService';

const EventPage = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState(null);

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
        const data = await eventService.getEventBySlug(slug);
        if (!data || !data.is_published) throw new Error('Este evento acadêmico não está disponível para inscrições públicas no momento.');
        setEvent(data);
        if (data.price_options?.length > 0) {
          setSelectedOption(data.price_options[0]);
        }
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
    
    setRegistering(true);
    setError(null);
    setValidationError(null);

    try {
      const registrationPayload = {
        event_id: event.id,
        ...formData,
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
                          `- Aluno: ${formData.full_name}\n` +
                          `- Categoria: ${selectedOption.label}\n` +
                          `- Investimento: R$ ${selectedOption.price.toFixed(2)}\n\n` +
                          `Estarei enviando o comprovante do PIX por aqui para confirmação definitiva da minha vaga.`;
      
      const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(whatsappMsg)}`;
      
      // 4. Redirect com delay
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 2500);

    } catch (err) {
      setError(eventService.mapRegistrationError(err));
      setRegistering(false);
    }
  };

  const registrationClosed = event?.registration_deadline && new Date(event.registration_deadline) < new Date();
  const hasPriceOptions = (event?.price_options?.length || 0) > 0;
  const canSubmit = !registering && !registrationClosed && hasPriceOptions;
  const hasBanner = Boolean(event?.banner_url);
  const eventDateLabel = event?.event_date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(event.event_date))
    : 'Data a confirmar';
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
      <section className="relative overflow-hidden bg-brand-navy text-white">
        {hasBanner ? (
          <>
            <img
              src={event.banner_url}
              alt={`Banner do evento ${event.title}`}
              className="absolute inset-0 h-full w-full object-cover"
              width="1600"
              height="900"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-brand-navy/75" />
            <div className="absolute inset-y-0 right-0 w-1/3 bg-brand-gold/10 backdrop-blur-[2px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-brand-navy" />
            <div className="absolute top-0 right-0 h-full w-1/2 bg-brand-gold/10 skew-x-[-12deg] translate-x-24" />
          </>
        )}

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-end lg:px-10 lg:py-24">
          <div className="max-w-4xl">
            <span className="mb-5 inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-brand-gold backdrop-blur-sm">
              {registrationClosed ? 'Inscricoes Encerradas' : 'Inscricoes Abertas'}
            </span>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.95] text-white md:text-7xl text-balance">
              {event.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl italic leading-relaxed text-white/80 md:text-2xl">
              {event.subtitle || 'Formacao biblica, teologica e pedagogica para uma Escola Dominical forte, fiel e relevante.'}
            </p>

            <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <Calendar size={18} className="text-brand-gold" aria-hidden="true" />
                {eventDateLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <MapPin size={18} className="text-brand-gold" aria-hidden="true" />
                {event.location || 'Sede Central CETADMI'}
              </span>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <a href="#inscricao" className="inline-flex items-center gap-3 rounded-full bg-brand-gold px-10 py-5 text-lg font-black uppercase tracking-tight text-brand-navy shadow-xl transition-transform hover:scale-[1.02] hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy">
                Garantir minha vaga agora <ArrowRight size={22} aria-hidden="true" />
              </a>
              <div className="text-sm font-medium text-white/70">
                {lowestPrice !== null ? `A partir de R$ ${lowestPrice.toFixed(2)}` : 'Valores em breve'}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-2xl lg:p-8">
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
                <span className="text-right font-semibold">{lowestPrice !== null ? `A partir de R$ ${lowestPrice.toFixed(2)}` : 'A confirmar'}</span>
              </div>
              <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-brand-gold">
                O formulario de inscricao completa e a confirmacao financeira ficam logo abaixo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-20">
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
                        <span className="inline-flex rounded-full bg-brand-cream px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-brand-navy">
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
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold/70">Horario</div>
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
          </div>

          {/* RIGHT COLUMN: Registration Form (Sticky) */}
          <div id="inscricao" className="lg:col-span-5 relative">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 sticky top-10">
              
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
                        {event.whatsapp_number
                          ? 'Estamos redirecionando voce para o WhatsApp oficial para envio do comprovante e confirmacao final.'
                          : 'Sua inscricao foi registrada com sucesso. O WhatsApp oficial deste evento ainda nao foi configurado.'}
                    </p>
                    {event.whatsapp_number && (
                      <div className="flex flex-col items-center gap-4 opacity-50 pt-4">
                          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
                          <span className="text-[10px] font-black tracking-widest uppercase">Redirecionando...</span>
                      </div>
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
                           {selectedOption ? `R$ ${Number(selectedOption.price).toFixed(2)}` : lowestPrice !== null ? `A partir de R$ ${lowestPrice.toFixed(2)}` : 'A confirmar'}
                         </p>
                       </div>
                       <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                         <div className="flex items-center gap-3 text-brand-navy">
                           <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
                           <span className="text-[10px] font-black uppercase tracking-[0.25em]">Atendimento</span>
                         </div>
                         <p className="mt-3 text-sm font-bold text-brand-navy break-words">{event.whatsapp_number || 'WhatsApp em configuracao'}</p>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria de Acesso</label>
                        <div className="grid gap-3">
                            {event.price_options?.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedOption(opt)}
                                    className={`w-full p-4 border-2 transition-all flex justify-between items-center rounded-2xl ${selectedOption?.id === opt.id ? 'bg-brand-navy text-white border-brand-navy shadow-lg shadow-brand-navy/10' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-700'}`}
                                >
                                    <span className="font-bold text-xs uppercase tracking-tight">{opt.label}</span>
                                    <span className={`font-black text-sm ${selectedOption?.id === opt.id ? 'text-brand-gold' : 'text-brand-navy'}`}>
                                        R$ {opt.price.toFixed(2)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                      <input type="text" name="full_name" autoComplete="name" value={formData.full_name} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-sm uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50" placeholder="Ex.: Ronaib Fernandes…" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                      <input type="tel" name="phone" autoComplete="tel" inputMode="tel" value={formData.phone} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50" placeholder="(00) 00000-0000…" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Acadêmico</label>
                      <input type="email" name="email" autoComplete="email" spellCheck={false} value={formData.email} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50" placeholder="seu@email.com…" required />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!canSubmit}
                        className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-navy py-6 text-lg font-black text-white shadow-xl transition-transform hover:bg-brand-navy-light active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                    >
                      {registering ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            CONCLUIR MATRÍCULA <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform text-brand-gold" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 italic font-medium leading-relaxed">
                      {event.whatsapp_number
                        ? 'Sua inscricao e processada de forma segura e requer confirmacao via WhatsApp.'
                        : 'Sua inscricao sera registrada, mas o WhatsApp oficial do evento ainda nao foi configurado.'}
                    </p>
                    {event.pix_key && (
                      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-left text-sm text-brand-navy">
                        <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-brand-navy/60">Chave Pix para pagamento</span>
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

      {/* FOOTER */}
      <footer className="bg-white py-16 border-t border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
           <img src="/logo-cetadmi.png" alt="" className="w-96 h-96 object-contain" />
        </div>
        <div className="relative z-10">
            <img src="/logo-cetadmi.png" alt="Logo" className="w-16 h-16 mx-auto mb-6 opacity-30 grayscale" />
            <h4 className="text-xl font-serif font-black text-brand-navy tracking-widest uppercase mb-4">CETADMI</h4>
            <div className="flex justify-center gap-4 mb-8">
                <span className="w-4 h-1 bg-brand-gold rounded-full"></span>
                <span className="w-4 h-1 bg-brand-navy rounded-full"></span>
                <span className="w-4 h-1 bg-brand-gold rounded-full"></span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black italic">
                &copy; 1994 - {new Date().getFullYear()} Colégio Teológico CETADMI — Excelência e Verdade.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default EventPage;
