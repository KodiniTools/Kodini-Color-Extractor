import { ref, computed } from 'vue'
import {
  type LibraryEntry,
  type LibrarySource,
  type LibraryStorage,
  addEntry,
  createIndexedDbStorage,
  createMemoryStorage,
  findEntry,
  removeEntry,
  sanitizeEntries,
  toggleFavorite,
} from '../lib/core/paletteLibrary'

// One list shared by the extractor and the generator, loaded once per page.
const entries = ref<LibraryEntry[]>([])
const persistent = ref(true)
let storage: LibraryStorage | null = null
let ready: Promise<void> | null = null

function init(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (!storage) {
        try {
          storage = await createIndexedDbStorage()
        } catch {
          storage = createMemoryStorage()
        }
      }
      persistent.value = storage.persistent
      try {
        entries.value = sanitizeEntries(await storage.load())
      } catch {
        // Unreadable data: start empty rather than fail the page.
      }
    })()
  }
  return ready
}

async function update(change: (list: LibraryEntry[]) => LibraryEntry[]) {
  await init()
  entries.value = change(entries.value)
  try {
    // init() always leaves a storage in place.
    await storage!.save(entries.value)
  } catch {
    // Quota or a blocked database: the list still works for this visit.
    persistent.value = false
  }
}

/**
 * Saved palettes (recently used and favorites) in the browser.
 */
export function usePaletteLibrary() {
  init()

  const favorites = computed(() => entries.value.filter((e) => e.favorite))
  const recent = computed(() => entries.value.filter((e) => !e.favorite))

  return {
    entries,
    favorites,
    recent,
    /** False when entries only last until the page is reloaded. */
    persistent,
    ready: () => init(),
    /** Records a palette as used (copied, downloaded, shared, handed over). */
    record: (hexes: readonly string[], source: LibrarySource) =>
      update((list) => addEntry(list, hexes, { source })),
    /** Records a palette and marks it as a favorite. */
    saveFavorite: (hexes: readonly string[], source: LibrarySource) =>
      update((list) => addEntry(list, hexes, { source, favorite: true })),
    toggleFavorite: (id: string) => update((list) => toggleFavorite(list, id)),
    remove: (id: string) => update((list) => removeEntry(list, id)),
    isFavorite: (hexes: readonly string[]) => findEntry(entries.value, hexes)?.favorite === true,
  }
}

/**
 * Test hook: swap the storage and reset the shared state.
 */
export function resetPaletteLibrary(adapter: LibraryStorage | null = null) {
  storage = adapter
  ready = null
  entries.value = []
  persistent.value = true
}
