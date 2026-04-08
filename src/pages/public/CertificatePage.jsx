import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { certificateService } from '../../services/certificateService'
import './certificate.css'

const certificateDefaults = {
  nome: 'Nome do Aluno Aqui',
  evento: '6º Simposio de EBD',
  tema: 'A Santissima Trindade',
  data: '11 de abril de 2026',
  preletor: 'Pr. Douglas Baptista',
  diretor: 'Pr. Alex Vieira',
  diretorCargo: 'Diretor de Ensino',
  cidadeData: 'Belem - PA, 11 de abril de 2026',
  registro: 'CET-2026-00000000',
  emissao: '11 de abril de 2026',
}

const englishMonths = {
  january: 'janeiro',
  february: 'fevereiro',
  march: 'marco',
  april: 'abril',
  may: 'maio',
  june: 'junho',
  july: 'julho',
  august: 'agosto',
  september: 'setembro',
  october: 'outubro',
  november: 'novembro',
  december: 'dezembro',
}

const normalizeCertificateName = (value) => {
  const smallWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])

  return String(value || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word
      if (index > 0 && smallWords.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

const normalizeCertificateTheme = (value) => {
  const theme = String(value || '').trim()
  if (!theme) return certificateDefaults.tema
  if (theme.length <= 56) return theme

  if (/formacao biblica|teologica|pedagogica/i.test(theme)) {
    return 'Formacao Biblica e Ministerial'
  }

  const shortened = theme.split(/[.:;-]/)[0].trim()
  return shortened && shortened.length <= 56 ? shortened : theme.slice(0, 53).trimEnd() + '...'
}

const normalizeDateLabel = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  return raw.replace(/\b([A-Za-z]+)\b/g, (match) => englishMonths[match.toLowerCase()] || match.toLowerCase())
}

const buildCertificateData = (searchParams, issuedCertificate) => {
  if (issuedCertificate) {
    return {
      nome: normalizeCertificateName(issuedCertificate.recipient_name || certificateDefaults.nome),
      evento: issuedCertificate.event_title || certificateDefaults.evento,
      tema: normalizeCertificateTheme(issuedCertificate.event_subtitle || certificateDefaults.tema),
      data: normalizeDateLabel(issuedCertificate.event_date_label || certificateDefaults.data),
      preletor: issuedCertificate.speaker_name || certificateDefaults.preletor,
      diretor: issuedCertificate.director_name || certificateDefaults.diretor,
      diretorCargo: issuedCertificate.director_role || certificateDefaults.diretorCargo,
      cidadeData: normalizeDateLabel(issuedCertificate.location_label || certificateDefaults.cidadeData),
      registro: issuedCertificate.code || certificateDefaults.registro,
      emissao: issuedCertificate.issued_at ? new Date(issuedCertificate.issued_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : certificateDefaults.emissao,
    }
  }

  return {
    nome: normalizeCertificateName(searchParams.get('nome') || certificateDefaults.nome),
    evento: searchParams.get('evento') || certificateDefaults.evento,
    tema: normalizeCertificateTheme(searchParams.get('tema') || certificateDefaults.tema),
    data: normalizeDateLabel(searchParams.get('data') || certificateDefaults.data),
    preletor: searchParams.get('preletor') || certificateDefaults.preletor,
    diretor: searchParams.get('diretor') || certificateDefaults.diretor,
    diretorCargo: searchParams.get('diretorCargo') || certificateDefaults.diretorCargo,
    cidadeData: normalizeDateLabel(searchParams.get('cidadeData') || certificateDefaults.cidadeData),
    registro: searchParams.get('registro') || certificateDefaults.registro,
    emissao: searchParams.get('emissao') || certificateDefaults.emissao,
  }
}

const CertificatePage = () => {
  const [searchParams] = useSearchParams()
  const { code } = useParams()
  const recipientRef = useRef(null)
  const [recipientName, setRecipientName] = useState(certificateDefaults.nome)
  const [recipientStyle, setRecipientStyle] = useState({ fontSize: '29pt', lineHeight: 1.18, letterSpacing: '0.015em' })
  const [issuedCertificate, setIssuedCertificate] = useState(null)
  const [loading, setLoading] = useState(Boolean(code))
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadIssuedCertificate() {
      if (!code) {
        setIssuedCertificate(null)
        setError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await certificateService.getCertificateByCode(code)

        if (!active) return

        if (!data?.code) {
          setIssuedCertificate(null)
          setError('Nenhum certificado foi localizado com esse codigo.')
          return
        }

        setIssuedCertificate(data)
        setError(data.status === 'revoked' ? 'Este certificado foi revogado pela administracao.' : null)
      } catch {
        if (active) {
          setIssuedCertificate(null)
          setError('Nao foi possivel validar este certificado agora.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadIssuedCertificate()

    return () => {
      active = false
    }
  }, [code])

  const certificateData = useMemo(() => buildCertificateData(searchParams, issuedCertificate), [issuedCertificate, searchParams])

  useEffect(() => {
    setRecipientName(certificateData.nome)
  }, [certificateData.nome])

  useEffect(() => {
    if (recipientRef.current && recipientRef.current.textContent !== certificateData.nome) {
      recipientRef.current.textContent = certificateData.nome
    }
  }, [certificateData.nome])

  useEffect(() => {
    const recipient = recipientRef.current
    if (!recipient) return

    const normalizedText = recipient.textContent.replace(/\s+/g, ' ').trim()
    let fontSize = 29
    let lineHeight = 1.18
    let letterSpacing = 0.015

    if (normalizedText.length > 32) letterSpacing = 0.008
    if (normalizedText.length > 42) {
      letterSpacing = 0
      lineHeight = 1.08
    }

    recipient.style.fontSize = `${fontSize}pt`

    while (recipient.scrollWidth > recipient.clientWidth && fontSize > 18) {
      fontSize -= 1
      recipient.style.fontSize = `${fontSize}pt`
    }

    if (normalizedText.length > 42 || recipient.scrollHeight > recipient.clientHeight * 1.8) {
      lineHeight = 1.08
    }

    setRecipientStyle({
      fontSize: `${fontSize}pt`,
      lineHeight,
      letterSpacing: `${letterSpacing}em`,
    })
  }, [recipientName])

  const isPublicCertificate = Boolean(code)
  return (
    <div className="certificate-page-root min-h-screen px-4 py-6 text-slate-700 print:bg-white print:p-0">
      {isPublicCertificate && (
        <div className={`certificate-status-banner mx-auto mb-4 max-w-5xl rounded-[1.75rem] border p-4 text-sm backdrop-blur print:hidden ${error ? 'border-red-200/30 bg-red-500/10 text-red-100' : 'border-emerald-200/30 bg-emerald-500/10 text-emerald-100'}`}>
          {loading ? 'Validando certificado...' : error || `Certificado validado com sucesso: ${certificateData.registro}`}
        </div>
      )}

      {!isPublicCertificate && (
        <div className="certificate-mobile-panel mx-auto mb-4 max-w-4xl rounded-[1.75rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur md:hidden print:hidden">
          <label htmlFor="recipient-name" className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Nome no certificado</label>
          <input
            id="recipient-name"
            type="text"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value || certificateDefaults.nome)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/95 px-4 py-4 text-base font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            placeholder="Digite o nome completo…"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      <div className="certificate-toolbar print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-3 rounded-full bg-[#b9934b] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_30px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-px hover:bg-[#c7a15a]">
          Gerar PDF Final
        </button>
      </div>

      <div className="certificate-shell mx-auto print:overflow-visible print:pt-0">
        {isPublicCertificate && !loading && !issuedCertificate?.code ? (
          <div className="w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-white/10 p-10 text-center text-white backdrop-blur">
            <AlertCircle className="mx-auto h-12 w-12 text-red-200" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-serif font-black">Certificado nao encontrado</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75">Use o codigo real emitido no painel administrativo. Os novos certificados usam um codigo curto, como <span className="font-bold text-white">C8462F19</span>.</p>
          </div>
        ) : (
        <div className="certificate-preview-frame">
          <main className="certificate-page certificate-preview-page absolute left-0 top-0">
            <div className="certificate-watermark">
              <img src="/logo-cetadmi.png" alt="Marca d'agua CETADMI" />
            </div>

            <section className="certificate-content">
              <header>
                <div className="certificate-header">
                  <img src="/logo-cetadmi.png" alt="Logo CETADMI" />
                  <div>
                    <p className="certificate-eyebrow">Centro Educacional e Teologico</p>
                    <p className="certificate-issuer">CETADMI</p>
                    <p className="certificate-sub-eyebrow">Certificado de Participacao e Distincao Ministerial</p>
                  </div>
                </div>

                <div className="certificate-divider" />
                <h1 className="certificate-main-title">Certificado</h1>
                <p className="certificate-support-title">Documento Institucional de Formacao</p>
              </header>

              <section className="certificate-body">
                <p className="certificate-intro">O Centro Educacional e Teologico CETADMI certifica que</p>

                <div
                  ref={recipientRef}
                  contentEditable={!isPublicCertificate}
                  role="textbox"
                  aria-label="Nome do participante no certificado"
                  suppressContentEditableWarning
                  spellCheck={false}
                  onInput={(event) => setRecipientName(event.currentTarget.textContent || certificateDefaults.nome)}
                  style={recipientStyle}
                  className="certificate-recipient"
                />

                <p>
                  participou com aproveitamento do <span className="certificate-highlight">{certificateData.evento}</span>, com a tematica <span className="certificate-theme">&quot;{certificateData.tema}&quot;</span>, realizado em <span className="certificate-highlight">{certificateData.data}</span>, sob a prelecao do <span className="certificate-highlight">{certificateData.preletor}</span>, em reconhecimento ao compromisso com a capacitacao biblica, teologica e ministerial promovida pelo CETADMI.
                </p>

                <p className="certificate-meta">{certificateData.cidadeData}</p>
              </section>

              <footer className="certificate-footer">
                <div className="certificate-signature-block">
                  <div className="certificate-signature-line">
                    <p className="certificate-signature-name">{certificateData.preletor}</p>
                    <p className="certificate-signature-role">Preletor do Evento</p>
                  </div>
                </div>

                <div className="certificate-seal-wrap">
                  <div className="certificate-seal">
                    <img src="/logo-cetadmi.png" alt="Selo CETADMI" />
                  </div>
                </div>

                <div className="certificate-signature-block">
                  <div className="certificate-signature-line">
                    <p className="certificate-signature-name">{certificateData.diretor}</p>
                    <p className="certificate-signature-role">{certificateData.diretorCargo}<br />CETADMI</p>
                  </div>
                </div>
              </footer>
            </section>
          </main>
        </div>
        )}
      </div>

      {!isPublicCertificate && (
        <div className="certificate-helper print:hidden">
          <strong>Uso da URL Parametrizada:</strong><br />
          Voce pode preencher o certificado via link usando parametros:
          <code>?nome=Maria%20Silva&amp;evento=6%C2%BA%20Simposio&amp;tema=A%20Santissima%20Trindade</code>
        </div>
      )}
    </div>
  )
}

export default CertificatePage
