import { supabase } from '../config/supabase'

/**
 * SERVIÇO DE EVENTOS - CETADMI (REATORADO PARA SCHEMA OFICIAL BLOCO 4 & 5 + HARDENING)
 * Camada de abstração para operações no Supabase (DB e Storage)
 */

export const eventService = {
  // --- OPERAÇÕES DE EVENTOS ---

  /**
   * Lista todos os eventos ordenados por data decrescente
   */
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Busca um evento específico pelo slug
   */
  async getEventBySlug(slug) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Cria um novo evento
   */
  async createEvent(eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Atualiza um evento existente
   */
  async updateEvent(id, updateData) {
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Upload de banner para o Storage
   */
  async uploadEventBanner(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('event-banners')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('event-banners')
      .getPublicUrl(filePath)

    return publicUrl
  },

  // --- OPERAÇÕES DE INSCRIÇÕES ---

  /**
   * Cria uma nova inscrição com Snapshot de Preço Imutável
   */
  async createRegistration(registrationData) {
    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        ...registrationData,
        status: 'pending_payment'
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Lista inscritos de um evento específico
   */
  async getRegistrationsByEvent(eventId) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * CONFIRMAR PAGAMENTO
   * Regra: amount_paid = amount_due, status = paid
   */
  async confirmRegistrationPayment(registrationId, amountDue, adminId) {
    const { data, error } = await supabase
      .from('registrations')
      .update({
        status: 'paid',
        amount_paid: amountDue,
        paid_at: new Date().toISOString(),
        payment_proof_received: true,
        confirmed_by: adminId
      })
      .eq('id', registrationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * CANCELAR INSCRIÇÃO
   */
  async cancelRegistration(registrationId) {
    const { data, error } = await supabase
      .from('registrations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * EXPIRAR INSCRIÇÃO MANUAMENTE
   */
  async expireRegistration(registrationId) {
    const { data, error } = await supabase
      .from('registrations')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * SANITIZAR NÚMERO DE WHATSAPP (HARDENING)
   * Remove caracteres não numéricos para garantir link wa.me válido.
   */
  sanitizeWhatsAppNumber(number) {
    if (!number) return ''
    return number.replace(/\D/g, '')
  },

  /**
   * EXPORTAR PARA CSV (HARDENING)
   * Com escape para caracteres especiais e formatação segura.
   */
  exportRegistrationsToCSV(registrations, eventTitle) {
    if (!registrations || registrations.length === 0) return
    
    // Função auxiliar para escapar CSV
    const escape = (val) => {
      if (val === null || val === undefined) return ''
      let str = String(val).replace(/"/g, '""') // Escapa aspas
      if (str.includes(';') || str.includes('\n') || str.includes('\r')) {
        str = `"${str}"` // Coloca entre aspas se tiver separador ou quebra de linha
      }
      return str
    }

    const headers = [
      'ID Inscrição',
      'Nome Completo',
      'E-mail',
      'Telefone',
      'Igreja/Instituição',
      'Cidade',
      'Estado',
      'Categoria',
      'Valor Devido',
      'Valor Pago',
      'Status',
      'Comprovante Enviado',
      'Data Inscrição',
      'Data Pagamento',
      'Data Expiração',
      'Data Cancelamento'
    ]

    const rows = registrations.map(r => [
      escape(r.id),
      escape(r.full_name),
      escape(r.email),
      escape(r.phone),
      escape(r.church_name),
      escape(r.city),
      escape(r.state),
      escape(r.selected_price_label),
      r.amount_due,
      r.amount_paid,
      escape(r.status),
      r.payment_proof_received ? 'SIM' : 'NÃO',
      new Date(r.created_at).toLocaleString('pt-BR'),
      r.paid_at ? new Date(r.paid_at).toLocaleString('pt-BR') : '',
      r.expires_at ? new Date(r.expires_at).toLocaleString('pt-BR') : '',
      r.cancelled_at ? new Date(r.cancelled_at).toLocaleString('pt-BR') : ''
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `inscritos_${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`
    
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
