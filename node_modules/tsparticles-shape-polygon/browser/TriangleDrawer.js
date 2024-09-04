import { PolygonDrawerBase } from "./PolygonDrawerBase";
export class TriangleDrawer extends PolygonDrawerBase {
    getCenter(particle, radius) {
        return {
            x: -radius,
            y: radius / 1.66,
        };
    }
    getSidesCount() {
        return 3;
    }
    getSidesData(particle, radius) {
        return {
            count: {
                denominator: 2,
                numerator: 3,
            },
            length: radius * 2,
        };
    }
}
