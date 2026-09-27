const fs = require('fs');
const file = 'c:/Users/ami05/OneDrive/Desktop/BHARAT_GATHA/frontend/app/play/indus/page.tsx';
let text = fs.readFileSync(file, 'utf8');

// Fix the 3 merchants positions and sizes
const oldMerchants = `            {/* 3 Merchants from Vijayanagara/Other */}
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
            </div>`;

const newMerchants = `            {/* 3 Merchants from Vijayanagara/Other */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15 pointer-events-auto group" style={{ left: "48%", top: "77%" }}>
              <img src={\`/merchant_1_anim\${artisanFrame}.png\`} alt="Merchant 1" className="h-[95px] w-auto drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100"><span className="text-[10px] font-bold text-white bg-black/80 px-1 rounded">Press E to Speak</span></div>
            </div>
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15 pointer-events-auto group" style={{ left: "63%", top: "71%" }}>
              <img src={\`/merchant_2_anim\${artisanFrame === 1 ? 2 : 1}.png\`} alt="Merchant 2" className="h-[95px] w-auto drop-shadow-md" style={{ imageRendering: 'pixelated' }} />
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100"><span className="text-[10px] font-bold text-white bg-black/80 px-1 rounded">Press E to Speak</span></div>
            </div>
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15 pointer-events-auto group" style={{ left: "73%", top: "66%" }}>
              <img src={\`/indus_priest_king_follower.png\`} alt="Merchant 3" className="h-[95px] w-auto drop-shadow-md transform -scale-x-100" style={{ imageRendering: 'pixelated' }} />
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100"><span className="text-[10px] font-bold text-white bg-black/80 px-1 rounded">Press E to Speak</span></div>
            </div>`;

text = text.replace(oldMerchants, newMerchants);

// Reduce Harappan couple height
const oldCouple = `            {/* Harappan Couple (standing by the drain) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15"
              style={{ left: "35%", top: "76%" }}
            >
              <img 
                src={\`/sprite-artisans-talk-\${artisanFrame}.png\`} 
                alt="Harappan Couple" 
                className="w-32 h-auto drop-shadow-md transform -scale-x-100" 
                style={{ imageRendering: 'pixelated' }} 
              />
            </div>`;

const newCouple = `            {/* Harappan Couple (standing by the drain) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15"
              style={{ left: "35%", top: "76%" }}
            >
              <img 
                src={\`/sprite-artisans-talk-\${artisanFrame}.png\`} 
                alt="Harappan Couple" 
                className="h-[95px] w-auto drop-shadow-md transform -scale-x-100" 
                style={{ imageRendering: 'pixelated' }} 
              />
            </div>`;

text = text.replace(oldCouple, newCouple);

fs.writeFileSync(file, text);
console.log('done');
