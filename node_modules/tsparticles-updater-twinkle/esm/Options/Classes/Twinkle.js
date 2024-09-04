import { TwinkleValues } from "./TwinkleValues";
export class Twinkle {
    constructor() {
        this.lines = new TwinkleValues();
        this.particles = new TwinkleValues();
    }
    load(data) {
        if (!data) {
            return;
        }
        this.lines.load(data.lines);
        this.particles.load(data.particles);
    }
}
