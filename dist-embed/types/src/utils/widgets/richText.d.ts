export type TTextRun = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    /** The run's own colour as #rrggbb or #rrggbbaa. Absent means the box's colour. */
    color?: string;
    /** An absolute URL. Absent means no link. */
    href?: string;
};
/** One visual line of the box: what a <br> or the edge of a block separates. */
export type TTextLine = TTextRun[];
export type TLineListStyle = 'none' | 'bullet' | 'number';
/**
 * A colour as the editor stores one: #rrggbb, or #rrggbbaa when it is not
 * fully opaque. The browser reports colours as rgb()/rgba() and the picker
 * writes eight-digit hex, so both are read. A colour that is neither — a name,
 * a gradient, a variable — is not one this markup can carry, and is dropped.
 */
export declare function normaliseColor(value: string | null | undefined): string | undefined;
/**
 * A link as the editor stores one. A teacher types "school.org/trips" and
 * means a web address, so a bare host gets https:// put in front of it. A
 * javascript: or data: URL is not a link anybody meant to add to a poster and
 * is dropped, which is what keeps a pasted design from carrying script.
 */
export declare function normaliseHref(value: string | null | undefined): string | undefined;
/**
 * The lines of a text box, each as the runs it is made of.
 *
 * Line breaks come from three places, because three generations of the editor
 * wrote them three ways: a newline character (the old plaintext-only field),
 * a <br>, and the edge of a block (what the browser writes for Enter, and how
 * a list item ends). A <br> that is the last thing in its block is the browser
 * holding an empty row open rather than a line of its own, so it is not
 * counted twice — unless it is the only thing there, in which case it is the
 * row.
 */
export declare function htmlToLines(html: string | undefined): TTextLine[];
/** The plain text of a line, formatting taken off. */
export declare function lineText(line: TTextLine): string;
/** One line's runs as markup, with no line structure round them. */
export declare function runsToHtml(runs: TTextRun[]): string;
/**
 * The `text` a widget should hold to show these lines in this list style.
 *
 * A list is a flat <ul> or <ol> of one <li> per line; an empty item still needs
 * a <br> to hold the row open, or there is nowhere to put the caret. Plain
 * text is the lines joined with <br>, plus one more when the last line is
 * empty — a single trailing <br> draws nothing, so without it the empty last
 * line would be lost on the next read.
 */
export declare function linesToHtml(lines: TTextLine[], listStyle?: TLineListStyle): string;
/**
 * Markup pared back to the allowlist and written in canonical form. What every
 * write from the editor goes through: whatever contentEditable, a paste or an
 * old design produced comes out as the same few tags in the same order.
 */
export declare function sanitiseText(html: string | undefined, listStyle?: TLineListStyle): string;
/** Plain text as the markup a widget holds for it, each newline a line. */
export declare function plainToHtml(text: string, listStyle?: TLineListStyle): string;
/**
 * The widget's markup retyped from plain text, as the panel's text area does
 * it. A change made there is nearly always a word or two, so rather than throw
 * every bold and every link away, the new text is matched line by line against
 * the old and only the characters that actually changed lose their formatting.
 */
export declare function retypeText(html: string | undefined, text: string, listStyle?: TLineListStyle): string;
