/**
 * Seasonal produce calendar — curated reference data for the pilot region.
 *
 * This is NOT per-listing/inventory data (HomeGrown is a coordination layer,
 * not an ERP — sellers own their own stock via their POS/ERP). It is a
 * static, Northern-Hemisphere temperate-climate calendar used purely to
 * surface "in season now" produce names as tappable Search shortcuts on the
 * home feed. Names are matched against listing names/text search — they do
 * not reference any listing/category IDs.
 */

export const SEASONAL_PRODUCE: Record<number, string[]> = {
  1: ["Kale", "Cabbage", "Citrus", "Carrots", "Potatoes", "Winter Squash", "Leeks"],
  2: ["Kale", "Cabbage", "Citrus", "Carrots", "Potatoes", "Turnips", "Leeks"],
  3: ["Spinach", "Radishes", "Asparagus", "Peas", "Lettuce", "Carrots", "Rhubarb"],
  4: ["Asparagus", "Spinach", "Radishes", "Peas", "Lettuce", "Strawberries", "Rhubarb"],
  5: ["Strawberries", "Asparagus", "Peas", "Lettuce", "Spinach", "Radishes", "Herbs"],
  6: ["Strawberries", "Cherries", "Zucchini", "Peas", "Lettuce", "Blueberries", "Herbs"],
  7: ["Tomatoes", "Zucchini", "Corn", "Peaches", "Blueberries", "Cucumbers", "Basil", "Peppers"],
  8: ["Tomatoes", "Corn", "Peaches", "Melons", "Cucumbers", "Peppers", "Eggplant", "Basil"],
  9: ["Tomatoes", "Apples", "Corn", "Peppers", "Grapes", "Pumpkins", "Eggplant"],
  10: ["Apples", "Pumpkins", "Winter Squash", "Pears", "Broccoli", "Cauliflower", "Sweet Potatoes"],
  11: ["Apples", "Pears", "Winter Squash", "Sweet Potatoes", "Broccoli", "Brussels Sprouts", "Cranberries"],
  12: ["Kale", "Winter Squash", "Citrus", "Carrots", "Potatoes", "Leeks", "Brussels Sprouts"],
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Returns the current month's in-season produce plus a display label.
 * Accepts an injectable `date` (defaults to `new Date()`) so callers/tests
 * can control the month without mocking global time.
 */
export function getSeasonalProduce(date: Date = new Date()): {
  monthLabel: string;
  produce: string[];
} {
  const monthIndex = date.getMonth(); // 0-11
  const month = monthIndex + 1; // 1-12
  return {
    monthLabel: MONTH_LABELS[monthIndex],
    produce: SEASONAL_PRODUCE[month] ?? [],
  };
}
