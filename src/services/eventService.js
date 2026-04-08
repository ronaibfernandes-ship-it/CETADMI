import { supabase } from '../config/supabase'

/**
 * SERVIÇO DE EVENTOS - CETADMI (REATORADO PARA SCHEMA OFICIAL BLOCO 4 & 5 + HARDENING)
 * Camada de abstração para operações no Supabase (DB e Storage)
 */

export const eventService = {
  requireClient() {
    if (!supabase) {
      throw new Error('Supabase nao configurado. Revise as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }

    return supabase
  },

  normalizeEventMetrics(event) {
    const registrations = event.registrations || []
    const occupiedSlots = registrations.filter((registration) => (
      registration.status === 'paid' || (registration.status === 'pending_payment' && (!registration.expires_at || new Date(registration.expires_at) > new Date()))
    )).length

    return {
      ...event,
      slug: this.normalizeSlug(event.slug),
      speakers: Array.isArray(event.speakers) ? event.speakers : [],
      program: Array.isArray(event.program) ? event.program : [],
      price_options: Array.isArray(event.price_options) ? event.price_options : [],
      occupied_slots: event.occupied_slots ?? occupiedSlots,
      total_registrations: event.total_registrations ?? registrations.length,
    }
  },

  normalizeSlug(value) {
    if (!value) return ''

    return String(value)
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
  },

  buildSlugLookupCandidates(value) {
    const rawSlug = String(value || '')
    const normalizedSlug = this.normalizeSlug(value)

    return Array.from(new Set([
      rawSlug,
      normalizedSlug,
      ` ${normalizedSlug}`,
      `${normalizedSlug} `,
    ].filter(Boolean)))
  },

  pickBestSlugMatch(events, slug) {
    if (!Array.isArray(events) || events.length === 0) return null

    const rawSlug = String(slug || '')
    const normalizedSlug = this.normalizeSlug(slug)
    const scoredEvents = [...events].sort((left, right) => {
      const leftSlug = this.normalizeSlug(left.slug)
      const rightSlug = this.normalizeSlug(right.slug)
      const leftScore = (left.slug === rawSlug ? 4 : 0) + (leftSlug === normalizedSlug ? 2 : 0)
      const rightScore = (right.slug === rawSlug ? 4 : 0) + (rightSlug === normalizedSlug ? 2 : 0)

      if (leftScore !== rightScore) {
        return rightScore - leftScore
      }

      return new Date(right.updated_at || right.created_at || 0) - new Date(left.updated_at || left.created_at || 0)
    })

    return scoredEvents[0] || null
  },

  normalizeRegistrationInput(registrationData) {
    return {
      ...registrationData,
      full_name: String(registrationData.full_name || '').trim().replace(/\s+/g, ' '),
      email: String(registrationData.email || '').trim().toLowerCase(),
      phone: this.sanitizeWhatsAppNumber(registrationData.phone),
      church_name: String(registrationData.church_name || '').trim().replace(/\s+/g, ' '),
    }
  },

  // --- OPERAÇÕES DE EVENTOS ---

  /**
   * Lista todos os eventos ordenados por data decrescente
   */
  async getEvents() {
    const client = this.requireClient()
    const { data, error } = await client
      .from('events')
      .select('*, registrations(status, expires_at)')
      .order('event_date', { ascending: false })
    
    if (error) throw error
    return data.map((event) => this.normalizeEventMetrics(event))
  },

  /**
   * Busca um evento específico pelo slug
   */
  async getEventBySlug(slug) {
    const client = this.requireClient()
    const slugCandidates = this.buildSlugLookupCandidates(slug)
    const { data, error } = await client
      .from('events')
      .select('*')
      .in('slug', slugCandidates)
      .order('updated_at', { ascending: false })
      .limit(10)
    
    if (error) throw error

    const matchedEvent = this.pickBestSlugMatch(data, slug)
    return matchedEvent ? this.normalizeEventMetrics(matchedEvent) : matchedEvent
  },

  /**
   * Cria um novo evento
   */
  async createEvent(eventData) {
    const client = this.requireClient()
    const normalizedPayload = {
      ...eventData,
      slug: this.normalizeSlug(eventData.slug),
    }
    const { data, error } = await client
      .from('events')
      .insert([normalizedPayload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Atualiza um evento existente
   */
  async updateEvent(id, updateData) {
    const client = this.requireClient()
    const normalizedPayload = {
      ...updateData,
      slug: this.normalizeSlug(updateData.slug),
    }
    const { data, error } = await client
      .from('events')
      .update(normalizedPayload)
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
    const client = this.requireClient()

    if (!file.type.startsWith('image/')) {
      throw new Error('BANNER_INVALID_FILE_TYPE')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('BANNER_FILE_TOO_LARGE')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await client.storage
      .from('event-banners')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = client.storage
      .from('event-banners')
      .getPublicUrl(filePath)

    return publicUrl
  },

  mapBannerUploadError(error) {
    const message = error?.message || ''

    if (message.includes('Bucket not found')) {
      return 'O bucket event-banners ainda nao existe no Supabase Storage.'
    }

    if (message.includes('new row violates row-level security policy') || error?.statusCode === '403') {
      return 'O bucket event-banners existe, mas as permissoes de upload ainda nao foram liberadas para administradores.'
    }

    if (message.includes('BANNER_INVALID_FILE_TYPE')) {
      return 'Envie apenas imagens para o banner.'
    }

    if (message.includes('BANNER_FILE_TOO_LARGE')) {
      return 'O banner deve ter no maximo 5 MB.'
    }

    return 'Erro ao fazer upload do banner. Verifique o bucket event-banners no Supabase Storage.'
  },

  // --- OPERAÇÕES DE INSCRIÇÕES ---

  /**
   * Cria uma nova inscrição com Snapshot de Preço Imutável
   */
  async createRegistration(registrationData) {
    const client = this.requireClient()
    const normalizedPayload = this.normalizeRegistrationInput(registrationData)
    const { data, error } = await client
      .from('registrations')
      .insert([{
        ...normalizedPayload,
        status: 'pending_payment'
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getRegistrationById(registrationId) {
    const client = this.requireClient()
    const { data, error } = await client
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Lista inscritos de um evento específico
   */
  async getRegistrationsByEvent(eventId) {
    const client = this.requireClient()
    const { data, error } = await client
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
  async confirmRegistrationPayment(registrationId, adminId) {
    const client = this.requireClient()
    const registration = await this.getRegistrationById(registrationId)

    if (registration.status !== 'pending_payment') {
      throw new Error('REGISTRATION_STATUS_CHANGED')
    }

    const { data, error } = await client
      .from('registrations')
      .update({
        status: 'paid',
        amount_paid: Number(registration.amount_due || 0),
        paid_at: new Date().toISOString(),
        payment_proof_received: true,
        confirmed_by: adminId
      })
      .eq('id', registrationId)
      .eq('status', 'pending_payment')
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * CANCELAR INSCRIÇÃO
   */
  async cancelRegistration(registrationId) {
    const client = this.requireClient()
    const registration = await this.getRegistrationById(registrationId)

    if (!['pending_payment', 'paid'].includes(registration.status)) {
      throw new Error('REGISTRATION_STATUS_CHANGED')
    }

    const { data, error } = await client
      .from('registrations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .in('status', ['pending_payment', 'paid'])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * EXPIRAR INSCRIÇÃO MANUAMENTE
   */
  async expireRegistration(registrationId) {
    const client = this.requireClient()
    const registration = await this.getRegistrationById(registrationId)

    if (registration.status !== 'pending_payment') {
      throw new Error('REGISTRATION_STATUS_CHANGED')
    }

    const { data, error } = await client
      .from('registrations')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .eq('status', 'pending_payment')
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

  buildWhatsAppUrl(number, text = '') {
    const sanitizedNumber = this.sanitizeWhatsAppNumber(number)
    const searchParams = new URLSearchParams()

    if (sanitizedNumber) {
      searchParams.set('phone', sanitizedNumber)
    }

    if (text) {
      searchParams.set('text', text)
    }

    return `https://api.whatsapp.com/send?${searchParams.toString()}`
  },

  formatLongDate(value) {
    if (!value) return ''

    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  },

  buildCertificateUrl(baseOrigin, event, registration = null) {
    const params = new URLSearchParams()
    const eventDate = this.formatLongDate(event?.event_date)
    const firstSpeaker = Array.isArray(event?.speakers) ? event.speakers.find((speaker) => speaker?.name) : null

    if (registration?.full_name) {
      params.set('nome', registration.full_name)
    }

    if (event?.title) {
      params.set('evento', event.title)
    }

    if (event?.subtitle) {
      params.set('tema', event.subtitle)
    }

    if (eventDate) {
      params.set('data', eventDate)
      params.set('cidadeData', `${event?.location || 'Belem - PA'}, ${eventDate}`)
    }

    if (firstSpeaker?.name) {
      params.set('preletor', firstSpeaker.name)
    }

    return `${baseOrigin}/certificado?${params.toString()}`
  },

  mapRegistrationError(error) {
    const message = error?.message || ''

    if (message.includes('EVENT_FULL')) {
      return 'As vagas deste evento acabaram.'
    }

    if (message.includes('REGISTRATION_CLOSED')) {
      return 'O prazo de inscricao para este evento foi encerrado.'
    }

    if (message.includes('EVENT_NOT_PUBLISHED')) {
      return 'Este evento nao esta publicado para inscricoes publicas.'
    }

    if (message.includes('DUPLICATE_ACTIVE_REGISTRATION')) {
      return 'Ja existe uma inscricao ativa para este e-mail ou telefone neste evento.'
    }

    if (message.includes('REGISTRATION_STATUS_CHANGED')) {
      return 'A inscricao foi alterada por outro administrador. Atualize a lista antes de tentar novamente.'
    }

    return 'Falha ao processar sua matricula. Verifique sua conexao e tente novamente.'
  },

  async getAdminUsers() {
    const client = this.requireClient()
    const { data: adminUsers, error } = await client
      .from('admin_users')
      .select('user_id, role, created_at')
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!adminUsers.length) return []

    const userIds = adminUsers.map((admin) => admin.user_id)
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    if (profileError) throw profileError

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

    return adminUsers.map((admin) => ({
      ...admin,
      profile: profileById.get(admin.user_id) ?? null,
    }))
  },

  async findProfileByEmail(email) {
    const client = this.requireClient()
    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await client
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async addAdminUserByEmail(email, role = 'admin') {
    const client = this.requireClient()
    const profile = await this.findProfileByEmail(email)

    if (!profile) {
      throw new Error('USER_NOT_FOUND')
    }

    const { data, error } = await client
      .from('admin_users')
      .upsert([{ user_id: profile.id, role }], { onConflict: 'user_id' })
      .select('user_id, role, created_at')
      .single()

    if (error) throw error

    return {
      ...data,
      profile,
    }
  },

  async removeAdminUser(userId) {
    const client = this.requireClient()
    const { error } = await client
      .from('admin_users')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  },

  mapAdminError(error) {
    const message = error?.message || ''

    if (message.includes('USER_NOT_FOUND')) {
      return 'Esse e-mail ainda nao pertence a um usuario autenticado no sistema.'
    }

    if (error?.code === '23505') {
      return 'Esse usuario ja possui acesso administrativo.'
    }

    if (error?.code === '42501') {
      return 'Somente o owner pode gerenciar administradores.'
    }

    if (error?.code === 'PGRST205') {
      return 'As tabelas admin_users/profiles ainda nao existem no Supabase. Execute a migracao mais recente.'
    }

    return 'Nao foi possivel atualizar os administradores agora.'
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
