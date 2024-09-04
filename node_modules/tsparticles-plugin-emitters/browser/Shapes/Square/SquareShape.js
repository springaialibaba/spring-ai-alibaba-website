import { getRandom } from "tsparticles-engine";
function randomSquareCoordinate(position, offset) {
    return position + offset * (getRandom() - 0.5);
}
export class SquareShape {
    randomPosition(position, size, fill) {
        if (fill) {
            return {
                x: randomSquareCoordinate(position.x, size.width),
                y: randomSquareCoordinate(position.y, size.height),
            };
        }
        else {
            const halfW = size.width / 2, halfH = size.height / 2, side = Math.floor(getRandom() * 4), v = (getRandom() - 0.5) * 2;
            switch (side) {
                case 0:
                    return {
                        x: position.x + v * halfW,
                        y: position.y - halfH,
                    };
                case 1:
                    return {
                        x: position.x - halfW,
                        y: position.y + v * halfH,
                    };
                case 2:
                    return {
                        x: position.x + v * halfW,
                        y: position.y + halfH,
                    };
                case 3:
                default:
                    return {
                        x: position.x + halfW,
                        y: position.y + v * halfH,
                    };
            }
        }
    }
}
