import React, { useState, useEffect } from 'react'
import { X, Save, Upload, Plus, Trash2, Loader2, AlertCircle, Mic2, Clock3, Sparkles } from 'lucide-react'
import { eventService } from '../../services/eventService'

const toLocalDateTimeInput = (value) => {
  if (!value) return ''

  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

const createEmptyFormData = () => ({
  title: '',
  subtitle: '',
  slug: '',
  event_date: '',
  registration_deadline: '',
  location: '',
  description: '',
  banner_url: '',
  capacity: '',
  pix_key: '',
  whatsapp_number: '',
  is_published: true,
  price_options: [],
  speakers: [],
  program: []
})

const createSpeaker = () => ({ id: crypto.randomUUID(), name: '', role: '', image: '' })
const createProgramItem = () => ({ id: crypto.randomUUID(), time: '', title: '', desc: '' })

const premiumSymposiumTemplate = {
  subtitle: 'Formacao biblica, teologica e pedagogica para professores e lideres da Escola Biblica Dominical',
  location: 'Sede Estadual',
  description: `O 6º Simposio da EBD e um encontro especial de formacao biblica, teologica e pedagogica voltado para professores, lideres, superintendentes e alunos da Escola Biblica Dominical.

Durante esta edicao, teremos exposicoes da Palavra de Deus, orientacoes praticas para o ensino cristao, comunhao entre obreiros e momentos de fortalecimento espiritual.

Nosso proposito e capacitar homens e mulheres para servirem com excelencia no ministerio de ensino, preservando a sa doutrina e fortalecendo a missao da EBD na igreja local.`,
  whatsapp_number: '5511999999999',
  speakers: [
    {
      id: crypto.randomUUID(),
      name: 'Pr. Douglas Baptista',
      role: 'Pastor, doutor em Teologia Sistematica, escritor e conferencista da CPAD',
      image: 'https://www.cpadnews.com.br/wp-content/uploads/2022/03/prdouglas.jpg',
    },
    {
      id: crypto.randomUUID(),
      name: 'Pra. Marta Ribeiro',
      role: 'Educadora crista e coordenadora de formacao biblica',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    },
  ],
  program: [
    {
      id: crypto.randomUUID(),
      time: '08:00',
      title: 'Abertura e Devocional',
      desc: 'Momento de recepcao, oracao inicial e apresentacao oficial do simposio.',
    },
    {
      id: crypto.randomUUID(),
      time: '09:00',
      title: 'Painel Principal: A Santissima Trindade',
      desc: 'Exposicao biblica e teologica sobre a doutrina da Trindade e sua relevancia para a fe crista.',
    },
    {
      id: crypto.randomUUID(),
      time: '11:00',
      title: 'Oficina para Professores da EBD',
      desc: 'Aplicacoes praticas para preparar aulas, ensinar com clareza e fortalecer a aprendizagem biblica.',
    },
    {
      id: crypto.randomUUID(),
      time: '14:00',
      title: 'Mesa Redonda Ministerial',
      desc: 'Dialogo sobre desafios atuais da Escola Biblica Dominical e caminhos para crescimento saudavel.',
    },
    {
      id: crypto.randomUUID(),
      time: '16:00',
      title: 'Encerramento e Oracao Final',
      desc: 'Conclusao oficial com direcionamento espiritual e comissionamento dos participantes.',
    },
  ],
}

const EventForm = ({ event, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form State (Official Schema Block 4)
  const [formData, setFormData] = useState(createEmptyFormData())

  useEffect(() => {
    if (event) {
      setFormData({
        ...createEmptyFormData(),
        title: event.title || '',
        subtitle: event.subtitle || '',
        slug: event.slug || '',
        event_date: toLocalDateTimeInput(event.event_date),
        registration_deadline: toLocalDateTimeInput(event.registration_deadline),
        location: event.location || '',
        description: event.description || '',
        banner_url: event.banner_url || '',
        capacity: event.capacity || '',
        pix_key: event.pix_key || '',
        whatsapp_number: event.whatsapp_number || '',
        is_published: event.is_published ?? true,
        price_options: event.price_options || [],
        speakers: event.speakers || [],
        program: event.program || []
      })
    } else {
      setFormData(createEmptyFormData())
    }
  }, [event])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setLoading(true)
    setError(null)
    try {
      const url = await eventService.uploadEventBanner(file)
      setFormData(prev => ({ ...prev, banner_url: url }))
    } catch (err) {
      setError(eventService.mapBannerUploadError(err))
    } finally {
      setLoading(false)
    }
  }

  // Price Options Management
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      price_options: [...prev.price_options, { id: Math.random().toString(36).substring(2), label: '', price: 0 }]
    }))
  }

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      price_options: prev.price_options.filter((_, i) => i !== index)
    }))
  }

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.price_options]
    newOptions[index][field] = field === 'price' ? parseFloat(value) || 0 : value
    setFormData(prev => ({ ...prev, price_options: newOptions }))
  }

  const addSpeaker = () => {
    setFormData((prev) => ({
      ...prev,
      speakers: [...prev.speakers, createSpeaker()],
    }))
  }

  const updateSpeaker = (index, field, value) => {
    const nextSpeakers = [...formData.speakers]
    nextSpeakers[index][field] = value
    setFormData((prev) => ({ ...prev, speakers: nextSpeakers }))
  }

  const removeSpeaker = (index) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const addProgramItem = () => {
    setFormData((prev) => ({
      ...prev,
      program: [...prev.program, createProgramItem()],
    }))
  }

  const updateProgramItem = (index, field, value) => {
    const nextProgram = [...formData.program]
    nextProgram[index][field] = value
    setFormData((prev) => ({ ...prev, program: nextProgram }))
  }

  const removeProgramItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      program: prev.program.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const applyPremiumTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      subtitle: prev.subtitle || premiumSymposiumTemplate.subtitle,
      location: prev.location || premiumSymposiumTemplate.location,
      description: prev.description || premiumSymposiumTemplate.description,
      whatsapp_number: prev.whatsapp_number || premiumSymposiumTemplate.whatsapp_number,
      speakers: prev.speakers.length > 0 ? prev.speakers : premiumSymposiumTemplate.speakers,
      program: prev.program.length > 0 ? prev.program : premiumSymposiumTemplate.program,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        capacity: formData.capacity === '' ? null : parseInt(formData.capacity),
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null
      }

      if (event?.id) {
        await eventService.updateEvent(event.id, payload)
      } else {
        await eventService.createEvent(payload)
      }
      
      onClose(true)
    } catch (err) {
      setError(err.message || 'Erro ao salvar evento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-cetadmi-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cetadmi-cream w-full max-w-4xl brutalist-border shadow-[12px_12px_0px_0px_theme(colors.cetadmi.red)] my-auto">
        {/* Modal Header */}
        <div className="bg-cetadmi-navy text-cetadmi-cream p-6 flex justify-between items-center border-b-2 border-cetadmi-navy">
          <h2 className="text-3xl font-serif font-bold tracking-tight">
            {event ? 'EDITAR EVENTO' : 'NOVO EVENTO ACADÊMICO'}
          </h2>
          <button aria-label="Fechar formulario" onClick={() => onClose()} className="p-2 transition-colors hover:bg-cetadmi-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-cetadmi-red/10 border-l-4 border-cetadmi-red p-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-cetadmi-red" />
              <p className="text-cetadmi-red font-bold uppercase text-xs tracking-widest">{error}</p>
            </div>
          )}

          <div className="rounded-[1.75rem] border border-cetadmi-navy/10 bg-cetadmi-navy/5 px-5 py-4 text-cetadmi-navy">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Preenchimento Premium Assistido</h3>
                <p className="mt-1 text-xs text-cetadmi-navy/60">Aplica um modelo profissional para o 6º Simposio da EBD com descricao, palestrantes e cronograma.</p>
              </div>
              <button
                type="button"
                onClick={applyPremiumTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cetadmi-navy px-4 py-3 text-[10px] font-black uppercase tracking-widest text-cetadmi-cream transition-colors hover:bg-cetadmi-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Aplicar Exemplo Premium
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-cetadmi-navy">
            {/* Coluna Esquerda: Dados Básicos */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">Título do Evento</label>
                <input 
                  type="text" name="title" required value={formData.title} onChange={handleChange}
                  className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">Subtítulo (Opcional)</label>
                <input 
                  type="text" name="subtitle" value={formData.subtitle} onChange={handleChange}
                  className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Slug (URL)</label>
                  <input 
                     type="text" name="slug" required value={formData.slug} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                     placeholder="ex: congresso-2024"
                   />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Data do Evento</label>
                  <input 
                     type="datetime-local" name="event_date" required value={formData.event_date} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Localização</label>
                  <input 
                     type="text" name="location" value={formData.location} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                   />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Prazo Limite Inscrição</label>
                  <input 
                     type="datetime-local" name="registration_deadline" value={formData.registration_deadline} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">WhatsApp (Organização)</label>
                  <input 
                     type="text" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                     placeholder="5511999999999"
                   />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Chave PIX (Pagamentos)</label>
                  <input 
                     type="text" name="pix_key" value={formData.pix_key} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">Descrição Oficial</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={7}
                  placeholder="Descreva objetivos, publico, enfase espiritual e o que o participante pode esperar do evento..."
                  className="w-full resize-y bg-white border-2 border-cetadmi-navy p-3 text-sm font-medium leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                />
              </div>
            </div>

            {/* Coluna Direita: Media e Preços */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">Banner do Evento</label>
                <div className="brutalist-border bg-white p-4 text-center cursor-pointer relative group h-48 flex items-center justify-center overflow-hidden">
                  {formData.banner_url ? (
                    <>
                      <img src={formData.banner_url} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-cetadmi-navy/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-cetadmi-cream font-bold text-xs">
                        ALTERAR IMAGEM
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-cetadmi-navy/30" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/50">Carregar Banner</span>
                    </div>
                  )}
                  <input 
                    type="file" accept="image/*" onChange={handleBannerUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Categorias de Preço */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Categorias de Inscrição</label>
                  <button 
                    type="button" onClick={addOption}
                    className="text-[10px] font-black bg-cetadmi-navy text-cetadmi-cream px-2 py-1 hover:bg-cetadmi-blue transition-colors"
                  >
                    + ADICIONAR
                  </button>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.price_options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input 
                         type="text" value={opt.label} placeholder="Categoria (ex: Individual)"
                         onChange={(e) => updateOption(idx, 'label', e.target.value)}
                        className="flex-grow bg-white border-2 border-cetadmi-navy p-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                       />
                       <input 
                         type="number" value={opt.price} placeholder="R$"
                         onChange={(e) => updateOption(idx, 'price', e.target.value)}
                        className="w-24 bg-white border-2 border-cetadmi-navy p-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                       />
                       <button 
                         aria-label={`Remover categoria ${opt.label || idx + 1}`}
                         type="button" onClick={() => removeOption(idx)}
                        className="p-2 text-cetadmi-red transition-colors hover:bg-cetadmi-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20"
                       >
                         <Trash2 className="w-4 h-4" aria-hidden="true" />
                       </button>
                    </div>
                  ))}
                  {formData.price_options.length === 0 && (
                    <p className="text-[10px] text-cetadmi-navy/40 italic font-bold uppercase">Nenhuma categoria definida.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="space-y-2 flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Capacidade Máxima</label>
                  <input 
                     type="number" name="capacity" value={formData.capacity} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                     placeholder="Ilimitado"
                   />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input 
                    type="checkbox" name="is_published" id="is_published" 
                    checked={formData.is_published} onChange={handleChange}
                    className="w-5 h-5 border-2 border-cetadmi-navy accent-cetadmi-navy cursor-pointer"
                  />
                  <label htmlFor="is_published" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Publicar Evento</label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border-t-2 border-cetadmi-navy/10 pt-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mic2 className="w-5 h-5 text-cetadmi-navy" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Palestrantes</h3>
                    <p className="text-xs text-cetadmi-navy/50">Preencha os nomes reais para valorizar a pagina publica.</p>
                  </div>
                </div>
                <button type="button" onClick={addSpeaker} className="text-[10px] font-black bg-cetadmi-navy text-cetadmi-cream px-3 py-2 hover:bg-cetadmi-blue transition-colors">
                  + Adicionar
                </button>
              </div>

              <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-2 custom-scrollbar">
                {formData.speakers.map((speaker, index) => (
                  <div key={speaker.id || index} className="rounded-[1.5rem] border-2 border-cetadmi-navy bg-white p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                        placeholder="Nome do palestrante"
                        className="bg-white border-2 border-cetadmi-navy p-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                      />
                      <input
                        type="text"
                        value={speaker.role}
                        onChange={(e) => updateSpeaker(index, 'role', e.target.value)}
                        placeholder="Cargo, ministerio ou especialidade"
                        className="bg-white border-2 border-cetadmi-navy p-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                      />
                      <button
                        type="button"
                        aria-label={`Remover palestrante ${speaker.name || index + 1}`}
                        onClick={() => removeSpeaker(index)}
                        className="p-3 text-cetadmi-red transition-colors hover:bg-cetadmi-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={speaker.image}
                      onChange={(e) => updateSpeaker(index, 'image', e.target.value)}
                      placeholder="URL opcional da foto do palestrante"
                      className="w-full bg-white border-2 border-cetadmi-navy p-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                    />
                  </div>
                ))}
                {formData.speakers.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-cetadmi-navy/20 bg-white/60 p-6 text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/40">
                    Nenhum palestrante cadastrado ainda.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Clock3 className="w-5 h-5 text-cetadmi-navy" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Cronograma</h3>
                    <p className="text-xs text-cetadmi-navy/50">Monte a sequencia oficial de horarios e momentos.</p>
                  </div>
                </div>
                <button type="button" onClick={addProgramItem} className="text-[10px] font-black bg-cetadmi-navy text-cetadmi-cream px-3 py-2 hover:bg-cetadmi-blue transition-colors">
                  + Adicionar
                </button>
              </div>

              <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-2 custom-scrollbar">
                {formData.program.map((item, index) => (
                  <div key={item.id || index} className="rounded-[1.5rem] border-2 border-cetadmi-navy bg-white p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-[110px_1fr_auto] gap-3 items-start">
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => updateProgramItem(index, 'time', e.target.value)}
                        placeholder="08:00"
                        className="bg-white border-2 border-cetadmi-navy p-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateProgramItem(index, 'title', e.target.value)}
                        placeholder="Titulo do momento"
                        className="bg-white border-2 border-cetadmi-navy p-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                      />
                      <button
                        type="button"
                        aria-label={`Remover item do cronograma ${item.title || index + 1}`}
                        onClick={() => removeProgramItem(index)}
                        className="p-3 text-cetadmi-red transition-colors hover:bg-cetadmi-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <textarea
                      value={item.desc}
                      onChange={(e) => updateProgramItem(index, 'desc', e.target.value)}
                      rows={3}
                      placeholder="Descreva brevemente o que acontece neste horario"
                      className="w-full resize-y bg-white border-2 border-cetadmi-navy p-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/30"
                    />
                  </div>
                ))}
                {formData.program.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-cetadmi-navy/20 bg-white/60 p-6 text-[10px] font-black uppercase tracking-widest text-cetadmi-navy/40">
                    Nenhum horario cadastrado ainda.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t-2 border-cetadmi-navy/10">
            <button 
              type="button" onClick={() => onClose()}
              className="px-8 py-4 font-black uppercase tracking-widest text-[10px] hover:underline"
            >
              Descartar
            </button>
            <button 
              type="submit" disabled={loading}
              className="brutalist-button px-12 py-4 text-xl flex items-center justify-center gap-3 min-w-[200px]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {event ? 'ATUALIZAR' : 'REGISTRAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventForm
