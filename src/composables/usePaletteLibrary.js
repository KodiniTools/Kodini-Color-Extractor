import { ref, computed } from 'vue'
import {
  addEntry,
  createIndexedDbStorage,
  createMemoryStorage,
  findEntry,
  removeEntry,
  sanitizeEntries,
  toggleFavorite,
} from '../lib/core/paletteLibrary'

// One list shared by the extractor and the generator, loaded once per page.
const entries = ref([])
const persistent = ref(true)
let storage = null
let ready = null

function init() {
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

async function update(change) {
  await init()
  entries.value = change(entries.value)
  try {
    await storage.save(entries.value)
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
    record: (hexes, source) => update((list) => addEntry(list, hexes, { source })),
    /** Records a palette and marks it as a favorite. */
    saveFavorite: (hexes, source) =>
      update((list) => addEntry(list, hexes, { source, favorite: true })),
    toggleFavorite: (id) => update((list) => toggleFavorite(list, id)),
    remove: (id) => update((list) => removeEntry(list, id)),
    isFavorite: (hexes) => findEntry(entries.value, hexes)?.favorite === true,
  }
}

/**
 * Test hook: swap the storage and reset the shared state.
 * @param {{load: Function, save: Function, persistent: boolean}|null} adapter
 */
export function resetPaletteLibrary(adapter = null) {
  storage = adapter
  ready = null
  entries.value = []
  persistent.value = true
}
