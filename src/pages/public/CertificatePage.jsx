import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'

const certificateDefaults = {
  nome: 'Nome do Aluno Aqui',
  evento: '6º Simposio de EBD',
  tema: 'A Santissima Trindade',
  data: '11 de abril de 2026',
  preletor: 'Pr. Douglas Baptista',
  diretor: 'Pr. Alex Vieira',
  cidadeData: 'Belem - PA, 11 de abril de 2026',
  registro: 'CET-2026-00000000',
  emissao: '11 de abril de 2026',
}

const CertificatePage = () => {
  const [searchParams] = useSearchParams()
  const recipientRef = useRef(null)
  const [recipientName, setRecipientName] = useState(certificateDefaults.nome)
  const [recipientStyle, setRecipientStyle] = useState({
    fontSize: '29pt',
    lineHeight: 1.18,
    letterSpacing: '0.015em',
  })

  const certificateData = useMemo(() => ({
    nome: searchParams.get('nome') || certificateDefaults.nome,
    evento: searchParams.get('evento') || certificateDefaults.evento,
    tema: searchParams.get('tema') || certificateDefaults.tema,
    data: searchParams.get('data') || certificateDefaults.data,
    preletor: searchParams.get('preletor') || certificateDefaults.preletor,
    diretor: searchParams.get('diretor') || certificateDefaults.diretor,
    cidadeData: searchParams.get('cidadeData') || certificateDefaults.cidadeData,
    registro: searchParams.get('registro') || certificateDefaults.registro,
    emissao: searchParams.get('emissao') || certificateDefaults.emissao,
  }), [searchParams])

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

    if (normalizedText.length > 32) {
      letterSpacing = 0.008
    }

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2b3546,_#171d27_60%)] px-4 py-6 text-slate-700 print:bg-white print:p-0">
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
      <div className="fixed right-5 top-5 z-20 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-3 rounded-full bg-[#b9934b] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_18px_30px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-px hover:bg-[#c7a15a]"
        >
          <Printer size={16} aria-hidden="true" />
          Gerar PDF Final
        </button>
      </div>

      <div className="mx-auto flex w-full justify-center overflow-auto pt-10 print:overflow-visible print:pt-0">
        <main className="certificate-page relative h-[210mm] w-[297mm] origin-top overflow-hidden bg-[#f8f4ea] shadow-[0_45px_90px_rgba(0,0,0,0.34)] max-md:h-auto max-md:min-h-[210mm] max-md:w-[297mm] max-md:scale-[0.52] print:shadow-none sm:max-md:scale-[0.68]">
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
                contentEditable
                role="textbox"
                aria-label="Nome do participante no certificado"
                suppressContentEditableWarning
                spellCheck={false}
                onInput={(event) => setRecipientName(event.currentTarget.textContent || certificateDefaults.nome)}
                style={recipientStyle}
                className="recipient mx-auto my-[10mm] max-w-[210mm] min-w-[150mm] border-b border-[#b9934b73] px-[10mm] pb-[4mm] text-center font-serif font-bold text-[#0a192f] outline-none"
              />

              <p className="m-0 text-[13pt] leading-[1.72] text-slate-700">
                participou com aproveitamento do <span className="font-bold text-[#0a192f]">{certificateData.evento}</span>, com a tematica{' '}
                <span className="font-bold italic text-[#8b6a2a]">&quot;{certificateData.tema}&quot;</span>, realizado em{' '}
                <span className="font-bold text-[#0a192f]">{certificateData.data}</span>, sob a prelecao do{' '}
                <span className="font-bold text-[#0a192f]">{certificateData.preletor}</span>, em reconhecimento ao compromisso com a capacitacao biblica,
                teologica e ministerial promovida pelo CETADMI.
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
                  <p className="m-0 mt-1 text-[7.1pt] font-semibold uppercase tracking-[0.1em] text-[#0a192f94]">Diretor de Ensino<br />CETADMI</p>
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
    </div>
  )
}

export default CertificatePage
