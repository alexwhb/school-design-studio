export default class WebWorker {
    private worker;
    constructor(useWorker: any);
    start(data?: any, cb?: Function): Promise<unknown>;
    send(data?: any): void;
}
