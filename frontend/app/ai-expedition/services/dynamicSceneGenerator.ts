import { GeometryTemplateId, VisualBible, WorldMetadata } from "../types/expedition";

export function generateDynamicSceneSvg(
  templateId: GeometryTemplateId,
  sceneName?: string,
  visualBible?: VisualBible,
  metadata?: Partial<WorldMetadata>
): string {
  const eraText = (metadata?.era || "").toLowerCase() + " " + (metadata?.title || "").toLowerCase() + " " + (metadata?.location || "").toLowerCase();
  const timeOfDay = visualBible?.timeOfDay || "Day";
  const titleText = sceneName || templateId.replace("_", " ").toUpperCase();

  // Detect Era Archetype
  const isMauryan = eraText.includes("mauryan") || eraText.includes("pataliputra") || eraText.includes("ashoka") || eraText.includes("250 bce") || eraText.includes("bce");
  const isVijayanagara = eraText.includes("vijayanagara") || eraText.includes("hampi") || eraText.includes("1500") || eraText.includes("dravidian") || eraText.includes("chola");
  const isRajput = eraText.includes("rajput") || eraText.includes("rajasthan") || eraText.includes("jaipur") || eraText.includes("jodhpur");
  const isAncientNalanda = eraText.includes("nalanda") || eraText.includes("gupta") || eraText.includes("university") || eraText.includes("stupa");

  // Sky & Lighting Color Gradients based on Time & Era
  let skyTop = "#1a2a3a";
  let skyBottom = "#e0c090";
  let primaryColor = "#9a3412"; // Default Sandstone
  let detailColor = "#7c2d12";
  let accentColor = "#f59e0b";
  let groundTop = "#2a1e12";
  let groundBottom = "#0f0b07";

  if (isMauryan) {
    // Ancient Mauryan Wood-Timber & Ochre Palette
    skyTop = "#1e293b";
    skyBottom = "#fdba74"; // Warm Gangetic River Sunset
    primaryColor = "#78350f"; // Rich Timber Wood
    detailColor = "#451a03"; // Dark Teak
    accentColor = "#fbbf24"; // Polished Brass/Bronze
    groundTop = "#3f2305";
    groundBottom = "#1c0d02";
  } else if (isVijayanagara) {
    // Granite & Gold Hampi Palette
    skyTop = "#0f172a";
    skyBottom = "#38bdf8"; // Clear Deccan Sky
    primaryColor = "#4b5563"; // Granite Stone
    detailColor = "#1f2937"; // Dark Basalt
    accentColor = "#f59e0b"; // Temple Gold
    groundTop = "#374151";
    groundBottom = "#111827";
  } else if (isRajput) {
    // Rajasthani Yellow Sandstone
    skyTop = "#312e81";
    skyBottom = "#f43f5e";
    primaryColor = "#d97706"; // Golden Sandstone
    detailColor = "#92400e";
    accentColor = "#fef08a";
  } else if (isAncientNalanda) {
    // Earthen Red Brick & Terracotta
    skyTop = "#1e1b4b";
    skyBottom = "#fb7185";
    primaryColor = "#b91c1c"; // Terracotta Brick
    detailColor = "#7f1d1d";
    accentColor = "#fde047";
  }

  if (timeOfDay.toLowerCase().includes("night")) {
    skyTop = "#030712";
    skyBottom = "#0f172a";
    accentColor = "#60a5fa";
  } else if (timeOfDay.toLowerCase().includes("sunset") || timeOfDay.toLowerCase().includes("dusk")) {
    skyTop = "#4c0519";
    skyBottom = "#f97316";
  }

  // Generate Era-Specific Architectural Elements
  let sceneContent = "";

  if (isMauryan) {
    // Mauryan Empire Era: Pataliputra Timber Palisade + Ashoka Pillar + Torana Gateways
    sceneContent = `
      <!-- Gangetic River Distant Hills -->
      <path d="M 0 380 Q 320 280 640 340 Q 960 260 1280 320 L 1280 520 L 0 520 Z" fill="#334155" opacity="0.5"/>
      <path d="M 0 420 Q 400 350 800 410 Q 1100 360 1280 400 L 1280 520 L 0 520 Z" fill="#1e293b" opacity="0.7"/>

      <!-- Pataliputra Timber Fort Palisade Walls -->
      <rect x="0" y="320" width="1280" height="200" fill="${primaryColor}"/>
      
      <!-- Vertical Teak Log Palisade Details -->
      <g stroke="${detailColor}" stroke-width="4">
        ${Array.from({ length: 32 }, (_, i) => `<line x1="${i * 40}" y1="280" x2="${i * 40}" y2="520"/>`).join("")}
        ${Array.from({ length: 32 }, (_, i) => `<polygon points="${i * 40 - 15},280 ${i * 40},240 ${i * 40 + 15},280" fill="${primaryColor}"/>`).join("")}
      </g>

      <!-- Central Mauryan Wooden Arch / Torana Entrance -->
      <rect x="520" y="320" width="240" height="200" fill="#1c0d02"/>
      <path d="M 480 320 Q 640 220 800 320" fill="none" stroke="${accentColor}" stroke-width="14"/>
      <path d="M 460 290 Q 640 190 820 290" fill="none" stroke="${primaryColor}" stroke-width="10"/>

      <!-- Ashoka Pillar Silhouette with Lion Capital -->
      <rect x="220" y="160" width="30" height="360" fill="#d97706"/>
      <path d="M 205 160 L 265 160 L 255 130 L 215 130 Z" fill="${accentColor}"/>
      <!-- Lion Capital Abacus -->
      <circle cx="235" cy="115" r="22" fill="${accentColor}"/>
      <path d="M 220 100 L 250 100 L 245 80 L 225 80 Z" fill="#fef08a"/>
    `;
  } else if (isVijayanagara) {
    // Vijayanagara / South Indian Empire Era: Monolithic Granite Gopuram Towers & Boulders
    sceneContent = `
      <!-- Hampi Monolithic Boulder Landscape -->
      <ellipse cx="200" cy="420" rx="250" ry="140" fill="${detailColor}"/>
      <ellipse cx="1080" cy="400" rx="300" ry="160" fill="${detailColor}"/>

      <!-- Dravidian Temple Tiered Gopuram Tower -->
      <polygon points="640,60 500,460 780,460" fill="${primaryColor}"/>
      <polygon points="640,90 520,440 760,440" fill="${detailColor}"/>

      <!-- Gopuram Tier Moldings -->
      <rect x="530" y="380" width="220" height="15" fill="${accentColor}"/>
      <rect x="550" y="300" width="180" height="12" fill="${accentColor}"/>
      <rect x="570" y="220" width="140" height="10" fill="${accentColor}"/>
      <rect x="590" y="140" width="100" height="8" fill="${accentColor}"/>

      <!-- Carved Stone Pillars (Mandapa) -->
      <rect x="120" y="300" width="60" height="220" fill="${primaryColor}"/>
      <rect x="300" y="300" width="60" height="220" fill="${detailColor}"/>
      <rect x="920" y="300" width="60" height="220" fill="${detailColor}"/>
      <rect x="1100" y="300" width="60" height="220" fill="${primaryColor}"/>

      <!-- Temple Entrance Arch -->
      <path d="M 560 520 L 560 380 Q 640 320 720 380 L 720 520 Z" fill="#090d16"/>
    `;
  } else {
    // Default Heritage Fort / Palace Architecture
    sceneContent = `
      <!-- Main Citadel Wall -->
      <rect x="0" y="260" width="1280" height="260" fill="${primaryColor}"/>
      <rect x="0" y="230" width="1280" height="30" fill="${detailColor}"/>
      
      <!-- Battlements -->
      <g fill="${primaryColor}">
        ${Array.from({ length: 20 }, (_, i) => `<rect x="${i * 65 + 10}" y="190" width="40" height="40"/>`).join("")}
      </g>

      <!-- Monumental Archway -->
      <path d="M 520 520 L 520 380 Q 640 300 760 380 L 760 520 Z" fill="#0d0905"/>
      <path d="M 510 380 Q 640 290 770 380" fill="none" stroke="${accentColor}" stroke-width="12"/>

      <!-- Bastion Towers -->
      <rect x="320" y="200" width="150" height="320" fill="${detailColor}"/>
      <rect x="810" y="200" width="150" height="320" fill="${detailColor}"/>
    `;
  }

  const eraLabel = metadata?.era ? metadata.era.toUpperCase() : "HISTORICAL PERIOD";
  const locationLabel = metadata?.location ? metadata.location.toUpperCase() : "INDIAN HERITAGE";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${skyTop}"/>
        <stop offset="100%" stop-color="${skyBottom}"/>
      </linearGradient>
      <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${groundTop}"/>
        <stop offset="100%" stop-color="${groundBottom}"/>
      </linearGradient>
    </defs>

    <!-- Sky Background -->
    <rect x="0" y="0" width="1280" height="480" fill="url(#skyGrad)"/>

    <!-- Celestial Glow -->
    <circle cx="980" cy="160" r="75" fill="${accentColor}" opacity="0.3"/>

    <!-- Generated Scene Geometry -->
    ${sceneContent}

    <!-- Ground Plane -->
    <rect x="0" y="520" width="1280" height="200" fill="url(#groundGrad)"/>
    <path d="M 0 520 L 1280 520" stroke="${accentColor}" stroke-width="4" opacity="0.5"/>

    <!-- Vignette Framing -->
    <rect x="0" y="0" width="1280" height="720" fill="none" stroke="rgba(0,0,0,0.65)" stroke-width="36"/>

    <!-- Dynamic Scene Branding & Historical Period -->
    <text x="640" y="680" text-anchor="middle" fill="${accentColor}" font-family="serif" font-size="20" font-weight="bold" letter-spacing="3" opacity="0.9">
      ${titleText.toUpperCase()} • ${eraLabel} (${locationLabel})
    </text>
  </svg>
  `;

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
