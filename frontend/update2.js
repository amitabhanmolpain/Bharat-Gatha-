const fs = require('fs');
const file = 'c:/Users/ami05/OneDrive/Desktop/BHARAT_GATHA/frontend/app/play/indus/page.tsx';
let text = fs.readFileSync(file, 'utf8');

// Fix scene for Toy Craftsman and add the 3 new merchants
text = text.replace(
  'const isNearToyCraftsman = scene === "caravan_road"',
  'const isNearToyCraftsman = scene === "steatite_seal_workshop"'
);

const newProximities = `
    const isNearMiddleMerchant = scene === "steatite_seal_workshop" && Math.hypot(playerPos.x - 48, playerPos.y - 70) <= 12.0;
    const isNearRightMerchant1 = scene === "steatite_seal_workshop" && Math.hypot(playerPos.x - 63, playerPos.y - 65) <= 12.0;
    const isNearRightMerchant2 = scene === "steatite_seal_workshop" && Math.hypot(playerPos.x - 73, playerPos.y - 60) <= 12.0;
`;
text = text.replace('const isNearToyCraftsman =', newProximities + '\n    const isNearToyCraftsman =');

// Add 3 merchants to the render (under Harappan Couple)
const threeMerchantsRender = `
            {/* 3 Merchants from Vijayanagara/Other */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15" style={{ left: "48%", top: "70%" }}>
              <img src={\`/merchant_1_anim\${artisanFrame}.png\`} alt="Merchant 1" className="w-28 h-auto drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100"><span className="text-[10px] font-bold text-white bg-black/80 px-1 rounded">Press E to Speak</span></div>
            </div>
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15" style={{ left: "63%", top: "65%" }}>
              <img src={\`/merchant_2_anim\${artisanFrame === 1 ? 2 : 1}.png\`} alt="Merchant 2" className="w-28 h-auto drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100"><span className="text-[10px] font-bold text-white bg-black/80 px-1 rounded">Press E to Speak</span></div>
            </div>
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15" style={{ left: "73%", top: "60%" }}>
              <img src={\`/indus_priest_king_follower.png\`} alt="Merchant 3" className="w-28 h-auto drop-shadow-md transform -scale-x-100" style={{ imageRendering: 'pixelated' }} />
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100"><span className="text-[10px] font-bold text-white bg-black/80 px-1 rounded">Press E to Speak</span></div>
            </div>
`;
text = text.replace('{/* Pedestrian/Potter walking across the street (looping full/empty) */}', threeMerchantsRender + '\n            {/* Pedestrian/Potter walking across the street (looping full/empty) */}');

// Move Toy Craftsman dialogue to E key
text = text.replace(
  'if (e.key === "g" || e.key === "G") {\n        if (isNearToyCraftsman)',
  'if (e.key === "g" || e.key === "G") {\n        if (false)'
);

const eKeyLogic = `
        } else if (isNearToyCraftsman) {
          const text = "Welcome to Harappa's toy workshop! We hand-craft solid-wheeled toy bullock carts and humped zebu oxen from fine river clay.";
          setActiveCitizenDialogue({ name: "Harappan Toy Craftsman", title: "Master Artisan", icon: "", text });
          soundFx.playSelect();
          playCharacterDialogue({ character: "toy_craftsman", text });
        } else if (isNearMiddleMerchant) {
          const text = "Spices and rare herbs from the southern lands! My goods have traveled far.";
          setActiveCitizenDialogue({ name: "Traveling Merchant", title: "Spice Trader", icon: "", text });
          soundFx.playSelect();
          playCharacterDialogue({ character: "merchant_1", text });
        } else if (isNearRightMerchant1) {
          const text = "Fresh fruits and farm produce! Harvested from the fertile floodplains of the Indus.";
          setActiveCitizenDialogue({ name: "Local Farmer", title: "Produce Seller", icon: "", text });
          soundFx.playSelect();
          playCharacterDialogue({ character: "merchant_2", text });
        } else if (isNearRightMerchant2) {
          const text = "I offer fine woven cotton and dyed fabrics. The best quality in all of Mohenjo-daro!";
          setActiveCitizenDialogue({ name: "Weaver", title: "Textile Merchant", icon: "", text });
          soundFx.playSelect();
          playCharacterDialogue({ character: "merchant_3", text });
`;

text = text.replace('} else if (isNearHouseDoorway) {', eKeyLogic + '\n          } else if (isNearHouseDoorway) {');

// Fix the UI prompt for the craftsman to say E instead of G
text = text.replace('Press G to Speak', 'Press E to Speak');

fs.writeFileSync(file, text);
console.log('done');
