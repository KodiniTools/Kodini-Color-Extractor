// Shareable palette links: the colors travel in the URL hash
// (/generator#p=264653-2a9d8f-e9c46a), so they never reach a server and the
// links keep working without a backend.

const HASH_KEY = 'p'
// More colors than any palette in the app can hold; caps hand-edited links.
const MAX_LINK_COLORS = 20
const HEX6 = /^[0-9a-f]{6}$/i

/**
 * Encode a list of #RRGGBB colors as the hash fragment (without the '#').
 * Invalid entries are skipped; an empty result yields ''.
 * @param {string[]} hexes
 * @returns {string}
 */
export function encodePaletteHash(hexes) {
  const parts = (hexes || [])
    .map((hex) => String(hex).trim().replace(/^#/, '').toLowerCase())
    .filter((hex) => HEX6.test(hex))
    .slice(0, MAX_LINK_COLORS)
  return parts.length ? `${HASH_KEY}=${parts.join('-')}` : ''
}

/**
 * Read the colors from a location hash ('#p=...' or 'p=...').
 * Returns uppercase #RRGGBB strings, or [] when the hash carries no valid
 * palette. Invalid entries are dropped instead of rejecting the whole link.
 * @param {string} hash
 * @returns {string[]}
 */
export function decodePaletteHash(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''))
  const value = params.get(HASH_KEY)
  if (!value) return []
  return value
    .split('-')
    .filter((hex) => HEX6.test(hex))
    .slice(0, MAX_LINK_COLORS)
    .map((hex) => `#${hex.toUpperCase()}`)
}
