import { describe, expect, it } from 'vitest'
import { eventService } from './eventService'

describe('eventService utilities', () => {
  it('sanitizes whatsapp numbers', () => {
    expect(eventService.sanitizeWhatsAppNumber('+55 (11) 99876-5432')).toBe('5511998765432')
  })

  it('normalizes event slugs before use', () => {
    expect(eventService.normalizeSlug(' 6-simposio-da-ebd ')).toBe('6-simposio-da-ebd')
  })

  it('builds slug lookup candidates for legacy records', () => {
    expect(eventService.buildSlugLookupCandidates('6-simposio-da-ebd')).toEqual([
      '6-simposio-da-ebd',
      ' 6-simposio-da-ebd',
      '6-simposio-da-ebd ',
    ])
  })

  it('normalizes registration input before persistence', () => {
    expect(eventService.normalizeRegistrationInput({
      full_name: '  Maria  da Silva  ',
      email: '  TESTE@EMAIL.COM ',
      phone: '+55 (91) 98189-7040',
      church_name: '  Assembleia   Central ',
    })).toEqual({
      full_name: 'Maria da Silva',
      email: 'teste@email.com',
      phone: '5591981897040',
      church_name: 'Assembleia Central',
    })
  })

  it('prefers the best slug match among legacy candidates', () => {
    expect(eventService.pickBestSlugMatch([
      { slug: ' 6-simposio-da-ebd', updated_at: '2026-04-08T10:00:00Z' },
      { slug: '6-simposio-da-ebd', updated_at: '2026-04-07T10:00:00Z' },
    ], '6-simposio-da-ebd')).toEqual({
      slug: '6-simposio-da-ebd',
      updated_at: '2026-04-07T10:00:00Z',
    })
  })

  it('maps duplicate registration errors', () => {
    expect(eventService.mapRegistrationError({ message: 'DUPLICATE_ACTIVE_REGISTRATION' }))
      .toContain('inscricao ativa')
  })

  it('maps event full errors', () => {
    expect(eventService.mapRegistrationError({ message: 'EVENT_FULL' }))
      .toContain('vagas')
  })

  it('normalizes event metrics from registrations', () => {
    const normalized = eventService.normalizeEventMetrics({
      id: 'event-1',
      registrations: [
        { status: 'paid' },
        { status: 'pending_payment', expires_at: new Date(Date.now() + 60_000).toISOString() },
        { status: 'pending_payment', expires_at: new Date(Date.now() - 60_000).toISOString() },
      ],
    })

    expect(normalized.total_registrations).toBe(3)
    expect(normalized.occupied_slots).toBe(2)
    expect(normalized.slug).toBe('')
  })

  it('maps admin policy errors', () => {
    expect(eventService.mapAdminError({ code: '42501' })).toContain('owner')
  })
})
