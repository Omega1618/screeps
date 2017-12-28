/**
    @param {PathFinder.CostMatrix} foregroundPixels - object pixels. modified for output
    @param {number} oob - value used for pixels outside image bounds
    @return {PathFinder.CostMatrix}

    the oob parameter is used so that if an object pixel is at the image boundary
    you can avoid having that reduce the pixel's value in the final output. Set
    it to a high value (e.g., 255) for this. Set oob to 0 to treat out of bounds
    as background pixels.
*/
// Credit to https://github.com/ScreepsQuorum/screeps-quorum/

function distanceTransform(foregroundPixels, oob = 255) {
    var dist = foregroundPixels; // not a copy. We're modifying the input

    // Variables to represent the 3x3 neighborhood of a pixel.
    var A, B, C;
    var D, E, F;
    var G, H, I;

    var x, y, value;
    for (y = 0; y < 50; ++y) {
        for (x = 0; x < 50; ++x) {
            if (foregroundPixels.get(x, y) !== 0) {
                A = dist.get(x - 1, y - 1); B = dist.get(x    , y - 1); C = dist.get(x + 1, y - 1);
                D = dist.get(x - 1, y    );
                if (y ==  0) { A = oob; B = oob; C = oob; }
                if (x ==  0) { A = oob; D = oob; }
                if (x == 49) { C = oob; }

                dist.set(x, y, Math.min(A, B, C, D) + 1);
            }
        }
    }

    for (y = 49; y >= 0; --y) {
        for (x = 49; x >= 0; --x) {
            ;                           E = dist.get(x   , y    ); F = dist.get(x + 1, y    );
            G = dist.get(x - 1, y + 1); H = dist.get(x   , y + 1); I = dist.get(x + 1, y + 1);
            if (y == 49) { G = oob; H = oob; I = oob; }
            if (x == 49) { F = oob; I = oob; }
            if (x ==  0) { G = oob; }

            value = Math.min(E, F + 1, G + 1, H + 1, I + 1);
            dist.set(x, y, value);
        }
    }

    return dist;
}

/**
    @param {string} roomName
    @return {PathFinder.CostMatrix}
*/
function walkablePixelsForRoom(roomName) {
    var costMatrix = new PathFinder.CostMatrix();
    for (var y = 0; y < 50; ++y) {
        for (var x = 0; x < 50; ++x) {
            if (Game.map.getTerrainAt(x, y, roomName) != 'wall') {
                costMatrix.set(x, y, 1);
            }
        }
    }
    return costMatrix;
}

function wallOrAdjacentToExit(x, y, roomName) {
    if (1 < x && x < 48 && 1 < y && y < 48) return Game.map.getTerrainAt(x, y, roomName) == 'wall';
    if (0 == x || 0 == y || 49 == x || 49 == y) return true;

    if (Game.map.getTerrainAt(x, y, roomName) == 'wall') return true;

    var A, B, C;
    if (x == 1) {
        A = Game.map.getTerrainAt(0, y-1, roomName); B = Game.map.getTerrainAt(0, y, roomName); C = Game.map.getTerrainAt(0, y+1, roomName);
    }
    if (x == 48) {
        A = Game.map.getTerrainAt(49, y-1, roomName); B = Game.map.getTerrainAt(49, y, roomName); C = Game.map.getTerrainAt(49, y+1, roomName);
    }
    if (y == 1) {
        A = Game.map.getTerrainAt(x-1, 0, roomName); B = Game.map.getTerrainAt(x, 0, roomName); C = Game.map.getTerrainAt(x+1, 0, roomName);
    }
    if (y == 48) {
        A = Game.map.getTerrainAt(x-1, 49, roomName); B = Game.map.getTerrainAt(x, 49, roomName); C = Game.map.getTerrainAt(x+1, 49, roomName);
    }
    return !(A == 'wall' && B == 'wall' && C == 'wall');
}

/**
    positions on which you can build blocking structures, such as walls.
    @param {string} roomName
    @return {PathFinder.CostMatrix}
*/
function blockablePixelsForRoom(roomName) {
    var costMatrix = new PathFinder.CostMatrix();
    for (var y = 0; y < 50; ++y) {
        for (var x = 0; x < 50; ++x) {
            if (!wallOrAdjacentToExit(x, y, roomName)) {
                costMatrix.set(x, y, 1);
            }
        }
    }
    return costMatrix;
}

function displayCostMatrix(costMatrix, color = '#ff0000') {
    var vis = new RoomVisual();

    var max = 1;
    for (var y = 0; y < 50; ++y) {
        for (var x = 0; x < 50; ++x) {
            max = Math.max(max, costMatrix.get(x, y));
        }
    }

    for (var y = 0; y < 50; ++y) {
        for (var x = 0; x < 50; ++x) {
            var value = costMatrix.get(x, y);
            if (value > 0) {
                vis.circle(x, y, {radius:costMatrix.get(x, y)/max/2, fill:color});
            }
        }
    }
}


function getTransform (room) {
  return distanceTransform(walkablePixelsForRoom(room))
}

module.exports = {
  distanceTransform: distanceTransform,
  walkablePixelsForRoom: walkablePixelsForRoom,
  wallOrAdjacentToExit: wallOrAdjacentToExit,
  blockablePixelsForRoom: blockablePixelsForRoom,
  getTransform: getTransform,
  displayCostMatrix: displayCostMatrix
}
