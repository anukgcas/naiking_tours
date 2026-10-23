import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { CuratedPackage, CURATED_PACKAGES } from '../components/CuratedPackages';
import { SavedPackageItem } from '../types';

export const STORAGE_KEY_SAVED_PACKAGES = 'naiking_saved_packages_v1';

export interface SavedPackagesContextValue {
  savedItems: SavedPackageItem[];
  savedPackages: CuratedPackage[];
  savedCount: number;
  isPackageSaved: (packageId: string) => boolean;
  savePackage: (packageId: string) => boolean;
  removePackage: (packageId: string) => void;
  toggleSavePackage: (packageId: string) => boolean;
  clearAllSavedPackages: () => void;
}

const SavedPackagesContext = createContext<SavedPackagesContextValue | null>(null);

/**
 * Validates and extracts an array of SavedPackageItem from parsed JSON
 */
export function validateSavedPackageItems(raw: unknown): SavedPackageItem[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const valid: SavedPackageItem[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      'packageId' in item &&
      typeof (item as { packageId: unknown }).packageId === 'string'
    ) {
      const packageId = (item as { packageId: string }).packageId.trim();
      if (packageId && !seenIds.has(packageId)) {
        seenIds.add(packageId);
        valid.push({
          packageId,
          savedAt:
            'savedAt' in item && typeof (item as { savedAt: unknown }).savedAt === 'string'
              ? (item as { savedAt: string }).savedAt
              : new Date().toISOString(),
        });
      }
    }
  }

  return valid;
}

/**
 * Hydrates saved package records safely from local storage, pruning any stale IDs
 */
export function loadPersistedSavedPackages(): SavedPackageItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SAVED_PACKAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const items = validateSavedPackageItems(parsed);
    const canonicalIds = new Set(CURATED_PACKAGES.map((p) => p.id));
    return items.filter((item) => canonicalIds.has(item.packageId));
  } catch (err) {
    console.warn('[SavedPackages] Failed to load saved packages from localStorage:', err);
    return [];
  }
}

/**
 * Writes saved package records safely to local storage
 */
export function persistSavedPackages(items: SavedPackageItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_SAVED_PACKAGES, JSON.stringify(items));
  } catch (err) {
    console.warn('[SavedPackages] Failed to write saved packages to localStorage:', err);
  }
}

export const SavedPackagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedItems, setSavedItems] = useState<SavedPackageItem[]>(() => loadPersistedSavedPackages());

  // Synchronize state changes to localStorage
  useEffect(() => {
    persistSavedPackages(savedItems);
  }, [savedItems]);

  // Synchronize across tabs via storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SAVED_PACKAGES && e.newValue !== null) {
        try {
          const updated = validateSavedPackageItems(JSON.parse(e.newValue));
          setSavedItems(updated);
        } catch {
          // ignore corrupted data from external tab
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Map saved package items to actual curated package objects, filtering out stale/invalid IDs
  const savedPackages = useMemo(() => {
    const map = new Map<string, CuratedPackage>();
    for (const pkg of CURATED_PACKAGES) {
      map.set(pkg.id, pkg);
    }

    return savedItems
      .map((item) => map.get(item.packageId))
      .filter((pkg): pkg is CuratedPackage => Boolean(pkg));
  }, [savedItems]);

  const isPackageSaved = useCallback(
    (packageId: string) => {
      return savedItems.some((item) => item.packageId === packageId);
    },
    [savedItems]
  );

  const savePackage = useCallback(
    (packageId: string): boolean => {
      // Validate package exists in canonical catalogue
      const exists = CURATED_PACKAGES.some((p) => p.id === packageId);
      if (!exists) {
        console.warn(`[SavedPackages] Attempted to save non-existent package: ${packageId}`);
        return false;
      }

      let added = false;
      setSavedItems((prev) => {
        if (prev.some((item) => item.packageId === packageId)) {
          return prev; // Prevent duplicate entries
        }
        added = true;
        return [{ packageId, savedAt: new Date().toISOString() }, ...prev];
      });
      return added;
    },
    []
  );

  const removePackage = useCallback((packageId: string) => {
    setSavedItems((prev) => prev.filter((item) => item.packageId !== packageId));
  }, []);

  const toggleSavePackage = useCallback(
    (packageId: string): boolean => {
      const exists = CURATED_PACKAGES.some((p) => p.id === packageId);
      if (!exists) {
        console.warn(`[SavedPackages] Attempted to toggle non-existent package: ${packageId}`);
        return false;
      }

      let isNowSaved = false;
      setSavedItems((prev) => {
        if (prev.some((item) => item.packageId === packageId)) {
          isNowSaved = false;
          return prev.filter((item) => item.packageId !== packageId);
        } else {
          isNowSaved = true;
          return [{ packageId, savedAt: new Date().toISOString() }, ...prev];
        }
      });
      return isNowSaved;
    },
    []
  );

  const clearAllSavedPackages = useCallback(() => {
    setSavedItems([]);
  }, []);

  const value = useMemo<SavedPackagesContextValue>(
    () => ({
      savedItems,
      savedPackages,
      savedCount: savedPackages.length,
      isPackageSaved,
      savePackage,
      removePackage,
      toggleSavePackage,
      clearAllSavedPackages,
    }),
    [
      savedItems,
      savedPackages,
      isPackageSaved,
      savePackage,
      removePackage,
      toggleSavePackage,
      clearAllSavedPackages,
    ]
  );

  return <SavedPackagesContext.Provider value={value}>{children}</SavedPackagesContext.Provider>;
};

export const useSavedPackages = (): SavedPackagesContextValue => {
  const ctx = useContext(SavedPackagesContext);
  if (!ctx) {
    throw new Error('useSavedPackages must be used within a SavedPackagesProvider');
  }
  return ctx;
};
