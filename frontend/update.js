const fs = require('fs');
const file = 'c:/Users/ami05/OneDrive/Desktop/BHARAT_GATHA/frontend/app/play/indus/page.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  'const isNearCaravanCart =',
  'const isNearToyCraftsman = scene === "caravan_road" && Math.hypot(playerPos.x - 8, playerPos.y - 86) <= 15.0;\n    const isNearCaravanCart ='
);

text = text.replace(
  'if (e.key === "g" || e.key === "G") {\n        if (isNearCaravanCart) {',
  'if (e.key === "g" || e.key === "G") {\n        if (isNearToyCraftsman) {\n          const text = "Welcome to Harappa\'s toy workshop! Along this street, we hand-craft solid-wheeled toy bullock carts, whistling terracotta birds, climbing monkeys, and humped zebu oxen from fine river clay. Standardized toys and artisan goods travel across the entire Indus valley!";\n          setActiveCitizenDialogue({ name: "Harappan Toy Craftsman", title: "Master Artisan of Clay Figurines & Wheeled Toys • Harappa", icon: "", text });\n          soundFx.playSelect();\n          playCharacterDialogue({ character: "toy_craftsman", text });\n        } else if (isNearCaravanCart) {'
);

text = text.replace(
  'src={`/merchant_f${((pedestrianFrame - 1) % 3) + 1}.png`}',
  'src={`/merchant_f${(activeCitizenDialogue?.name === "Harappan Toy Craftsman") ? (((pedestrianFrame - 1) % 3) + 1) : 1}.png`}'
);

text = text.replace(
  'Speak to Craftsman',
  'Press G to Speak'
);

text = text.replace(
  'onClick={() => {\n                setActiveCitizenDialogue({\n                  name: "Harappan Toy Craftsman",\n                  title: "Master Artisan of Clay Figurines & Wheeled Toys • Harappa",\n                  icon: "",\n                  text: "Welcome to Harappa\'s toy workshop! Along this street, we hand-craft solid-wheeled toy bullock carts, whistling terracotta birds, climbing monkeys, and humped zebu oxen from fine river clay. Standardized toys and artisan goods travel across the entire Indus valley!",\n                });\n                soundFx.playSelect();\n              }}',
  ''
);

fs.writeFileSync(file, text);
console.log('done');
