export interface ExternalProduct {
  name: string;
  brand: string;
  category: string;
  quantity?: string | undefined;
  imageUrl?: string | undefined;
  ingredients: string[];
  barcode: string;
  source: "OpenFoodFacts" | "OpenBeautyFacts" | "OpenProductsFacts";
}

interface RawOpenFactsProduct {
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_front_url?: string;
  image_url?: string;
  ingredients_text?: string;
  ingredients?: Array<{ text?: string; id?: string }>;
}

/**
 * Look up product information by barcode from open databases.
 */
export async function lookupProductByBarcode(barcode: string): Promise<ExternalProduct | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  console.log(`[ProductLookup] Searching for barcode: ${cleanBarcode}`);

  // 1. Try Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`,
      {
        headers: { "User-Agent": "ExpiryEye - Product Scanner Web App (https://expiryeye.app)" },
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        return parseOpenFactsProduct(
          data.product as RawOpenFactsProduct,
          cleanBarcode,
          "OpenFoodFacts",
          "Food",
        );
      }
    }
  } catch (err) {
    console.warn("[ProductLookup] Open Food Facts error:", err);
  }

  // 2. Try Open Beauty Facts (Cosmetics, Skincare, Haircare)
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${encodeURIComponent(cleanBarcode)}.json`,
      {
        headers: { "User-Agent": "ExpiryEye - Product Scanner Web App (https://expiryeye.app)" },
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        return parseOpenFactsProduct(
          data.product as RawOpenFactsProduct,
          cleanBarcode,
          "OpenBeautyFacts",
          "Skincare",
        );
      }
    }
  } catch (err) {
    console.warn("[ProductLookup] Open Beauty Facts error:", err);
  }

  // 3. Try Open Products Facts (General items)
  try {
    const res = await fetch(
      `https://world.openproductsfacts.org/api/v0/product/${encodeURIComponent(cleanBarcode)}.json`,
      {
        headers: { "User-Agent": "ExpiryEye - Product Scanner Web App (https://expiryeye.app)" },
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        return parseOpenFactsProduct(
          data.product as RawOpenFactsProduct,
          cleanBarcode,
          "OpenProductsFacts",
          "Personal Care",
        );
      }
    }
  } catch (err) {
    console.warn("[ProductLookup] Open Products Facts error:", err);
  }

  console.log(`[ProductLookup] Product not found for barcode: ${cleanBarcode}`);
  return null;
}

function parseOpenFactsProduct(
  p: RawOpenFactsProduct,
  barcode: string,
  source: ExternalProduct["source"],
  defaultCategory: string,
): ExternalProduct {
  const name = p.product_name || p.product_name_en || p.generic_name || "Unknown Product";
  const brand = p.brands ? p.brands.split(",")[0]?.trim() || "" : "";

  let category = defaultCategory;
  if (p.categories) {
    const catLower = p.categories.toLowerCase();
    if (
      catLower.includes("skin") ||
      catLower.includes("lotion") ||
      catLower.includes("cream") ||
      catLower.includes("face")
    ) {
      category = "Skincare";
    } else if (
      catLower.includes("hair") ||
      catLower.includes("shampoo") ||
      catLower.includes("soap") ||
      catLower.includes("hygiene")
    ) {
      category = "Personal Care";
    } else if (
      catLower.includes("food") ||
      catLower.includes("snack") ||
      catLower.includes("beverage") ||
      catLower.includes("dairy")
    ) {
      category = "Food";
    }
  }

  // Extract ingredients list
  const ingredients: string[] = [];
  if (Array.isArray(p.ingredients) && p.ingredients.length > 0) {
    for (const item of p.ingredients) {
      const ingName = item.text || item.id;
      if (ingName && typeof ingName === "string") {
        const clean = ingName
          .replace(/^[a-z]{2}:/i, "")
          .replace(/_/g, " ")
          .trim();
        if (clean && !ingredients.includes(clean)) {
          ingredients.push(clean);
        }
      }
    }
  }

  if (ingredients.length === 0 && p.ingredients_text) {
    const split = p.ingredients_text.split(/[,;•\n]+/).map((s: string) => s.trim());
    for (const s of split) {
      const clean = s
        .replace(/^[a-z]{2}:/i, "")
        .replace(/[*_()]/g, "")
        .trim();
      if (clean && clean.length > 1 && !ingredients.includes(clean)) {
        ingredients.push(clean);
      }
    }
  }

  return {
    name,
    brand,
    category,
    quantity: p.quantity ?? undefined,
    imageUrl: p.image_front_url || p.image_url || undefined,
    ingredients,
    barcode,
    source,
  };
}
