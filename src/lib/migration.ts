// Migration utilities to move data from local storage to database
import { addFoodEntry, getTodayEntries } from './dailyTracking';
import { simpleStorage } from './simpleStorage';

// Interface for old local storage data
interface OldMacroData {
  [date: string]: {
    date: string;
    entries: Array<{
      id: string;
      timestamp: string;
      name: string;
      nutrition: {
        calories: number;
        protein_g: number;
        fat_g: number;
        carbs_g: number;
      };
      healthScore: number;
      confidence: number;
      source?: string;
    }>;
    totals: {
      calories: number;
      protein_g: number;
      fat_g: number;
      carbs_g: number;
    };
  };
}

// Migrate all local storage food data to database
export async function migrateLocalStorageToDatabase(clerkUserId: string): Promise<{
  success: boolean;
  entriesMigrated: number;
  errors: string[];
}> {
  const result = {
    success: false,
    entriesMigrated: 0,
    errors: [] as string[]
  };

  try {
    console.log('🔄 Starting migration from local storage to database...');

    // Get old macro data from local storage
    const oldMacroData = simpleStorage.getItem('caltrax-macro-data') as OldMacroData;
    
    if (!oldMacroData || typeof oldMacroData !== 'object') {
      console.log('ℹ️ No old macro data found in local storage');
      result.success = true;
      return result;
    }

    console.log('📊 Found old macro data with', Object.keys(oldMacroData).length, 'days');

    // Get today's entries from database to avoid duplicates
    const existingEntries = await getTodayEntries(clerkUserId);
    const existingEntryIds = new Set(existingEntries.map(entry => entry.entry_id));

    let totalMigrated = 0;

    // Process each day's data
    for (const [date, dayData] of Object.entries(oldMacroData)) {
      if (!dayData.entries || !Array.isArray(dayData.entries)) {
        continue;
      }

      console.log(`📅 Processing ${date} with ${dayData.entries.length} entries`);

      // Process each food entry
      for (const entry of dayData.entries) {
        try {
          // Skip if entry already exists in database
          if (existingEntryIds.has(entry.id)) {
            console.log(`⏭️ Skipping duplicate entry: ${entry.id}`);
            continue;
          }

          // Convert old format to new format
          const foodData = {
            name: entry.name,
            nutrition: {
              calories: entry.nutrition.calories,
              protein: entry.nutrition.protein_g,
              fat: entry.nutrition.fat_g,
              carbs: entry.nutrition.carbs_g
            },
            score: entry.healthScore || 0,
            confidence: entry.confidence || 0,
            source: (entry.source as 'manual' | 'barcode' | 'ai_vision') || 'manual',
            quantity: 1, // Default quantity for old entries
            unit: 'serving' // Default unit for old entries
          };

          // Add to database
          const dbEntry = await addFoodEntry(clerkUserId, foodData);
          
          if (dbEntry) {
            totalMigrated++;
            console.log(`✅ Migrated entry: ${entry.name}`);
          } else {
            result.errors.push(`Failed to migrate entry: ${entry.name}`);
          }

        } catch (error) {
          const errorMsg = `Error migrating entry ${entry.name}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
    }

    result.entriesMigrated = totalMigrated;
    result.success = result.errors.length === 0;

    if (result.success) {
      console.log(`🎉 Migration completed successfully! Migrated ${totalMigrated} entries`);
      
      // Optionally clear old data after successful migration
      // simpleStorage.removeItem('caltrax-macro-data');
      // console.log('🗑️ Old macro data cleared from local storage');
    } else {
      console.log(`⚠️ Migration completed with ${result.errors.length} errors`);
    }

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}

// Check if migration is needed
export function needsMigration(): boolean {
  try {
    const oldMacroData = simpleStorage.getItem('caltrax-macro-data');
    return oldMacroData && typeof oldMacroData === 'object' && Object.keys(oldMacroData).length > 0;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

// Get migration status
export function getMigrationStatus(): {
  needsMigration: boolean;
  oldDataDays: number;
  oldDataEntries: number;
} {
  try {
    const oldMacroData = simpleStorage.getItem('caltrax-macro-data') as OldMacroData;
    
    if (!oldMacroData || typeof oldMacroData !== 'object') {
      return {
        needsMigration: false,
        oldDataDays: 0,
        oldDataEntries: 0
      };
    }

    const days = Object.keys(oldMacroData).length;
    const totalEntries = Object.values(oldMacroData).reduce(
      (sum, dayData) => sum + (dayData.entries?.length || 0), 
      0
    );

    return {
      needsMigration: days > 0,
      oldDataDays: days,
      oldDataEntries: totalEntries
    };
  } catch (error) {
    console.error('Error getting migration status:', error);
    return {
      needsMigration: false,
      oldDataDays: 0,
      oldDataEntries: 0
    };
  }
}

// Clear old data after successful migration
export function clearOldData(): boolean {
  try {
    simpleStorage.removeItem('caltrax-macro-data');
    console.log('🗑️ Old macro data cleared from local storage');
    return true;
  } catch (error) {
    console.error('Error clearing old data:', error);
    return false;
  }
}

// Backup old data before migration
export function backupOldData(): string | null {
  try {
    const oldMacroData = simpleStorage.getItem('caltrax-macro-data');
    if (oldMacroData) {
      const backup = {
        timestamp: new Date().toISOString(),
        data: oldMacroData
      };
      simpleStorage.setItem('caltrax-macro-data-backup', backup);
      console.log('💾 Old data backed up successfully');
      return 'caltrax-macro-data-backup';
    }
    return null;
  } catch (error) {
    console.error('Error backing up old data:', error);
    return null;
  }
}
