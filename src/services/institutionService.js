import { defaultInstitutionalContent, mergeInstitutionalContent } from '../config/institution'
import { supabase } from '../config/supabase'

const mapInstitutionRecord = (record) => mergeInstitutionalContent({
  shortName: record?.short_name,
  fullName: record?.full_name,
  legacyName: record?.legacy_name,
  mission: record?.mission,
  audience: record?.audience,
  doctrinalLine: record?.doctrinal_line,
  leadership: record?.leadership,
  categoryHighlight: record?.category_highlight,
  supportWhatsapp: record?.support_whatsapp,
  supportEmail: record?.support_email,
  supportHours: record?.support_hours,
  stats: record?.stats,
  featuredCourses: record?.featured_courses,
  certificateDirectorName: record?.certificate_director_name || record?.leadership,
  certificateDirectorRole: record?.certificate_director_role || 'Diretor de Ensino',
})

const mapInstitutionPayload = (content) => ({
  id: 1,
  short_name: content.shortName,
  full_name: content.fullName,
  legacy_name: content.legacyName,
  mission: content.mission,
  audience: content.audience,
  doctrinal_line: content.doctrinalLine,
  leadership: content.leadership,
  category_highlight: content.categoryHighlight,
  support_whatsapp: content.supportWhatsapp,
  support_email: content.supportEmail,
  support_hours: content.supportHours,
  certificate_director_name: content.certificateDirectorName || content.leadership,
  certificate_director_role: content.certificateDirectorRole || 'Diretor de Ensino',
  stats: content.stats,
  featured_courses: content.featuredCourses,
})

export const institutionService = {
  getFallbackContent() {
    return defaultInstitutionalContent
  },

  async getInstitutionSettings() {
    if (!supabase) return defaultInstitutionalContent

    const { data, error } = await supabase
      .from('institution_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('institution_settings')) {
        return defaultInstitutionalContent
      }

      throw error
    }

    return data ? mapInstitutionRecord(data) : defaultInstitutionalContent
  },

  async updateInstitutionSettings(content) {
    if (!supabase) {
      throw new Error('SUPABASE_NOT_CONFIGURED')
    }

    const payload = mapInstitutionPayload(mergeInstitutionalContent(content))
    const { data, error } = await supabase
      .from('institution_settings')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) throw error
    return mapInstitutionRecord(data)
  },

  normalizeStatsInput(text) {
    return String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, value] = line.split(':').map((part) => part.trim())
        return label && value ? { label, value } : null
      })
      .filter(Boolean)
  },

  normalizeCoursesInput(text) {
    return String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  },
}
