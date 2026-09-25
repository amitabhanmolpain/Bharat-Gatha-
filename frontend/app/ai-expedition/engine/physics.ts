import { SceneTemplateGeometry } from "../data/sceneTemplates";

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface PlayerPhysicsState {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  facingLeft: boolean;
  isWalking: boolean;
  walkPhase: number;
}

export interface ComputedFramePhysics {
  nextPos: { x: number; y: number };
  facingLeft: boolean;
  isWalking: boolean;
  walkPhase: number;
  scale: number;
  bobOffsetY: number;
  swayRotationDeg: number;
}

export const PLASSEY_CHARACTER_SCALE_MULTIPLIER = 1.18;

export function updatePlayerPhysics(
  current: PlayerPhysicsState,
  inputs: InputState,
  template: SceneTemplateGeometry,
  dt: number = 1
): ComputedFramePhysics {
  let dx = 0;
  let dy = 0;
  const speed = 0.85 * dt;

  if (inputs.left) dx -= speed;
  if (inputs.right) dx += speed;
  if (inputs.up) dy -= speed * 0.85; // perspective compression
  if (inputs.down) dy += speed * 0.85;

  const isMoving = dx !== 0 || dy !== 0;
  let facingLeft = current.facingLeft;
  if (dx < 0) facingLeft = true;
  if (dx > 0) facingLeft = false;

  let walkPhase = current.walkPhase;
  let bobOffsetY = 0;
  let swayRotationDeg = 0;

  if (isMoving) {
    walkPhase += 0.25 * dt;
    bobOffsetY = Math.sin(walkPhase) * 1.8;
    swayRotationDeg = Math.sin(walkPhase * 0.5) * 1.5;
  }

  // Calculate prospective next coordinates
  const rawX = current.x + dx;
  const rawY = current.y + dy;

  // 1. Enforce Walkable Bounds & Trapezoidal Ramp geometry
  let minX = template.walkableBounds.minX;
  let maxX = template.walkableBounds.maxX;
  const minY = template.walkableBounds.minY;
  const maxY = template.walkableBounds.maxY;

  if (template.trapezoidRamp) {
    const ramp = template.trapezoidRamp;
    const progress = Math.max(0, Math.min(1, (rawY - ramp.topY) / (ramp.bottomY - ramp.topY)));
    minX = ramp.topMinX + progress * (ramp.bottomMinX - ramp.topMinX);
    maxX = ramp.topMaxX + progress * (ramp.bottomMaxX - ramp.topMaxX);
  }

  let nextX = Math.max(minX, Math.min(maxX, rawX));
  let nextY = Math.max(minY, Math.min(maxY, rawY));

  // 2. Axis-Independent Sliding Collision against Obstacle Polygons
  for (const obs of template.obstacles) {
    if (nextX >= obs.minX && nextX <= obs.maxX && nextY >= obs.minY && nextY <= obs.maxY) {
      // Check if entry was horizontal or vertical
      if (current.x < obs.minX || current.x > obs.maxX) {
        nextX = current.x; // Block horizontal entry, allow vertical slide
      } else if (current.y < obs.minY || current.y > obs.maxY) {
        nextY = current.y; // Block vertical entry, allow horizontal slide
      } else {
        nextY = obs.maxY + 0.1;
      }
    }
  }

  // 3. Compute Perspective Depth Scale
  const depth = template.depthScale;
  const depthProgress = Math.max(0, Math.min(1, (nextY - depth.minY) / (depth.maxY - depth.minY)));
  const baseScale = depth.minScale + depthProgress * (depth.maxScale - depth.minScale);
  const scale = baseScale * PLASSEY_CHARACTER_SCALE_MULTIPLIER;

  return {
    nextPos: { x: nextX, y: nextY },
    facingLeft,
    isWalking: isMoving,
    walkPhase,
    scale,
    bobOffsetY,
    swayRotationDeg
  };
}

export function isWithinProximity(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  threshold: number = 9.0
): boolean {
  const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  return dist < threshold;
}
