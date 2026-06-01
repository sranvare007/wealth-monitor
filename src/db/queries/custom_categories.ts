import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '../../types';

type CustomCategoryRow = {
  id: string;
  label: string;
  icon: string;
  color: string;
  liability: number;
  created: number;
};

function rowToCategory(r: CustomCategoryRow): Category {
  const words = r.label.trim().split(/\s+/);
  const short = words[0].length <= 7 ? words[0] : words[0].substring(0, 7);
  return {
    id: r.id,
    label: r.label,
    short,
    color: r.color,
    icon: r.icon,
    liability: r.liability === 1,
  };
}

export async function getAllCustomCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CustomCategoryRow>(
    'SELECT * FROM custom_categories ORDER BY created ASC',
  );
  return rows.map(rowToCategory);
}

export async function insertCustomCategory(
  db: SQLiteDatabase,
  cat: Category,
  created: number,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO custom_categories (id, label, icon, color, liability, created) VALUES (?, ?, ?, ?, ?, ?)',
    [cat.id, cat.label, cat.icon, cat.color, cat.liability ? 1 : 0, created],
  );
}

export async function updateCustomCategory(
  db: SQLiteDatabase,
  cat: Category,
): Promise<void> {
  await db.runAsync(
    'UPDATE custom_categories SET label = ?, icon = ?, color = ?, liability = ? WHERE id = ?',
    [cat.label, cat.icon, cat.color, cat.liability ? 1 : 0, cat.id],
  );
}

export async function deleteCustomCategory(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM custom_categories WHERE id = ?', [id]);
}
