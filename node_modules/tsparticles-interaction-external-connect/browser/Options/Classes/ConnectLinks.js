export class ConnectLinks {
    constructor() {
        this.opacity = 0.5;
    }
    load(data) {
        if (!data) {
            return;
        }
        if (data.opacity !== undefined) {
            this.opacity = data.opacity;
        }
    }
}
