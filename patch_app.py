"""
patch_app.py
Automatically wires QuotaBar + quota logic into App.tsx.
Run from the repo root: python3 patch_app.py
"""

import sys

APP_PATH = 'src/App.tsx'

with open(APP_PATH, 'r') as f:
    src = f.read()

changes = 0

# ── 1. Add imports ────────────────────────────────────────────────────────────
OLD = "import { onAuthStateChanged, User } from 'firebase/auth';"
NEW = """import { onAuthStateChanged, User } from 'firebase/auth';
import { QuotaBar } from './components/QuotaBar';
import { quotaService } from './services/quotaService';"""
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    changes += 1
    print("✅ 1/5 Added imports")
else:
    print("⚠️  1/5 Import line not found — skipping")

# ── 2. Add quota state inside App() ──────────────────────────────────────────
OLD = "  const [userProfile, setUserProfile] = useState<UserProfile>({"
NEW = """  // Quota state
  const [quotaRemaining, setQuotaRemaining] = React.useState<number>(5);
  const [quotaIsPaid, setQuotaIsPaid] = React.useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({"""
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    changes += 1
    print("✅ 2/5 Added quota state")
else:
    print("⚠️  2/5 userProfile useState not found — skipping")

# ── 3. Load quota when user logs in ──────────────────────────────────────────
OLD = "      setIsAuthLoading(false);"
NEW = """      // Load quota
      if (currentUser) {
        try {
          const q = await quotaService.getUserQuota(currentUser.uid);
          if (q) {
            setQuotaRemaining(Math.max(0, q.dailyLimit - q.dailyUsed));
            setQuotaIsPaid(q.plan !== 'free');
          }
        } catch (e) { console.error('[Quota] load error', e); }
      }
      setIsAuthLoading(false);"""
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    changes += 1
    print("✅ 3/5 Added quota load on login")
else:
    print("⚠️  3/5 setIsAuthLoading not found — skipping")

# ── 4. Consume quota + update remaining when session completes ────────────────
OLD = "    setUserProfile(updatedProfile);"
NEW = """    // Consume quota after session
    if (user) {
      try {
        await quotaService.consumeQuota(user.uid, 'conversation');
        const q = await quotaService.getUserQuota(user.uid);
        if (q) setQuotaRemaining(Math.max(0, q.dailyLimit - q.dailyUsed));
      } catch (e) { console.error('[Quota] consume error', e); }
    }

    setUserProfile(updatedProfile);"""
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    changes += 1
    print("✅ 4/5 Added quota consumption on session complete")
else:
    print("⚠️  4/5 setUserProfile(updatedProfile) not found — skipping")

# ── 5. Add QuotaBar to ScenarioSelection render + quota-gate onSelect ─────────
OLD = """            <ScenarioSelection
              key="scenarios"
              userLevel={userProfile.level}
              onSelect={(id) => {
                setSelectedScenario(id);
                setAppState('conversation');
              }}"""
NEW = """            <ScenarioSelection
              key="scenarios"
              userLevel={userProfile.level}
              userId={user?.uid || null}
              quotaRemaining={quotaRemaining}
              quotaIsPaid={quotaIsPaid}
              onSelect={async (id) => {
                if (user && !quotaIsPaid) {
                  const check = await quotaService.canStartSession(user.uid);
                  if (!check.allowed) {
                    alert('You\\'ve used all 5 free sessions today. Come back tomorrow or upgrade to Pro for unlimited access!');
                    return;
                  }
                }
                setSelectedScenario(id);
                setAppState('conversation');
              }}"""
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    changes += 1
    print("✅ 5/5 Added quota gate + QuotaBar props to ScenarioSelection")
else:
    # Try a more flexible match
    print("⚠️  5/5 ScenarioSelection block not found with exact match — trying fallback")
    import re
    pattern = r'(<ScenarioSelection\s+key="scenarios"\s+userLevel=\{userProfile\.level\}\s+onSelect=\{)\(id\) => \{'
    replacement = r'''\1async (id) => {
                if (user && !quotaIsPaid) {
                  const check = await quotaService.canStartSession(user.uid);
                  if (!check.allowed) {
                    alert('You\\'ve used all 5 free sessions today!');
                    return;
                  }
                }
                {'''
    new_src, n = re.subn(pattern, replacement, src, count=1)
    if n:
        src = new_src
        changes += 1
        print("✅ 5/5 Applied fallback quota gate")

# ── 6. Update ScenarioSelection function signature ────────────────────────────
OLD = "function ScenarioSelection({ userLevel, onSelect, onDailyPractice, onDailyVocab, onReset, onSettings }: { userLevel: ProficiencyLevel, onSelect: (id: string) => void, onDailyPractice: () => void, onDailyVocab: () => void, onReset: () => void, onSettings: () => void, key?: string }) {"
NEW = "function ScenarioSelection({ userLevel, userId, quotaRemaining, quotaIsPaid, onSelect, onDailyPractice, onDailyVocab, onReset, onSettings }: { userLevel: ProficiencyLevel, userId: string | null, quotaRemaining: number, quotaIsPaid: boolean, onSelect: (id: string) => void, onDailyPractice: () => void, onDailyVocab: () => void, onReset: () => void, onSettings: () => void, key?: string }) {"
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    print("✅ 6/6 Updated ScenarioSelection signature")
else:
    print("⚠️  6/6 ScenarioSelection signature not found — skipping")

# ── 7. Add QuotaBar inside ScenarioSelection, before the header ───────────────
OLD = '      <header className="mb-12 flex items-end justify-between">'
NEW = """      {/* Quota Progress Bar */}
      <QuotaBar userId={userId} />

      <header className="mb-12 flex items-end justify-between">"""
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    print("✅ 7/7 Added QuotaBar to ScenarioSelection")
else:
    print("⚠️  7/7 header className not found — skipping")

# ── Write ─────────────────────────────────────────────────────────────────────
with open(APP_PATH, 'w') as f:
    f.write(src)

print(f"\n{'='*40}")
print(f"Done! Applied {changes} core changes.")
print("App.tsx has been updated.")
