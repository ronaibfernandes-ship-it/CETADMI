import { supabase } from '../config/supabase'

export const certificateService = {
  requireClient() {
    if (!supabase) {
      throw new Error('Supabase nao configurado. Revise as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }

    return supabase
  },

  async issueCertificate(registrationId) {
    const client = this.requireClient()
    const { data, error } = await client.rpc('issue_certificate', {
      p_registration_id: registrationId,
    })

    if (error) throw error
    return Array.isArray(data) ? data[0] : data
  },

  async getCertificatesByEvent(eventId) {
    const client = this.requireClient()
    const { data, error } = await client
      .from('certificate_issues')
      .select('*')
      .eq('event_id', eventId)
      .order('issued_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('certificate_issues')) {
        return []
      }

      throw error
    }

    return data
  },

  async getCertificateByCode(code) {
    const client = this.requireClient()
    const { data, error } = await client.rpc('validate_certificate_public', {
      p_code: code,
    })

    if (error) throw error
    return Array.isArray(data) ? data[0] : data
  },

  async revokeCertificate(id, reason) {
    const client = this.requireClient()
    const { data, error } = await client
      .from('certificate_issues')
      .update({
        status: 'revoked',
        revoke_reason: reason || 'Revogado manualmente pelo painel administrativo.',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'issued')
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  buildPublicCertificateUrl(baseOrigin, code) {
    return `${baseOrigin}/certificado/${code}`
  },

  mapCertificateError(error) {
    const message = error?.message || ''

    if (message.includes('CERTIFICATE_ALREADY_ISSUED')) {
      return 'Este inscrito ja possui um certificado emitido.'
    }

    if (error?.code === 'PGRST202' || message.includes('issue_certificate')) {
      return 'A estrutura de certificados ainda nao foi aplicada no Supabase. Execute a migracao mais recente.'
    }

    if (error?.code === 'PGRST205' || message.includes('certificate_issues')) {
      return 'A tabela de certificados ainda nao existe no Supabase. Execute a migracao mais recente.'
    }

    if (message.includes('REGISTRATION_NOT_PAID')) {
      return 'Somente inscritos pagos podem receber certificado.'
    }

    if (message.includes('REGISTRATION_NOT_FOUND')) {
      return 'A inscricao informada nao foi encontrada.'
    }

    if (message.includes('42501')) {
      return 'Voce nao tem permissao para emitir ou revogar certificados.'
    }

    return 'Nao foi possivel processar o certificado agora.'
  },
}
