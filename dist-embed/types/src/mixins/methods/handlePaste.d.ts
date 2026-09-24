/**
 * What a paste off the system clipboard turned into.
 *
 * `none` is the answer the caller acts on: the clipboard had nothing of its own
 * to put on the page, so a widget copied inside the editor is pasted instead.
 * Copying a widget empties the system clipboard for exactly that reason (see
 * `copyWidget`), which is why an empty string counts as nothing here — it is
 * the editor's own marker, not a word anybody copied.
 */
export type TPasteResult = 'image' | 'text' | 'none';
/**
 * Words off the clipboard as the markup a text box holds.
 *
 * A text box is drawn by setting its innerHTML, so what is pasted has to be
 * made into markup rather than dropped in as it came: "A < B" and "Tom & Jerry"
 * were mangled on the way, and a clipboard somebody else filled could carry
 * `<img onerror>`. `plainToHtml` escapes every run and turns each line into a
 * line of the box, which is what typing the same words would have produced.
 */
export declare function clipboardTextToMarkup(text: string): string;
/** Always settles, and says what it did. */
export default function handlePaste(pasteImageFile?: File | null): Promise<TPasteResult>;
/** A new text box holding `text`, as one step of undo. */
export declare function addTextWidget(text: string): void;
