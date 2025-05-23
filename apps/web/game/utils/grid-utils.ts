import { DIRECTION, Direction } from '../common/direction';
import { TILE_SIZE } from '../config';
import { Coordinate } from '../types/typedef';
import { exhaustiveGuard } from './guard';

export function getTargetPositionFromGameObjectPositionAndDirection(
  currentPosition: Coordinate,
  direction: Direction,
): Coordinate {
  const targetPosition: Coordinate = { ...currentPosition };
  switch (direction) {
    case DIRECTION.DOWN:
      targetPosition.y += TILE_SIZE;
      break;
    case DIRECTION.UP:
      targetPosition.y -= TILE_SIZE;
      break;
    case DIRECTION.LEFT:
      targetPosition.x -= TILE_SIZE;
      break;
    case DIRECTION.RIGHT:
      targetPosition.x += TILE_SIZE;
      break;
    case DIRECTION.NONE:
      break;
    default:
      // We should never reach this default case
      exhaustiveGuard(direction);
  }
  return targetPosition;
}

export function getTargetPathToGameObject(
  currentPosition: Coordinate,
  targetPosition: Coordinate,
): {
  directionsToFollow: Direction[];
  pathToFollow: Coordinate[];
} {
  const directionsToFollow: Direction[] = [];
  const pathToFollow: Coordinate[] = [];
  let position = { x: currentPosition.x, y: currentPosition.y };

  // check to see if the current position is on 2d grid
  if (position.x % TILE_SIZE !== 0 || position.y % TILE_SIZE !== 0) {
    console.warn(
      'getTargetPathToGameObject: game object position does not line up with grid based on tile size, will attempt to convert',
    );
    position.x = Math.floor(position.x / TILE_SIZE) * TILE_SIZE;
    position.y = Math.floor(position.y / TILE_SIZE) * TILE_SIZE;
  }

  // check to see if target position is on 2d grid
  const positionToMoveTo = { x: targetPosition.x, y: targetPosition.y };
  if (positionToMoveTo.x % TILE_SIZE !== 0 || positionToMoveTo.y % TILE_SIZE !== 0) {
    console.warn(
      'getTargetPathToGameObject: target position does not line up with grid based on tile size, will attempt to convert',
    );
    positionToMoveTo.x = Math.floor(positionToMoveTo.x / TILE_SIZE) * TILE_SIZE;
    positionToMoveTo.y = Math.floor(positionToMoveTo.y / TILE_SIZE) * TILE_SIZE;
  }

  while (position.x !== targetPosition.x || position.y !== targetPosition.y) {
    const targetDirection = getTargetDirectionFromGameObjectPosition(position, targetPosition);
    directionsToFollow.push(targetDirection);
    position = getTargetPositionFromGameObjectPositionAndDirection(position, targetDirection);
    pathToFollow.push(position);
  }

  return {
    directionsToFollow,
    pathToFollow,
  };
}

export function getTargetDirectionFromGameObjectPosition(
  currentPosition: Coordinate,
  targetPosition: Coordinate,
): Direction {
  let targetDirection: Direction = DIRECTION.RIGHT;
  if (targetPosition.y > currentPosition.y) {
    targetDirection = DIRECTION.DOWN;
  } else if (targetPosition.y < currentPosition.y) {
    targetDirection = DIRECTION.UP;
  } else if (targetPosition.x < currentPosition.x) {
    targetDirection = DIRECTION.LEFT;
  }
  return targetDirection;
}
