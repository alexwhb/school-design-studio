export declare function setAppRoot(element: HTMLElement | null): void;
/**
 * The element the editor treats as its own page: `#app` when it owns the tab,
 * or the container it was mounted into when it is embedded in another app.
 */
export declare function getAppRoot(): HTMLElement | null;
/**
 * Where menus, tooltips and toasts are rendered. Standalone that is the body,
 * which is where they have always gone. Embedded it has to be the editor's own
 * root, because the embed build scopes every rule under it — anything portalled
 * to the body would come out unstyled.
 */
export declare function getPortalContainer(): HTMLElement | undefined;
