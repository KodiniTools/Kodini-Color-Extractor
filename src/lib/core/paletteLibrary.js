// Saved palettes: recently used ones and favorites, kept in the browser.
// The list logic is pure (arrays in, arrays out); persistence goes through a
// small storage adapter so it can be swapped for tests or when IndexedDB is
// unavailable.

/** Non-favorite entries kept; older ones drop off. Favorites never do. */
export const MAX_RECENT = 30
/** Upper bound for favorites, so a runaway list cannot fill the quota. */
export const MAX_FAVORITES = 200

const HEX6 = /^#?[0-9a-f]{6}$/i

/**
 * @typedef {Object} LibraryEntry
 * @property {string} id
 * @property {string[]} colors  #RRGGBB, uppercase, in palette order
 * @property {'extractor'|'generator'} source
 * @property {boolean} favorite
 * @property {number} updatedAt  ms since epoch
 */

/**
 * Valid colors as uppercase #RRGGBB, in order; invalid entries are dropped.
 * @param {string[]} hexes
 * @returns {string[]}
 */
export function normalizeColors(hexes) {
  return (hexes || [])
    .map((hex) => String(hex).trim())
    .filter((hex) => HEX6.test(hex))
    .map((hex) => `#${hex.replace(/^#/, '').toUpperCase()}`)
}

const keyOf = (colors) => colors.join('-')

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Favorites first, then the rest; newest first within each group.
 * @param {LibraryEntry[]} entries
 * @returns {LibraryEntry[]}
 */
export function sortEntries(entries) {
  return [...entries].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt
  )
}

/**
 * Sorted, with the recent entries and favorites capped.
 * @param {LibraryEntry[]} entries
 * @returns {LibraryEntry[]}
 */
export function pruneEntries(entries) {
  const sorted = sortEntries(entries)
  const favorites = sorted.filter((e) => e.favorite).slice(0, MAX_FAVORITES)
  const recent = sorted.filter((e) => !e.favorite).slice(0, MAX_RECENT)
  return [...favorites, ...recent]
}

/**
 * Records a palette as used. The same colors in the same order are one
 * entry: using them again moves that entry to the top and keeps its
 * favorite mark. Returns the list unchanged when no valid color is given.
 * @param {LibraryEntry[]} entries
 * @param {string[]} hexes
 * @param {{source: 'extractor'|'generator', favorite?: boolean, now?: number}} options
 * @returns {LibraryEntry[]}
 */
export function addEntry(entries, hexes, { source, favorite = false, now = Date.now() }) {
  const colors = normalizeColors(hexes)
  if (!colors.length) return entries
  const key = keyOf(colors)
  const existing = entries.find((e) => keyOf(e.colors) === key)
  const rest = entries.filter((e) => e !== existing)
  const entry = existing
    ? { ...existing, source, favorite: existing.favorite || favorite, updatedAt: now }
    : { id: newId(), colors, source, favorite, updatedAt: now }
  return pruneEntries([entry, ...rest])
}

/**
 * @param {LibraryEntry[]} entries
 * @param {string} id
 * @returns {LibraryEntry[]}
 */
export function toggleFavorite(entries, id) {
  return pruneEntries(entries.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e)))
}

/**
 * @param {LibraryEntry[]} entries
 * @param {string} id
 * @returns {LibraryEntry[]}
 */
export function removeEntry(entries, id) {
  return entries.filter((e) => e.id !== id)
}

/**
 * The entry holding exactly these colors, if any.
 * @param {LibraryEntry[]} entries
 * @param {string[]} hexes
 * @returns {LibraryEntry|undefined}
 */
export function findEntry(entries, hexes) {
  const colors = normalizeColors(hexes)
  if (!colors.length) return undefined
  const key = keyOf(colors)
  return entries.find((e) => keyOf(e.colors) === key)
}

/**
 * Keeps only well-formed entries from stored data, which may be stale,
 * hand-edited or from an older version.
 * @param {unknown} data
 * @returns {LibraryEntry[]}
 */
export function sanitizeEntries(data) {
  if (!Array.isArray(data)) return []
  const out = []
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue
    const colors = normalizeColors(raw.colors)
    if (!colors.length || typeof raw.id !== 'string') continue
    out.push({
      id: raw.id,
      colors,
      source: raw.source === 'extractor' ? 'extractor' : 'generator',
      favorite: raw.favorite === true,
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
    })
  }
  return pruneEntries(out)
}

// ─── Storage adapters ───
// An adapter has `load(): Promise<unknown>`, `save(entries): Promise<void>`
// and `persistent: boolean` (false when entries only live until reload).

/** Keeps entries in memory only. */
export function createMemoryStorage() {
  let data = []
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

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * IndexedDB storage: the whole list is one record, so a save is atomic.
 * Rejects when IndexedDB is missing or blocked (e.g. some private modes).
 * @param {IDBFactory} [idb]
 */
export async function createIndexedDbStorage(idb = globalThis.indexedDB) {
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
