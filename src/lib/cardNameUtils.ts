/**
 * Card Name Utilities
 *
 * Functions for cleaning and normalizing card names and numbers
 * to improve image matching accuracy.
 */

/**
 * Strip parenthetical and bracket content from card names
 * "Pikachu (Mega Evolution Stamped)" → "Pikachu"
 * "ETB [Glaceon/Vaporeon]" → "ETB"
 */
export function cleanCardName(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, ' ')  // Remove (parenthetical)
    .replace(/\s*\[.*?\]\s*/g, ' ')  // Remove [brackets]
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();
}

/**
 * Extract meaningful base name for searching
 * Handles Tag Team cards, multi-word names, etc.
 *
 * "Garchomp & Giratina GX" → "Garchomp Giratina" (both Pokemon names)
 * "Pikachu VMAX" → "Pikachu"
 * "Articuno & Zapdos & Moltres GX" → "Articuno Zapdos Moltres"
 * "Bulbasaur (Mega Evolution Stamped)" → "Bulbasaur"
 * "Charizard ex" → "Charizard"
 */
export function getBaseName(name: string): string {
  const cleaned = cleanCardName(name);

  // Remove suffixes like GX, EX, VMAX, VSTAR, V, etc.
  const withoutSuffix = cleaned
    .replace(/\s+(GX|EX|VMAX|VSTAR|V|TAG\s*TEAM|BREAK|LV\.\s*X|Prime|Legend)$/i, '')
    .trim();

  // Remove "&" connectors but keep the Pokemon names
  // "Garchomp & Giratina" → "Garchomp Giratina"
  const withoutAmpersand = withoutSuffix
    .replace(/\s*&\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If result is reasonable length, return it
  // Otherwise take first 3-4 meaningful words
  const words = withoutAmpersand.split(' ');
  if (words.length <= 4) {
    return withoutAmpersand;
  }

  // For very long names, take first 4 words
  return words.slice(0, 4).join(' ');
}

/**
 * Normalize card number for comparison
 * "133/132" → "133"
 * "#133" → "133"
 * "SV133" → "133"
 * "TG15/TG30" → "15"
 */
export function normalizeCardNumber(cardNumber: string): string {
  return cardNumber
    .split('/')[0]              // Take first part of "133/132"
    .replace(/^#/, '')          // Remove leading #
    .replace(/^[A-Za-z]+/, '')  // Remove letter prefixes like "SV", "TG"
    .replace(/\D/g, '');        // Keep only digits
}

/**
 * Check if two card numbers match
 */
export function cardNumbersMatch(num1: string | null, num2: string | null): boolean {
  if (!num1 || !num2) return false;
  return normalizeCardNumber(num1) === normalizeCardNumber(num2);
}

/**
 * Get placeholder image path based on item type
 */
export function getPlaceholderForItem(item: {
  category?: string | null;
  grading_company?: string | null;
}): string {
  if (item.category === 'sealed') {
    return '/placeholders/sealed-product.svg';
  }
  if (item.grading_company && item.grading_company !== 'raw') {
    return '/placeholders/graded-slab.svg';
  }
  return '/placeholders/pokemon-card.svg';
}
