"use client";

export interface LampDef {
  id: string;
  name: string;
  x: number; // player proximity center X percentage (0 - 100)
  y: number; // player proximity center Y percentage (0 - 100)
  renderX: number; // visual asset render X percentage
  renderY: number; // visual asset render Y percentage
  renderWidth: number; // visual asset width percentage
  radius: number; // interaction radius percentage
  featureName: string;
}

export const CANONICAL_BADAL_MAHAL_INTRO =
  "Mere aaka, these royal lamps have gone dark. Light all three and bring Badal Mahal back to life!";

export const BADAL_MAHAL_LAMPS: LampDef[] = [
  {
    id: "lamp_1",
    name: "Left Wall Alcove Diya",
    x: 16.0,
    y: 72.0,
    renderX: 11.2,
    renderY: 60.8,
    renderWidth: 4.4,
    radius: 12.0,
    featureName: "Left Ornate Wall Alcove",
  },
  {
    id: "lamp_2",
    name: "Center Wall Niche Diya",
    x: 43.0,
    y: 72.0,
    renderX: 42.8,
    renderY: 59.0,
    renderWidth: 3.2,
    radius: 12.0,
    featureName: "Center Arched Wall Niche",
  },
  {
    id: "lamp_3",
    name: "Right Wall Alcove Diya",
    x: 84.0,
    y: 72.0,
    renderX: 95.8,
    renderY: 60.0,
    renderWidth: 4.4,
    radius: 14.0,
    featureName: "Right Carved Wall Bracket",
  },
];

