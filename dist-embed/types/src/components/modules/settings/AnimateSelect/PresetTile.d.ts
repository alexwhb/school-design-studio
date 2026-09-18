import type { AnimationPreset } from '../../../../common/animations/presets';
export type PresetTileHandle = {
    play: () => void;
};
type Props = {
    preset: AnimationPreset;
    selected?: boolean;
    onChoose: (id: string) => void;
};
declare const PresetTile: import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<PresetTileHandle>>;
export default PresetTile;
