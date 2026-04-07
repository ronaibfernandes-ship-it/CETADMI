import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, MapPin, Users, CheckCircle2, MessageSquare, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { eventService } from '../../services/eventService'

const EventPage = () => {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Registration Form State
  const [selectedOption, setSelectedOption] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    church_name: '',
    city: '',
    state: ''
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventService.getEventBySlug(slug)
        if (!data || !data.is_published) throw new Error('Este evento acadêmico não está disponível para inscrições públicas no momento.')
        setEvent(data)
        if (data.price_options?.length > 0) {
          setSelectedOption(data.price_options[0])
        }
      } catch (err) {
        setError(err.message || 'Erro ao carregar os dados do evento.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [slug])

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    // Validação extra por segurança
    if (!selectedOption) return alert('Selecione uma categoria de inscrição para prosseguir.')
    if (!formData.full_name || !formData.phone || !formData.email) return alert('Por favor, preencha todos os campos obrigatórios.')
    
    setRegistering(true)
    setError(null)

    try {
      const registrationPayload = {
        event_id: event.id,
        ...formData,
        selected_price_id: selectedOption.id,
        selected_price_label: selectedOption.label,
        amount_due: selectedOption.price,
        amount_paid: 0,
        pricing_snapshot: selectedOption,
      }

      // 1. Criar inscrição no banco (Snapshot Capturado)
      await eventService.createRegistration(registrationPayload)
      
      // 2. Definir sucesso (renderiza mensagem de redirect)
      setSuccess(true)

      // 3. Preparar link de WhatsApp sanitizado
      const sanitizedPhone = eventService.sanitizeWhatsAppNumber(event.whatsapp_number);
      const whatsappMsg = `Olá! Concluí minha matrícula no evento *${event.title}* via portal administrativo.\n\n` +
                          `*DADOS DA MATRÍCULA:* \n` +
                          `- Aluno: ${formData.full_name}\n` +
                          `- Categoria: ${selectedOption.label}\n` +
                          `- Investimento: R$ ${selectedOption.price.toFixed(2)}\n\n` +
                          `Estarei enviando o comprovante do PIX por aqui para confirmação definitiva da minha vaga.`;
      
      const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(whatsappMsg)}`;
      
      // 4. Redirect com delay para leitura institucional
      setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 2500);

    } catch (err) {
      setError('Falha ao processar sua matrícula. Verifique sua conexão e tente novamente.')
      console.error(err)
      setRegistering(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-cetadmi-cream flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-cetadmi-navy animate-spin" />
    </div>
  )

  if (error || !event) return (
    <div className="min-h-screen bg-cetadmi-cream flex items-center justify-center p-6 text-center">
      <div className="brutalist-card max-w-md bg-white border-cetadmi-red shadow-[8px_8px_0px_0px_theme(colors.cetadmi.red)]">
        <h2 className="text-3xl font-serif font-black text-cetadmi-red mb-4 tracking-tighter uppercase leading-none">Acesso Não Autorizado</h2>
        <p className="text-cetadmi-navy font-black uppercase text-[10px] tracking-[0.2em] opacity-60 px-4">{error || 'Evento não localizado ou fora do prazo.'}</p>
        <a href="/" className="mt-8 inline-block brutalist-button bg-cetadmi-navy text-cetadmi-cream font-black text-xs px-10 py-4">VOLTAR PARA CAPA</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cetadmi-cream text-cetadmi-navy selection:bg-cetadmi-navy selection:text-cetadmi-cream">
      {/* Hero Section Institucional */}
      <section className="relative pt-24 pb-48 px-6 border-b-4 border-cetadmi-navy bg-white overflow-hidden">
        {/* Marca d'água institucional */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
          <img src="/logo-cetadmi.png" alt="" className="w-[800px] h-[800px] object-contain" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-12 translate-y-[-20px]">
            <img src="/logo-cetadmi.png" alt="CETADMI" className="w-48 h-48 object-contain drop-shadow-xl" />
          </div>
          
          <div className="inline-block px-6 py-2 brutalist-border bg-cetadmi-navy text-cetadmi-cream text-[11px] font-black uppercase tracking-[0.4em] mb-8">
            Convocação Acadêmico-Teológica
          </div>
          
          <h1 className="text-5xl md:text-8xl font-serif font-black mb-8 leading-none tracking-tighter uppercase">
            {event.title}
          </h1>
          
          {event.subtitle && (
             <p className="text-xl md:text-2xl font-serif italic text-cetadmi-navy/60 mb-10 max-w-3xl mx-auto leading-relaxed border-l-4 border-cetadmi-red pl-6 py-2 text-left md:text-center md:border-l-0 md:pl-0">
               {event.subtitle}
             </p>
          )}

          <div className="flex flex-wrap justify-center gap-12 text-xs font-black uppercase tracking-[0.3em] text-cetadmi-navy pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-cetadmi-red" />
              <div className="text-left">
                 <div className="opacity-40">Data do Evento</div>
                 {new Date(event.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="w-8 h-8 text-cetadmi-red" />
               <div className="text-left">
                  <div className="opacity-40">Sede / Local</div>
                  {event.location}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 md:p-16 -mt-24 relative z-20">
        
        {/* Coluna de Conteúdo Descritivo */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-12 order-2 xl:order-1">
          <article className="brutalist-card bg-white relative p-10 md:p-12">
            <div className="bg-cetadmi-navy text-cetadmi-cream absolute -top-5 left-10 px-6 py-2 text-[11px] font-black uppercase tracking-[0.3em] brutalist-border shadow-[4px_4px_0px_0px_theme(colors.cetadmi.red)]">
              EMENTA OFICIAL
            </div>
            <div className="text-xl font-medium leading-relaxed whitespace-pre-wrap pt-6 text-cetadmi-navy/90 prose prose-navy max-w-none font-serif italic">
              {event.description || 'Os detalhes acadêmicos para este evento estão sendo finalizados pela reitoria.'}
            </div>
          </article>

          {/* Badges de Garantia Institucional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "Certificação com Selo Institucional CETADMI",
              "Material Teológico de Apoio Incluso",
              "Direito a Voto em Comitês de Debate",
              "Acesso ao Campus Digital Pós-Evento"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-5 p-6 brutalist-border bg-white shadow-[6px_6px_0px_0px_theme(colors.cetadmi.navy)] group hover:shadow-[6px_6px_0px_0px_theme(colors.cetadmi.red)] transition-all">
                <div className="w-10 h-10 bg-cetadmi-navy/5 flex items-center justify-center brutalist-border shrink-0">
                   <CheckCircle2 className="w-6 h-6 text-cetadmi-blue group-hover:text-cetadmi-red transition-colors" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest leading-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar de Inscrição (Brutalista Profissional) */}
        <aside className="lg:col-span-12 xl:col-span-5 order-1 xl:order-2">
          <div className="sticky top-8 brutalist-card bg-white shadow-[20px_20px_0px_0px_theme(colors.cetadmi.navy)] p-10">
            
            {success ? (
              <div className="py-16 text-center space-y-10 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-50 flex items-center justify-center mx-auto brutalist-border border-green-700 shadow-[6px_6px_0px_0px_#15803d]">
                  <CheckCircle2 className="w-14 h-14 text-green-700" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-serif font-black text-cetadmi-navy uppercase tracking-tighter leading-none">Matrícula Registrada</h3>
                  <div className="h-1.5 w-20 bg-cetadmi-red mx-auto" />
                </div>
                <p className="font-black text-[11px] uppercase tracking-[0.2em] text-cetadmi-navy/60 px-6 leading-loose">
                  Estamos redirecionando você para o WhatsApp oficial do Colegiado para conclusão definitiva e envio do comprovante PIX.
                </p>
                <div className="flex flex-col items-center gap-4 opacity-50">
                   <Loader2 className="w-8 h-8 animate-spin text-cetadmi-navy" />
                   <span className="text-[9px] font-black tracking-widest uppercase">Redirecionamento em curso...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-12 border-b-4 border-cetadmi-navy/10 pb-10 -mx-10">
                  <h3 className="text-4xl font-serif font-black text-cetadmi-navy mb-4 tracking-tighter uppercase leading-none">Matrícula</h3>
                  <div className="flex justify-center gap-2">
                     <span className="w-3 h-3 bg-cetadmi-red brutalist-border"></span>
                     <span className="w-3 h-3 bg-cetadmi-blue brutalist-border"></span>
                     <span className="w-3 h-3 bg-cetadmi-navy brutalist-border"></span>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-8">
                  {error && (
                    <div className="bg-cetadmi-red/10 border-l-8 border-cetadmi-red p-6 flex items-center gap-4 animate-in slide-in-from-left duration-300">
                      <AlertCircle className="w-8 h-8 text-cetadmi-red shrink-0" />
                      <p className="text-[10px] text-cetadmi-red font-black uppercase tracking-[0.2em] leading-relaxed">{error}</p>
                    </div>
                  )}

                  {/* Seleção de Preço (Hardening UX) */}
                  <div className="space-y-5">
                    <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-cetadmi-navy shadow-sm inline-block border-b-2 border-cetadmi-red mb-2">Categoria de Acesso</label>
                    <div className="grid grid-cols-1 gap-4">
                      {event.price_options?.map((opt) => (
                        <button 
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedOption(opt)}
                          className={`w-full p-5 brutalist-border transition-all flex justify-between items-center group relative overflow-hidden ${selectedOption?.id === opt.id ? 'bg-cetadmi-navy text-cetadmi-cream border-cetadmi-navy shadow-[6px_6px_0px_0px_theme(colors.cetadmi.red)] translate-x-1 translate-y-1' : 'bg-white border-cetadmi-navy hover:bg-cetadmi-cream/50'}`}
                        >
                          <span className="font-black text-xs uppercase tracking-widest z-10">{opt.label}</span>
                          <span className={`text-xl font-serif font-black z-10 ${selectedOption?.id === opt.id ? 'text-cetadmi-cream' : 'text-cetadmi-blue'}`}>
                            R$ {opt.price.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dados Cadastrais (Hardening: Required + HTML5) */}
                  <div className="space-y-6 pt-6 border-t-2 border-cetadmi-navy/5">
                     <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/50">Nome Completo do Aluno</label>
                        <input type="text" name="full_name" required value={formData.full_name} onChange={handleInputChange} className="w-full brutalist-border bg-cetadmi-cream/10 p-5 text-sm font-black focus:outline-none focus:bg-white placeholder:opacity-30 uppercase tracking-widest" placeholder="NOME CIVIL COMPLETO" />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/50">WhatsApp / Celular</label>
                           <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full brutalist-border bg-cetadmi-cream/10 p-5 text-sm font-black focus:outline-none focus:bg-white placeholder:opacity-30" placeholder="(00) 00000-0000" />
                        </div>
                        <div className="space-y-3">
                           <label className="block text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/50">E-mail Acadêmico</label>
                           <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full brutalist-border bg-cetadmi-cream/10 p-5 text-sm font-black focus:outline-none focus:bg-white placeholder:opacity-30" placeholder="exemplo@servidor.com" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/50">Igreja / Instituição de Ensino</label>
                        <input type="text" name="church_name" value={formData.church_name} onChange={handleInputChange} className="w-full brutalist-border bg-cetadmi-cream/10 p-5 text-sm font-black focus:outline-none focus:bg-white placeholder:opacity-30 uppercase truncate" placeholder="ONDE CONGREGA OU TRABALHA" />
                     </div>
                  </div>

                  <div className="pt-10">
                    <button 
                      type="submit" 
                      disabled={registering}
                      className="w-full brutalist-button py-8 text-2xl font-black flex items-center justify-center gap-4 shadow-[10px_10px_0px_0px_theme(colors.cetadmi.red)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 group"
                    >
                      {registering ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                        <>
                          RESERVAR VAGA
                          <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                    <p className="text-center mt-10 text-[9px] font-black uppercase tracking-[0.3em] text-cetadmi-navy/30 leading-loose px-6">
                      Ao prosseguir, você reserva sua vaga por 24 horas.<br/>
                      A confirmação exige o envio do PIX via WhatsApp.
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* Footer Público (Brutalismo Reforçado) */}
      <footer className="bg-cetadmi-navy text-cetadmi-cream py-32 px-10 border-t-8 border-cetadmi-red relative overflow-hidden mt-32">
        {/* Marca d'água footer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
          <img src="/logo-cetadmi.png" alt="" className="w-[1000px] h-[1000px] object-contain brightness-0 invert" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-16 relative z-10">
          <div className="space-y-8 text-left">
            <img src="/logo-cetadmi.png" alt="CETADMI" className="w-40 h-40 object-contain brightness-0 invert opacity-20" />
            <div className="space-y-2">
               <h4 className="text-5xl font-serif font-black tracking-tighter uppercase">CETADMI</h4>
               <p className="text-[11px] font-black max-w-sm uppercase tracking-[0.4em] leading-relaxed opacity-50">
                 Centro Educacional Teológico da Assembleia de Deus de Missões.<br/>
                 Fundação Acadêmica 1994.
               </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="text-[11px] font-black uppercase tracking-[0.5em] text-cetadmi-cream/30 border-b border-white/10 pb-4">
              Conselho Superior de Educação
            </div>
            <div className="flex gap-4">
               <span className="w-8 h-8 brutalist-border border-white/20 bg-white/5"></span>
               <span className="w-8 h-8 brutalist-border border-white/20 bg-cetadmi-red"></span>
               <span className="w-8 h-8 brutalist-border border-white/20 bg-cetadmi-blue"></span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">
              &copy; {new Date().getFullYear()} CETADMI — Excelência Acadêmica Teológica.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default EventPage
