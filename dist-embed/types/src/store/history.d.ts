export declare function changeHistory({ patches, inversePatches }: {
    patches: any;
    inversePatches: any;
}): void;
export declare function handleHistory(action: 'undo' | 'redo'): void;
export declare function pushColorToHistory(color: string): void;
