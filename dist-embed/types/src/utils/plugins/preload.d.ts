export default class PreLoad {
    private i;
    private arr;
    constructor(arr: (string | HTMLImageElement | ChildNode[])[]);
    imgs(): Promise<void>;
    doms(): Promise<void>;
    svgs(): Promise<void>;
}
