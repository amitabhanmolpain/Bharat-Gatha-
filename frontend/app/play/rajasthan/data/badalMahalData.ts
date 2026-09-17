"use client";

export interface LampDef {
  id: string;
  name: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  radius: number; // interaction radius percentage
  featureName: string;
}

export const CANONICAL_BADAL_MAHAL_INTRO =
  "Mere aaka, these royal lamps have gone dark. Light all three and bring Badal Mahal back to life!";

export const BADAL_MAHAL_LAMPS: LampDef[] = [
  {
    id: "lamp_1",
    name: "Left Wall Alcove Diya",
    x: 14.0,
    y: 72.0,
    radius: 9.0,
    featureName: "Left Ornate Wall Alcove",
  },
  {
    id: "lamp_2",
    name: "Center Wall Niche Diya",
    x: 44.0,
    y: 72.0,
    radius: 9.0,
    featureName: "Center Arched Wall Niche",
  },
  {
    id: "lamp_3",
    name: "Right Wall Alcove Diya",
    x: 84.0,
    y: 72.0,
    radius: 9.0,
    featureName: "Right Carved Wall Bracket",
  },
];
