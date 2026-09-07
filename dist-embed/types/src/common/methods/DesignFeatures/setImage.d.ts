export type TItem2DataParam = {
    id?: string | number;
    width: number;
    height: number;
    url: string;
    model?: string;
    canvasWidth?: number;
};
export type TItem2DataResult = {
    width: number;
    height: number;
    canvasWidth: number;
};
export default function setItem2Data(item: TItem2DataParam): Promise<Required<TItem2DataParam>>;
