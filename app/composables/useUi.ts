/** App-wide UI state shared across layout and pages. */

export type Theme = 'light' | 'dark'
export type ConceptView = 'visualize' | 'explain'

const THEME_KEY = 'aiviz:theme'
const SIDEBAR_KEY = 'aiviz:sidebar-open'

const NARROW = '(max-width: 1100px)'

/**
 * Curriculum sidebar. Two independent states so nothing flashes on load:
 *  - `docked`: wide screens, a column that is open by default (remembered per browser)
 *  - `drawer`: narrow screens, an overlay that is closed by default
 */
export function useSidebar() {
  const docked = useState('sidebar-docked', () => true)
  const drawer = useState('sidebar-drawer', () => false)
  const narrow = useState('sidebar-narrow', () => false)

  const open = computed(() => (narrow.value ? drawer.value : docked.value))

  function init() {
    if (import.meta.server) return
    const mq = window.matchMedia(NARROW)
    narrow.value = mq.matches
    mq.addEventListener('change', (e) => {
      narrow.value = e.matches
      drawer.value = false
    })
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved !== null) docked.value = saved === 'true'
    } catch {}
  }

  function toggle() {
    if (narrow.value) {
      drawer.value = !drawer.value
      return
    }
    docked.value = !docked.value
    try { localStorage.setItem(SIDEBAR_KEY, String(docked.value)) } catch {}
  }

  function close() {
    if (narrow.value) drawer.value = false
  }

  return { open, docked, drawer, narrow, init, toggle, close }
}

/** Light/dark theme. Follows the OS until the user picks one, then remembers it. */
export function useTheme() {
  const theme = useState<Theme | null>('theme', () => null)

  function resolved(): Theme {
    if (theme.value) return theme.value
    if (import.meta.client && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  }

  function init() {
    if (import.meta.server) return
    const attr = document.documentElement.dataset.theme
    if (attr === 'light' || attr === 'dark') theme.value = attr
  }

  function toggle() {
    const next: Theme = resolved() === 'dark' ? 'light' : 'dark'
    theme.value = next
    document.documentElement.dataset.theme = next
    try { localStorage.setItem(THEME_KEY, next) } catch {}
  }

  return { theme, resolved, init, toggle }
}

/** Visualize / Explain tab for the current concept, mirrored in the ?view= query. */
export function useConceptView() {
  const route = useRoute()
  const router = useRouter()
  const view = computed<ConceptView>(() => (route.query.view === 'explain' ? 'explain' : 'visualize'))

  function setView(v: ConceptView) {
    router.replace({ query: { ...route.query, view: v === 'explain' ? 'explain' : undefined } })
  }

  return { view, setView }
}
