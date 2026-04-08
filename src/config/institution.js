export const defaultInstitutionalContent = {
  shortName: 'CETADMI',
  fullName: 'Centro Educacional e Teologico para capacitacao e aperfeicoamento',
  legacyName: 'Colegio Teologico CETADMI',
  mission:
    'Capacitacao biblica, teologica e ministerial com compromisso doutrinario, excelencia academica e suporte pastoral.',
  audience: 'Obreiros, esposas, lideres, professores e alunos comprometidos com a formacao crista.',
  doctrinalLine: 'Linha teologica pentecostal classica, alinhada a Declaracao de Fe das Assembleias de Deus.',
  leadership: 'Direcao executiva: Pr Alex Vieira.',
  categoryHighlight: 'Curso Basico em Teologia',
  supportWhatsapp: '+55 91 98189-7040',
  supportEmail: 'cetadmicursos@gmail.com',
  supportHours: '08:00 as 17:00',
  stats: [
    { label: 'Alunos', value: '341' },
    { label: 'Cursos', value: '15' },
    { label: 'Avaliacoes', value: '194' },
    { label: 'Certificados', value: '45' },
  ],
  featuredCourses: [
    'Bibliologia',
    'Soteriologia',
    'Cristologia',
    'Evangelhos Sinoticos',
    'Atos dos Apostolos',
    'Homiletica',
  ],
}

export const institutionalContent = defaultInstitutionalContent

export const mergeInstitutionalContent = (overrides = {}) => ({
  ...defaultInstitutionalContent,
  ...overrides,
  stats: Array.isArray(overrides.stats) && overrides.stats.length > 0 ? overrides.stats : defaultInstitutionalContent.stats,
  featuredCourses: Array.isArray(overrides.featuredCourses) && overrides.featuredCourses.length > 0
    ? overrides.featuredCourses
    : defaultInstitutionalContent.featuredCourses,
})
