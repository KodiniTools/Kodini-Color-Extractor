// Saved palettes: recently used ones and favorites, kept in the browser.
// The list logic is pure (arrays in, arrays out); persistence goes through a
// small storage adapter so it can be swapped for tests or when IndexedDB is
// unavailable.

/** Non-favorite entries kept; older ones drop off. Favorites never do. */
export const MAX_RECENT = 30
/** Upper bound for favorites, so a runaway list cannot fill the quota. */
export const MAX_FAVORITES = 200

const HEX6 = /^#?[0-9a-f]{6}$/i

export type LibrarySource = 'extractor' | 'generator'

export interface LibraryEntry {
  id: string
  /** #RRGGBB, uppercase, in palette order. */
  colors: string[]
  source: LibrarySource
  favorite: boolean
  /** ms since epoch */
  updatedAt: number
}

/**
 * Where the list is kept. `persistent` is false when entries only live until
 * reload.
 */
export interface LibraryStorage {
  persistent: boolean
  load(): Promise<unknown>
  save(entries: readonly LibraryEntry[]): Promise<void>
}

/**
 * Valid colors as uppercase #RRGGBB, in order; invalid entries are dropped.
 */
export function normalizeColors(hexes: unknown): string[] {
  if (!Array.isArray(hexes)) return []
  return hexes
    .map((hex) => String(hex).trim())
    .filter((hex) => HEX6.test(hex))
    .map((hex) => `#${hex.replace(/^#/, '').toUpperCase()}`)
}

const keyOf = (colors: readonly string[]) => colors.join('-')

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Favorites first, then the rest; newest first within each group.
 */
export function sortEntries(entries: readonly LibraryEntry[]): LibraryEntry[] {
  return [...entries].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt
  )
}

/**
 * Sorted, with the recent entries and favorites capped.
 */
export function pruneEntries(entries: readonly LibraryEntry[]): LibraryEntry[] {
  const sorted = sortEntries(entries)
  const favorites = sorted.filter((e) => e.favorite).slice(0, MAX_FAVORITES)
  const recent = sorted.filter((e) => !e.favorite).slice(0, MAX_RECENT)
  return [...favorites, ...recent]
}

/**
 * Records a palette as used. The same colors in the same order are one
 * entry: using them again moves that entry to the top and keeps its
 * favorite mark. Returns the list unchanged when no valid color is given.
 */
export function addEntry(
  entries: LibraryEntry[],
  hexes: readonly string[],
  {
    source,
    favorite = false,
    now = Date.now(),
  }: { source: LibrarySource; favorite?: boolean; now?: number }
): LibraryEntry[] {
  const colors = normalizeColors(hexes)
  if (!colors.length) return entries
  const key = keyOf(colors)
  const existing = entries.find((e) => keyOf(e.colors) === key)
  const rest = entries.filter((e) => e !== existing)
  const entry: LibraryEntry = existing
    ? { ...existing, source, favorite: existing.favorite || favorite, updatedAt: now }
    : { id: newId(), colors, source, favorite, updatedAt: now }
  return pruneEntries([entry, ...rest])
}

/**
 */
export function toggleFavorite(entries: readonly LibraryEntry[], id: string): LibraryEntry[] {
  return pruneEntries(entries.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e)))
}

/**
 */
export function removeEntry(entries: readonly LibraryEntry[], id: string): LibraryEntry[] {
  return entries.filter((e) => e.id !== id)
}

/**
 * The entry holding exactly these colors, if any.
 */
export function findEntry(
  entries: readonly LibraryEntry[],
  hexes: readonly string[]
): LibraryEntry | undefined {
  const colors = normalizeColors(hexes)
  if (!colors.length) return undefined
  const key = keyOf(colors)
  return entries.find((e) => keyOf(e.colors) === key)
}

/**
 * Keeps only well-formed entries from stored data, which may be stale,
 * hand-edited or from an older version.
 */
export function sanitizeEntries(data: unknown): LibraryEntry[] {
  if (!Array.isArray(data)) return []
  const out: LibraryEntry[] = []
  for (const raw of data as unknown[]) {
    if (!raw || typeof raw !== 'object') continue
    const { id, colors: rawColors, source, favorite, updatedAt } = raw as Record<string, unknown>
    const colors = normalizeColors(rawColors)
    if (!colors.length || typeof id !== 'string') continue
    out.push({
      id,
      colors,
      source: source === 'extractor' ? 'extractor' : 'generator',
      favorite: favorite === true,
      updatedAt: typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : 0,
    })
  }
  return pruneEntries(out)
}

// ─── Storage adapters ───

/** Keeps entries in memory only. */
export function createMemoryStorage(): LibraryStorage {
  let data: readonly LibraryEntry[] = []
  return {
    persistent: false,
    async load() {
      return data
    },
    async save(entries) {
      data = entries
    },
  }
}

const DB_NAME = 'kodini-color-extractor'
const STORE = 'library'
const RECORD_KEY = 'palettes'

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * IndexedDB storage: the whole list is one record, so a save is atomic.
 * Rejects when IndexedDB is missing or blocked (e.g. some private modes).
 */
export async function createIndexedDbStorage(
  idb: IDBFactory | undefined = globalThis.indexedDB
): Promise<LibraryStorage> {
  if (!idb) throw new Error('IndexedDB unavailable')
  const open = idb.open(DB_NAME, 1)
  open.onupgradeneeded = () => {
    if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE)
  }
  const db = await request(open)
  return {
    persistent: true,
    async load() {
      return request(db.transaction(STORE, 'readonly').objectStore(STORE).get(RECORD_KEY))
    },
    async save(entries) {
      // Plain copies: reactive proxies cannot be structured-cloned.
      const plain = entries.map((e) => ({ ...e, colors: [...e.colors] }))
      await request(db.transaction(STORE, 'readwrite').objectStore(STORE).put(plain, RECORD_KEY))
    },
  }
}
