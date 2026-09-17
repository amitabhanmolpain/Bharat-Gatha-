import re
import sys

filepath = r'c:\Users\ami05\OneDrive\Desktop\BHARAT_GATHA\frontend\app\play\indus\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter, useSearchParams, usePathname } from "next/navigation";\nimport { Suspense } from "react";'
)

# 2. Rename the main component
content = content.replace(
    'export default function IndusValleyGameScreen() {',
    'function IndusValleyGameComponent() {'
)

# 3. Add hooks
content = content.replace(
    '  const router = useRouter();\n  const [isLoading, setIsLoading] = useState(true);',
    '  const router = useRouter();\n  const searchParams = useSearchParams();\n  const pathname = usePathname();\n  const [isLoading, setIsLoading] = useState(true);'
)

# 4. Update the scene state initialization and add sync effect
old_state = '  const [scene, setScene] = useState<IndusSceneType>(INITIAL_INDUS_STATE.scene);'
new_state = '''  const urlScene = searchParams.get("scene") as IndusSceneType | null;
  const [scene, setScene] = useState<IndusSceneType>(urlScene || INITIAL_INDUS_STATE.scene);

  // Sync scene state to URL query parameter
  useEffect(() => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentParams.get("scene") !== scene) {
      currentParams.set("scene", scene);
      router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
    }
  }, [scene, pathname, router, searchParams]);'''
content = content.replace(old_state, new_state)

# 5. Export wrapped component at the end
# The file ends with "  );\n}\n"
wrapper = '''
export default function IndusValleyGameScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#140f0b] text-[#f7eedf] flex items-center justify-center font-serif text-2xl tracking-widest uppercase">Entering Indus Valley...</div>}>
      <IndusValleyGameComponent />
    </Suspense>
  );
}
'''
if not "export default function IndusValleyGameScreen() {" in content:
    content += wrapper

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating page.tsx with searchParams!")
