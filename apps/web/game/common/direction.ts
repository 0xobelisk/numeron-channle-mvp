export const DIRECTION = Object.freeze({
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  NONE: 'NONE',
});

export type Direction = keyof typeof DIRECTION;
