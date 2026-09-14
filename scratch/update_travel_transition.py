import re

filepath = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add travelDestinationName state
content = content.replace(
    '  const [isLoadingToHarappa, setIsLoadingToHarappa] = useState(false);\n  const [harappaTravelProgress, setHarappaTravelProgress] = useState(0);',
    '  const [isLoadingToHarappa, setIsLoadingToHarappa] = useState(false);\n  const [harappaTravelProgress, setHarappaTravelProgress] = useState(0);\n  const [travelDestinationName, setTravelDestinationName] = useState("HARAPPA");'
)

# 2. Update startHarappaTravelTransition definition
old_def = '''  const startHarappaTravelTransition = () => {
    setIsLoadingToHarappa(true);
    setHarappaTravelProgress(0);
    soundFx.playSelect();
    const duration = 8000;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHarappaTravelProgress(progress);
      if (elapsed >= duration) {
        clearInterval(timer);
        setScene("caravan_road");
        setPlayerPos({ x: 45.0, y: 84.0 });
        setIsLoadingToHarappa(false);
      }
    }, 50);
  };'''

new_def = '''  const startLongTravelTransition = (targetScene: IndusSceneType, targetPos: { x: number; y: number }, targetStage: IndusStage, destinationName: string) => {
    setIsLoadingToHarappa(true);
    setHarappaTravelProgress(0);
    setTravelDestinationName(destinationName);
    soundFx.playSelect();
    const duration = 8000;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHarappaTravelProgress(progress);
      if (elapsed >= duration) {
        clearInterval(timer);
        setScene(targetScene);
        setPlayerPos(targetPos);
        setStage(targetStage);
        setIsLoadingToHarappa(false);
      }
    }, 50);
  };'''
content = content.replace(old_def, new_def)

# 3. Update existing calls to startHarappaTravelTransition
content = content.replace(
    'startHarappaTravelTransition();',
    'startLongTravelTransition("caravan_road", { x: 45.0, y: 84.0 }, 2, "HARAPPA");'
)

# 4. Update Caravan Road -> Great Bath transition
content = content.replace(
    'triggerTransition("great_bath_citadel", { x: 68.0, y: 32.0 }, 2, 600);',
    'startLongTravelTransition("great_bath_citadel", { x: 68.0, y: 32.0 }, 2, "MOHENJO-DARO");'
)

# 5. Update Loading Screen Text
content = content.replace(
    'LOADING TO HARAPPA',
    'LOADING TO {travelDestinationName}'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated long travel transitions in page.tsx")
