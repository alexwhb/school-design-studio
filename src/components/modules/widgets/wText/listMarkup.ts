/**
 * Bulleted and numbered lists for text widgets.
 *
 * A text widget holds one HTML string and every other text setting — weight,
 * alignment, colour — applies to the whole of it. Lists follow that model: the
 * widget is a list or it is not, and `listStyle` says which. The markers
 * themselves are real <ul>/<ol> markup inside `text`, because that one string
 * is what the editable div, the effect layers, the static renderer and the
 * exporters all read; deriving markers any other way would mean teaching all
 * four about lists separately.
 *
 * The markup is deliberately flat — a single <ul> or <ol> of one-line <li>s.
 * Chromium's editor will happily produce nested lists and stray <div>s once the
 * caret gets going, so what comes back out of the editable div is normalised
 * through here again before it is stored.
 */

export type TListStyle = 'none' | 'bullet' | 'number'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
}

function escapeHtml(text: string) {
  return text.replace(/[&<>]/g, (char) => ESCAPES[char])
}

/**
 * The visual lines of a widget's text, whatever shape its markup is in: plain
 * text with newlines, <br>-separated, or a list the browser has been editing.
 */
export function textToLines(html?: string): string[] {
  const source = String(html ?? '')
  const normalised = source
    // A <br> right before a block close is the browser holding an empty row
    // open, not a line of its own; counting it too would breed a blank line on
    // every round trip.
    .replace(/<br\s*\/?>\s*(?=<\/(li|div|p|h[1-6])>)/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(li|div|p|h[1-6])>/gi, '\n')
  const el = document.createElement('div')
  el.innerHTML = normalised
  const lines = (el.textContent || '').split('\n')
  // Closing the last block left a newline the author never typed. A trailing
  // newline in text that ends in no block at all *was* typed, so it stays.
  if (/<\/(li|div|p|h[1-6]|ul|ol)>\s*$/i.test(source) && lines.length > 1 && !lines[lines.length - 1]) lines.pop()
  return lines
}

/** The `text` a widget should hold to be rendered in the given list style. */
export function applyListStyle(html: string | undefined, style: TListStyle): string {
  const lines = textToLines(html)
  if (style === 'none') return lines.map(escapeHtml).join('<br>')
  const tag = style === 'number' ? 'ol' : 'ul'
  // An empty line still needs a <br> to hold the row open, or the bullet
  // collapses to nothing and there is nowhere to put the caret.
  const items = lines.map((line) => `<li>${line.trim() ? escapeHtml(line) : '<br>'}</li>`)
  return `<${tag}>${items.join('')}</${tag}>`
}

/**
 * Whether the stored markup already says what `listStyle` says. Editing can
 * pull a list apart — pressing Enter on an empty bullet drops the caret into a
 * <div> outside it — so this is what decides when to put it back together.
 */
export function matchesListStyle(html: string | undefined, style: TListStyle): boolean {
  // Text that is not a list is left exactly as the author left it, newlines and
  // all; only list markup has a shape worth insisting on.
  if (style === 'none') return true
  return applyListStyle(html, style) === (html ?? '')
}
