/** The current revision of the design. Equal twice means nothing changed in between. */
export declare function layoutsRevision(): number;
/** Called, once per burst of changes, whenever the design changes. */
export declare function onLayoutsChange(listener: () => void): () => void;
