import { ExternalInteractorBase } from "tsparticles-engine";
export class Pauser extends ExternalInteractorBase {
    constructor(container) {
        super(container);
        this.handleClickMode = (mode) => {
            if (mode !== "pause") {
                return;
            }
            const container = this.container;
            if (container.getAnimationStatus()) {
                container.pause();
            }
            else {
                container.play();
            }
        };
    }
    clear() {
    }
    init() {
    }
    async interact() {
    }
    isEnabled() {
        return true;
    }
    reset() {
    }
}
