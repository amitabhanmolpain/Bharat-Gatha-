import os
import re

ROOT_DIR = r"c:\Users\Chitra\OneDrive\Desktop\hustel\resume\clg resume\personal\sih\Bharat-Gatha-"

def process_file(filepath, callback):
    full_path = os.path.join(ROOT_DIR, filepath)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        return
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = callback(content)
    if new_content != content:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
    else:
        print(f"No changes for: {filepath}")

def fix_temple_wall(content):
    # Fix TempleWallInspectionController
    # Replace the runSequence timeout with a custom wait
    import textwrap
    
    # We want to change the useEffect to use a better cancellation pattern
    return re.sub(
        r"let stepTimer: NodeJS\.Timeout;.*?const runSequence = async \(\) => {.*?};.*?void runSequence\(\);.*?return \(\) => {.*?};",
        textwrap.dedent("""\
            let isCancelled = false;
            let currentCancelRef: (() => void) | null = null;
            
            const waitWithCancellation = (ms: number) => {
              return new Promise<void>((resolve) => {
                const timer = setTimeout(() => {
                  currentCancelRef = null;
                  resolve();
                }, ms);
                currentCancelRef = () => {
                  clearTimeout(timer);
                  resolve();
                };
              });
            };

            const runSequence = async () => {
              for (let i = 0; i < SCRIPT_STEPS.length; i++) {
                if (isCancelled) break;
                
                setCurrentStepIndex(i);
                const step = SCRIPT_STEPS[i];
                
                setCameraTransformRef.current(step.transform);
                
                void playNarration(step.text, { speaker: "ratan", pace: 0.88, language_code: "en-IN" });

                await waitWithCancellation(step.duration);
              }

              if (isCancelled) return;
              
              // Wait a second before closing
              await waitWithCancellation(1000);
              
              if (!isCancelled) {
                onCompleteRef.current();
              }
            };

            void runSequence();

            return () => {
              isCancelled = true;
              if (currentCancelRef) currentCancelRef();
              stopNarration();
            };"""),
        content,
        flags=re.DOTALL
    )

def fix_pedestrian(content):
    content = re.sub(
        r"useEffect\(\(\) => \{\n\s*if \(isStarted\) \{\n\s*requestRef\.current = requestAnimationFrame\(animate\);\n\s*\}\n\s*return \(\) => \{\n\s*if \(requestRef\.current\) cancelAnimationFrame\(requestRef\.current\);\n\s*\};\n\s*\}, \[isStarted, speed, path, loop, frames\]\);",
        """useEffect(() => {
    if (isStarted) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isStarted]); // Removed path, frames, speed, loop dependencies to avoid restarts. We use refs inside animate.""",
        content,
        flags=re.DOTALL
    )
    
    # We need to make sure the animate function uses refs for speed, path, loop, frames
    content = re.sub(
        r"const requestRef = useRef<number>\(0\);",
        "const requestRef = useRef<number>(0);\n  const propsRef = useRef({ speed, path, loop, frames });\n  useEffect(() => { propsRef.current = { speed, path, loop, frames }; }, [speed, path, loop, frames]);",
        content
    )
    content = re.sub(r"speed \*", "propsRef.current.speed *", content)
    content = re.sub(r"path\.length", "propsRef.current.path.length", content)
    content = re.sub(r"path\[targetIdx\]", "propsRef.current.path[targetIdx]", content)
    content = re.sub(r"if \(loop\)", "if (propsRef.current.loop)", content)
    content = re.sub(r"frames\.length", "propsRef.current.frames.length", content)
    content = re.sub(r"frames\[frame\]", "propsRef.current.frames[frame]", content)
    return content

process_file(r"frontend\app\play\vijayanagara\components\TempleWallInspectionController.tsx", fix_temple_wall)
process_file(r"frontend\app\play\vijayanagara\components\PedestrianNPC.tsx", fix_pedestrian)
