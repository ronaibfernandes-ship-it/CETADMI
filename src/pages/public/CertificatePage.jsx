import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2, Printer, Search } from 'lucide-react'
import { certificateService } from '../../services/certificateService'

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
  const navigate = useNavigate()
  const recipientRef = useRef(null)
  const [recipientName, setRecipientName] = useState(certificateDefaults.nome)
  const [recipientStyle, setRecipientStyle] = useState({ fontSize: '29pt', lineHeight: 1.18, letterSpacing: '0.015em' })
  const [lookupCode, setLookupCode] = useState(code || '')
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2b3546,_#171d27_60%)] px-4 py-6 text-slate-700 print:bg-white print:p-0">
      <div className="mx-auto mb-4 max-w-5xl rounded-[1.75rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur print:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Validacao e emissao</p>
            <h1 className="mt-2 text-2xl font-serif font-black text-white">Certificado CETADMI</h1>
            <p className="mt-2 text-sm text-white/70">Use um codigo emitido pelo sistema ou abra o modelo manual para personalizacao pontual.</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (lookupCode.trim()) {
                navigate(`/certificado/${lookupCode.trim().toUpperCase()}`)
              }
            }}
            className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={lookupCode}
                onChange={(event) => setLookupCode(event.target.value)}
                placeholder="Codigo do certificado..."
                className="w-full rounded-2xl border border-white/10 bg-white/95 py-4 pl-12 pr-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              />
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#b9934b] px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c7a15a]">
              Validar
            </button>
            <Link to="/certificado" className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/15">
              Modelo manual
            </Link>
          </form>
        </div>

        {isPublicCertificate && (
          <div className={`mt-4 rounded-2xl border px-4 py-4 text-sm ${error ? 'border-red-200/30 bg-red-500/10 text-red-100' : 'border-emerald-200/30 bg-emerald-500/10 text-emerald-100'}`}>
            {loading ? 'Validando certificado...' : error || `Certificado validado com sucesso: ${certificateData.registro}`}
          </div>
        )}
      </div>

      {!isPublicCertificate && (
        <div className="mx-auto mb-4 max-w-4xl rounded-[1.75rem] border border-white/10 bg-white/10 p-4 text-white backdrop-blur md:hidden print:hidden">
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

      <div className="fixed right-5 top-5 z-20 print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-3 rounded-full bg-[#b9934b] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_30px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-px hover:bg-[#c7a15a]">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} aria-hidden="true" />}
          Gerar PDF Final
        </button>
      </div>

      <div className="mx-auto flex w-full justify-center overflow-auto pt-10 print:overflow-visible print:pt-0">
        {isPublicCertificate && !loading && !issuedCertificate?.code ? (
          <div className="w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-white/10 p-10 text-center text-white backdrop-blur">
            <AlertCircle className="mx-auto h-12 w-12 text-red-200" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-serif font-black">Certificado nao encontrado</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75">Use o codigo real emitido no painel administrativo. Os novos certificados usam um codigo curto, como <span className="font-bold text-white">C8462F19</span>.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => navigate('/certificado')} className="inline-flex items-center justify-center rounded-2xl bg-[#b9934b] px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c7a15a]">
                Abrir modelo manual
              </button>
              <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/15">
                Ir ao painel
              </button>
            </div>
          </div>
        ) : (
        <div className="relative h-[109.2mm] w-[154.44mm] sm:h-[142.8mm] sm:w-[201.96mm] md:h-[210mm] md:w-[297mm]">
          <main className="certificate-page absolute left-0 top-0 h-[210mm] w-[297mm] origin-top-left overflow-hidden bg-[#f8f4ea] shadow-[0_45px_90px_rgba(0,0,0,0.34)] scale-[0.52] print:shadow-none sm:scale-[0.68] md:scale-100">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.048] grayscale">
              <img src="/logo-cetadmi.png" alt="Marca d'agua CETADMI" className="w-[130mm]" />
            </div>

            <div className="pointer-events-none absolute inset-[8mm] border-[3.2mm] border-[#0a192f]" />
            <div className="pointer-events-none absolute inset-[13mm] border-[0.9mm] border-[#b9934be6]" />

            <section className="relative z-10 flex h-full flex-col px-[24mm] pb-[18mm] pt-[20mm]">
              <header>
                <div className="flex items-center justify-center gap-[10mm] text-center">
                  <img src="/logo-cetadmi.png" alt="Logo CETADMI" className="h-[19mm] w-[19mm] object-contain" />
                  <div>
                    <p className="m-0 text-[8.5pt] font-bold uppercase tracking-[0.42em] text-[#0a192f8c]">Centro Educacional e Teologico</p>
                    <p className="m-0 mt-[5px] font-serif text-[15pt] font-extrabold uppercase tracking-[0.06em] text-[#0a192f]">CETADMI</p>
                    <p className="m-0 mt-2 text-[7.5pt] font-bold uppercase tracking-[0.28em] text-[#0a192f70]">Certificado de Participacao e Distincao Ministerial</p>
                  </div>
                </div>

                <div className="mx-auto my-[10mm] h-px w-[62mm] bg-[linear-gradient(90deg,transparent,_#b9934b,_transparent)]" />
                <h1 className="m-0 text-center font-serif text-[30pt] font-black uppercase tracking-[0.16em] text-[#0a192f]">Certificado</h1>
                <p className="m-0 mt-[5px] text-center text-[8pt] font-bold uppercase tracking-[0.35em] text-[#0a192f8c]">Documento Institucional de Formacao</p>
              </header>

              <section className="mx-auto mt-[12mm] max-w-[226mm] text-center">
                <p className="m-0 text-[12pt] font-bold uppercase tracking-[0.08em] text-[#0a192fb8]">O Centro Educacional e Teologico CETADMI certifica que</p>

                <div
                  ref={recipientRef}
                  contentEditable={!isPublicCertificate}
                  role="textbox"
                  aria-label="Nome do participante no certificado"
                  suppressContentEditableWarning
                  spellCheck={false}
                  onInput={(event) => setRecipientName(event.currentTarget.textContent || certificateDefaults.nome)}
                  style={recipientStyle}
                  className="recipient mx-auto my-[10mm] max-w-[210mm] min-w-[150mm] border-b border-[#b9934b73] px-[10mm] pb-[4mm] text-center font-serif font-bold text-[#0a192f] outline-none"
                />

                <p className="m-0 text-[13pt] leading-[1.72] text-slate-700">
                  participou com aproveitamento do <span className="font-bold text-[#0a192f]">{certificateData.evento}</span>, com a tematica <span className="font-bold italic text-[#8b6a2a]">&quot;{certificateData.tema}&quot;</span>, realizado em <span className="font-bold text-[#0a192f]">{certificateData.data}</span>, sob a prelecao do <span className="font-bold text-[#0a192f]">{certificateData.preletor}</span>, em reconhecimento ao compromisso com a capacitacao biblica, teologica e ministerial promovida pelo CETADMI.
                </p>

                <p className="mb-[8mm] mt-[11mm] text-center text-[10.5pt] font-semibold uppercase tracking-[0.08em] text-[#0a192fae]">{certificateData.cidadeData}</p>
              </section>

              <footer className="mt-auto grid grid-cols-[1fr_30mm_1fr] items-end gap-[12mm] pt-[6mm]">
                <div className="text-center">
                  <div className="min-h-[18mm] border-t border-[#0a192fb8] pt-[4mm]">
                    <p className="m-0 text-[9.6pt] font-bold uppercase tracking-[0.08em] text-[#0a192f]">{certificateData.preletor}</p>
                    <p className="m-0 mt-1 text-[7.1pt] font-semibold uppercase tracking-[0.1em] text-[#0a192f94]">Preletor do Evento</p>
                  </div>
                </div>

                <div className="flex justify-center pb-[2mm]">
                  <div className="flex h-[26mm] w-[26mm] items-center justify-center rounded-full border border-[#b9934b8c] bg-white/60 shadow-[inset_0_0_0_0.5mm_rgba(10,25,47,0.05)]">
                    <img src="/logo-cetadmi.png" alt="Selo CETADMI" className="h-[15.5mm] w-[15.5mm] object-contain" />
                  </div>
                </div>

                <div className="text-center">
                  <div className="min-h-[18mm] border-t border-[#0a192fb8] pt-[4mm]">
                    <p className="m-0 text-[9.6pt] font-bold uppercase tracking-[0.08em] text-[#0a192f]">{certificateData.diretor}</p>
                    <p className="m-0 mt-1 text-[7.1pt] font-semibold uppercase tracking-[0.1em] text-[#0a192f94]">{certificateData.diretorCargo}<br />CETADMI</p>
                  </div>
                </div>
              </footer>

              <div className="mt-[7mm] flex items-center justify-between text-[7.2pt] font-semibold uppercase tracking-[0.14em] text-[#0a192f8f]">
                <span>Registro: {certificateData.registro}</span>
                <span>Emissao: {certificateData.emissao}</span>
              </div>
            </section>
          </main>
        </div>
        )}
      </div>
    </div>
  )
}

export default CertificatePage
