/**
 * Composable for managing app name mappings with localStorage persistence
 * Converts technical slugs like "project-my-awesome-project" to friendly display names like "My Awesome Project"
 */
export function useAppNames() {
  // Reactive state for current mappings
  const mappings = ref<Record<string, string>>({})

  /**
   * Generate a technical slug from display name
   * "My Awesome Project" → "project-my-awesome-project"
   */
  const generateSlug = (displayName: string): string => {
    if (!displayName || displayName.trim() === '') {
      return 'project-untitled'
    }

    // Normalize unicode characters to ASCII equivalents
    const normalized = displayName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics

    // Convert to slug format
    let slug = normalized
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_-]/g, ' ') // Replace special chars with spaces to preserve word boundaries
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

    // Handle edge case where everything was stripped out
    if (!slug) {
      slug = 'untitled'
    }

    // Truncate if too long (keep reasonable slug length)
    if (slug.length > 40) {
      slug = slug.substring(0, 40).replace(/-+$/, '')
    }

    return `project-${slug}`
  }

  /**
   * Get friendly display name from technical slug
   * If mapping exists in localStorage: return friendly name
   * If no mapping: return original slug (fallback)
   */
  const getDisplayName = (sourceApp: string): string => {
    if (!sourceApp) {
      return ''
    }

    return mappings.value[sourceApp] || sourceApp
  }

  /**
   * Save mapping to localStorage
   * Store as JSON: {"project-my-app": "My App", "project-another": "Another Project"}
   */
  const saveAppMapping = (sourceApp: string, displayName: string): void => {
    if (!process.client) return

    try {
      // Update reactive state
      mappings.value[sourceApp] = displayName

      // Persist to localStorage
      localStorage.setItem('claude-app-mappings', JSON.stringify(mappings.value))
    } catch (error) {
      console.warn('Failed to save app mapping to localStorage:', error)
    }
  }

  /**
   * Load all mappings from localStorage on init
   */
  const loadMappings = (): void => {
    if (!process.client) return

    try {
      const stored = localStorage.getItem('claude-app-mappings')
      if (stored) {
        const parsed = JSON.parse(stored)
        mappings.value = parsed || {}
      } else {
        mappings.value = {}
      }
    } catch (error) {
      console.warn('Failed to load app mappings from localStorage:', error)
      mappings.value = {}
    }
  }

  // Initialize mappings on composable creation (only on client)
  if (process.client) {
    loadMappings()
  }

  return {
    mappings: mappings as Ref<Record<string, string>>,
    generateSlug,
    getDisplayName,
    saveAppMapping,
    loadMappings
  }
}