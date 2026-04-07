import React, { useState, useEffect } from 'react'
import { X, Save, Upload, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { eventService } from '../../services/eventService'

const EventForm = ({ event, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form State (Official Schema Block 4)
  const [formData, setFormData] = useState({
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
    price_options: []
  })

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        // SQL Date para Input Local
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : '',
        capacity: event.capacity || '',
        price_options: event.price_options || []
      })
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
      setError('Erro ao fazer upload do banner.')
      console.error(err)
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
          <button onClick={() => onClose()} className="p-2 hover:bg-cetadmi-red transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-cetadmi-red/10 border-l-4 border-cetadmi-red p-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-cetadmi-red" />
              <p className="text-cetadmi-red font-bold uppercase text-xs tracking-widest">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-cetadmi-navy">
            {/* Coluna Esquerda: Dados Básicos */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">Título do Evento</label>
                <input 
                  type="text" name="title" required value={formData.title} onChange={handleChange}
                  className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest">Subtítulo (Opcional)</label>
                <input 
                  type="text" name="subtitle" value={formData.subtitle} onChange={handleChange}
                  className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none focus:bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Slug (URL)</label>
                  <input 
                    type="text" name="slug" required value={formData.slug} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
                    placeholder="ex: congresso-2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Data do Evento</label>
                  <input 
                    type="datetime-local" name="event_date" required value={formData.event_date} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Localização</label>
                  <input 
                    type="text" name="location" value={formData.location} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Prazo Limite Inscrição</label>
                  <input 
                    type="datetime-local" name="registration_deadline" value={formData.registration_deadline} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">WhatsApp (Organização)</label>
                  <input 
                    type="text" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
                    placeholder="5511999999999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest">Chave PIX (Pagamentos)</label>
                  <input 
                    type="text" name="pix_key" value={formData.pix_key} onChange={handleChange}
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
                  />
                </div>
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
                        className="flex-grow bg-white border-2 border-cetadmi-navy p-2 text-xs font-bold focus:outline-none"
                      />
                      <input 
                        type="number" value={opt.price} placeholder="R$"
                        onChange={(e) => updateOption(idx, 'price', e.target.value)}
                        className="w-24 bg-white border-2 border-cetadmi-navy p-2 text-xs font-bold focus:outline-none"
                      />
                      <button 
                        type="button" onClick={() => removeOption(idx)}
                        className="p-2 text-cetadmi-red hover:bg-cetadmi-red/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
                    className="w-full bg-white border-2 border-cetadmi-navy p-3 font-bold focus:outline-none text-sm"
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
