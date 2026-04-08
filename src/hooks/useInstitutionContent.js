import { useEffect, useState } from 'react'
import { institutionService } from '../services/institutionService'

export const useInstitutionContent = () => {
  const [content, setContent] = useState(institutionService.getFallbackContent())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadInstitutionContent() {
      try {
        const data = await institutionService.getInstitutionSettings()
        if (active) {
          setContent(data)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInstitutionContent()

    return () => {
      active = false
    }
  }, [])

  return { content, loading, setContent }
}
