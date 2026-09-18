export default class PointImg {
    private canvas;
    private cvs;
    constructor(img: HTMLImageElement);
    getColorXY(x: number, y: number): Record<string, string>;
}
