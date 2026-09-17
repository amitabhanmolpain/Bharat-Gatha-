import { GeometryTemplateId } from "../types/expedition";

export interface ObstacleBox {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TrapezoidalRamp {
  topY: number;
  bottomY: number;
  topMinX: number;
  topMaxX: number;
  bottomMinX: number;
  bottomMaxX: number;
}

export interface SceneTemplateGeometry {
  id: GeometryTemplateId;
  name: string;
  walkableBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  trapezoidRamp?: TrapezoidalRamp;
  obstacles: ObstacleBox[];
  depthScale: {
    minY: number;
    maxY: number;
    minScale: number;
    maxScale: number;
  };
  defaultSpawn: { x: number; y: number };
  fallbackBackground: string;
}

export const SCENE_TEMPLATES: Record<GeometryTemplateId, SceneTemplateGeometry> = {
  fort_gate: {
    id: "fort_gate",
    name: "Fort Monumental Gate",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 50.0, maxY: 94.0 },
    trapezoidRamp: {
      topY: 55.0,
      bottomY: 94.0,
      topMinX: 35.0,
      topMaxX: 65.0,
      bottomMinX: 2.0,
      bottomMaxX: 98.0
    },
    obstacles: [],
    depthScale: { minY: 50.0, maxY: 94.0, minScale: 0.65, maxScale: 1.15 },
    defaultSpawn: { x: 50.0, y: 78.0 },
    fallbackBackground: ""
  },
  palace_courtyard: {
    id: "palace_courtyard",
    name: "Palace Courtyard & Pavilion",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 42.0, maxY: 90.0 },
    obstacles: [],
    depthScale: { minY: 42.0, maxY: 90.0, minScale: 0.70, maxScale: 1.20 },
    defaultSpawn: { x: 50.0, y: 82.0 },
    fallbackBackground: ""
  },
  fort_courtyard: {
    id: "fort_courtyard",
    name: "Fort Inner Plaza & Colonnade",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 48.0, maxY: 94.0 },
    obstacles: [],
    depthScale: { minY: 48.0, maxY: 94.0, minScale: 0.72, maxScale: 1.22 },
    defaultSpawn: { x: 50.0, y: 85.0 },
    fallbackBackground: ""
  },
  palace_interior: {
    id: "palace_interior",
    name: "Grand Palace Interior",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 55.0, maxY: 94.0 },
    obstacles: [
      { id: "main_desk", minX: 34.0, maxX: 66.0, minY: 72.0, maxY: 79.0 }
    ],
    depthScale: { minY: 55.0, maxY: 94.0, minScale: 0.70, maxScale: 1.15 },
    defaultSpawn: { x: 50.0, y: 84.0 },
    fallbackBackground: ""
  },
  throne_room: {
    id: "throne_room",
    name: "Imperial Throne Room",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 55.0, maxY: 94.0 },
    obstacles: [
      { id: "throne_dais", minX: 36.0, maxX: 64.0, minY: 52.0, maxY: 58.0 }
    ],
    depthScale: { minY: 55.0, maxY: 94.0, minScale: 0.70, maxScale: 1.15 },
    defaultSpawn: { x: 50.0, y: 88.0 },
    fallbackBackground: ""
  },
  corridor: {
    id: "corridor",
    name: "Royal Marble Passage",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 58.0, maxY: 90.0 },
    obstacles: [],
    depthScale: { minY: 58.0, maxY: 90.0, minScale: 0.68, maxScale: 1.25 },
    defaultSpawn: { x: 50.0, y: 86.0 },
    fallbackBackground: ""
  },
  bazaar: {
    id: "bazaar",
    name: "Covered Royal Arcade / Bazaar",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 48.0, maxY: 94.0 },
    obstacles: [],
    depthScale: { minY: 48.0, maxY: 94.0, minScale: 0.75, maxScale: 1.20 },
    defaultSpawn: { x: 50.0, y: 82.0 },
    fallbackBackground: ""
  },
  garden: {
    id: "garden",
    name: "Symmetric Charbagh Garden",
    walkableBounds: { minX: 2.0, maxX: 98.0, minY: 20.0, maxY: 94.0 },
    obstacles: [],
    depthScale: { minY: 20.0, maxY: 94.0, minScale: 0.65, maxScale: 1.30 },
    defaultSpawn: { x: 50.0, y: 84.0 },
    fallbackBackground: ""
  },
  village_square: {
    id: "village_square",
    name: "Settlement Outer Square",
    walkableBounds: { minX: 10.0, maxX: 90.0, minY: 46.0, maxY: 88.0 },
    obstacles: [
      { id: "well", minX: 44.0, maxX: 56.0, minY: 60.0, maxY: 70.0 }
    ],
    depthScale: { minY: 46.0, maxY: 88.0, minScale: 0.70, maxScale: 1.22 },
    defaultSpawn: { x: 75.0, y: 80.0 },
    fallbackBackground: ""
  },
  archive: {
    id: "archive",
    name: "Sandstone Hallway & Archives",
    walkableBounds: { minX: 20.0, maxX: 70.0, minY: 60.0, maxY: 88.0 },
    obstacles: [],
    depthScale: { minY: 60.0, maxY: 88.0, minScale: 0.75, maxScale: 1.20 },
    defaultSpawn: { x: 30.0, y: 84.0 },
    fallbackBackground: ""
  },
  temple_complex: {
    id: "temple_complex",
    name: "Sacred Monumental Complex",
    walkableBounds: { minX: 15.0, maxX: 85.0, minY: 40.0, maxY: 88.0 },
    obstacles: [
      { id: "sanctum_shrine", minX: 40.0, maxX: 60.0, minY: 40.0, maxY: 55.0 }
    ],
    depthScale: { minY: 40.0, maxY: 88.0, minScale: 0.70, maxScale: 1.25 },
    defaultSpawn: { x: 50.0, y: 82.0 },
    fallbackBackground: ""
  },
  fort_rampart: {
    id: "fort_rampart",
    name: "Rampart Gate Approach",
    walkableBounds: { minX: 20.0, maxX: 80.0, minY: 58.0, maxY: 92.0 },
    obstacles: [],
    depthScale: { minY: 58.0, maxY: 92.0, minScale: 0.72, maxScale: 1.24 },
    defaultSpawn: { x: 33.0, y: 90.0 },
    fallbackBackground: ""
  }
};
