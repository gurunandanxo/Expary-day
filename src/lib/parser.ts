import { getIngredientInfo } from "./ingredient-database";

export interface ParsedScanData {
  productName: string;
  brand: string;
  category: string;
  quantity?: string | undefined;
  expiryDate?: string | undefined; // ISO YYYY-MM-DD
  rawExpiryText?: string | undefined;
  needsDayConfirmation?: boolean | undefined;
  detectedMonthYear?: string | undefined;
  manufacturingDate?: string | undefined;
  ingredients: string[];
  confidence: number;
  preferenceFlags: PreferenceFlag[];
}

export interface PreferenceFlag {
  type: "fragrance" | "avoided_ingredient" | "sensitive_skin" | "dietary";
  title: string;
  message: string;
  ingredient?: string | undefined;
}

export interface UserPreferencesConfig {
  sensitiveSkin?: boolean | undefined;
  fragranceFree?: boolean | undefined;
  vegan?: boolean | undefined;
  vegetarian?: boolean | undefined;
  glutenAvoidance?: boolean | undefined;
  avoidedIngredients?: string[] | undefined;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/**
 * Extract structured product information from raw OCR text with strict factual grounding.
 */
export function extractProductFromOcrText(
  rawText: string,
  ocrConfidence: number,
  userPrefs: UserPreferencesConfig = {},
): ParsedScanData {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log(`[Parser] Processing ${lines.length} lines of OCR text`);

  // 1. Detect Expiry Date
  const expiryResult = detectExpiryDate(rawText);

  // 2. Detect Manufacturing Date
  const mfgResult = detectManufacturingDate(rawText);

  // 3. Detect Quantity / Volume
  const quantity = detectQuantity(rawText);

  // 4. Extract Ingredients
  const ingredients = extractIngredients(rawText);

  // 5. Detect Brand & Product Name
  const { brand, productName } = extractBrandAndProductName(lines);

  // 6. Infer Category
  const category = inferCategory(rawText, ingredients);

  // 7. Check Preferences
  const preferenceFlags = checkUserPreferences(ingredients, userPrefs);

  // Calculate composite confidence
  let confidence = Math.min(100, Math.max(10, ocrConfidence));
  if (productName && expiryResult.expiryDate) {
    confidence = Math.min(98, Math.max(confidence, 85));
  } else if (!productName && !expiryResult.expiryDate && ingredients.length === 0) {
    confidence = Math.min(confidence, 35);
  }

  return {
    productName: productName || "Unknown Product",
    brand: brand || "",
    category,
    quantity: quantity ?? undefined,
    expiryDate: expiryResult.expiryDate ?? undefined,
    rawExpiryText: expiryResult.rawMatch ?? undefined,
    needsDayConfirmation: expiryResult.needsDayConfirmation ?? undefined,
    detectedMonthYear: expiryResult.detectedMonthYear ?? undefined,
    manufacturingDate: mfgResult ?? undefined,
    ingredients,
    confidence,
    preferenceFlags,
  };
}

/**
 * Detect expiry dates matching common formats without inventing missing days.
 */
export function detectExpiryDate(text: string): {
  expiryDate?: string | undefined;
  rawMatch?: string | undefined;
  needsDayConfirmation?: boolean | undefined;
  detectedMonthYear?: string | undefined;
} {
  // Regex 1: Explicit prefixes: EXP, EXPIRES, BEST BEFORE, USE BY, BBE, BB
  const prefixRegex =
    /(?:EXP(?:IRY)?|EXP\.?|EXPIRES|BEST\s*BEFORE|USE\s*BY|USE\s*BEFORE|BBE|BB)\s*[:.-]?\s*([A-Za-z0-9\s/.-]+)/i;
  const match = text.match(prefixRegex);

  if (match && match[1]) {
    const candidate = match[1].slice(0, 30).trim();
    const parsed = parseDateString(candidate);
    if (parsed) {
      return { ...parsed, rawMatch: match[0] ?? "" };
    }
  }

  // Regex 2: Date standalone patterns (e.g. 28/09/2026 or 2026-09-28 or SEP 2026)
  const fullDateMatch = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2}|\d{2})\b/);
  if (fullDateMatch && fullDateMatch[1] && fullDateMatch[2] && fullDateMatch[3]) {
    const parsed = parseDateParts(fullDateMatch[1], fullDateMatch[2], fullDateMatch[3]);
    if (parsed) return { ...parsed, rawMatch: fullDateMatch[0] ?? "" };
  }

  // Regex 3: Month Name + Year (e.g., SEP 2026 or September 2026)
  const monthYearMatch = text.match(
    /\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)[,\s.-]+(20\d{2}|\d{2})\b/i,
  );
  if (monthYearMatch && monthYearMatch[1] && monthYearMatch[2]) {
    const mStr = monthYearMatch[1].toLowerCase();
    const monthNum = MONTH_NAMES[mStr] || 1;
    let year = parseInt(monthYearMatch[2], 10);
    if (year < 100) year += 2000;

    const monthLabel =
      Object.keys(MONTH_NAMES).find((k) => MONTH_NAMES[k] === monthNum && k.length > 3) || mStr;
    const capitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    return {
      needsDayConfirmation: true,
      detectedMonthYear: `${capitalized} ${year}`,
      rawMatch: monthYearMatch[0] ?? "",
    };
  }

  // Regex 4: MM/YYYY without day
  const mmYyyyMatch = text.match(/\b(0[1-9]|1[0-2])[/.-](20\d{2})\b/);
  if (mmYyyyMatch && mmYyyyMatch[1] && mmYyyyMatch[2]) {
    const month = parseInt(mmYyyyMatch[1], 10);
    const year = parseInt(mmYyyyMatch[2], 10);
    const monthName = new Date(year, month - 1, 1).toLocaleString("en", { month: "long" });
    return {
      needsDayConfirmation: true,
      detectedMonthYear: `${monthName} ${year}`,
      rawMatch: mmYyyyMatch[0] ?? "",
    };
  }

  return {};
}

function parseDateString(str: string): {
  expiryDate?: string | undefined;
  needsDayConfirmation?: boolean | undefined;
  detectedMonthYear?: string | undefined;
} | null {
  // Try DD/MM/YYYY or MM/DD/YYYY
  const mFull = str.match(/(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2}|\d{2})/);
  if (mFull && mFull[1] && mFull[2] && mFull[3]) {
    return parseDateParts(mFull[1], mFull[2], mFull[3]);
  }

  // Try Month Year e.g. "SEP 2026" or "09/2026"
  const mMonthYear = str.match(/([a-zA-Z]{3,9})[/\s.-]+(20\d{2}|\d{2})/);
  if (mMonthYear && mMonthYear[1] && mMonthYear[2]) {
    const monthNum = MONTH_NAMES[mMonthYear[1].toLowerCase()];
    if (monthNum) {
      let year = parseInt(mMonthYear[2], 10);
      if (year < 100) year += 2000;
      const mName = mMonthYear[1];
      return {
        needsDayConfirmation: true,
        detectedMonthYear: `${mName.toUpperCase()} ${year}`,
      };
    }
  }

  const mDigits = str.match(/(\d{1,2})[/.-](20\d{2})/);
  if (mDigits && mDigits[1] && mDigits[2]) {
    const month = parseInt(mDigits[1], 10);
    const year = parseInt(mDigits[2], 10);
    if (month >= 1 && month <= 12) {
      const monthName = new Date(year, month - 1, 1).toLocaleString("en", { month: "long" });
      return {
        needsDayConfirmation: true,
        detectedMonthYear: `${monthName} ${year}`,
      };
    }
  }

  return null;
}

function parseDateParts(p1: string, p2: string, p3: string): { expiryDate: string } | null {
  const n1 = parseInt(p1, 10);
  const n2 = parseInt(p2, 10);
  let year = parseInt(p3, 10);
  if (year < 100) year += 2000;

  let day = n1;
  let month = n2;

  if (n1 > 12 && n2 <= 12) {
    day = n1;
    month = n2;
  } else if (n2 > 12 && n1 <= 12) {
    month = n1;
    day = n2;
  }

  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { expiryDate: isoDate };
  }

  return null;
}

function detectManufacturingDate(text: string): string | undefined {
  const mfgMatch = text.match(
    /(?:MFG|MFD|MANUFACTURED|PROD|MFR)\s*[:.-]?\s*(\d{1,2}[/.-]\d{1,2}[/.-](?:20\d{2}|\d{2})|\d{1,2}[/.-]20\d{2})/i,
  );
  if (mfgMatch && mfgMatch[1]) {
    const parts = mfgMatch[1].split(/[/.-]/);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      return `${y}-${String(parts[1]).padStart(2, "0")}-${String(parts[0]).padStart(2, "0")}`;
    }
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[1]}-${String(parts[0]).padStart(2, "0")}-01`;
    }
  }
  return undefined;
}

function detectQuantity(text: string): string | undefined {
  const match = text.match(
    /\b(\d+(?:\.\d+)?)\s*(ml|g|kg|l|oz|fl\.?\s*oz|capsules|tablets|pcs|pieces)\b/i,
  );
  if (match && match[1] && match[2]) {
    return `${match[1]} ${match[2]}`.trim();
  }
  return undefined;
}

function extractIngredients(text: string): string[] {
  const ingredients: string[] = [];

  const markerRegex =
    /(?:INGREDIENTS|INGREDIENT|CONTAINS|COMPOSITION|INHALTSSTOFFE|INGRÉDIENTS)[\s:]+([^\n\r.]+)/i;
  const match = text.match(markerRegex);

  if (match && match[1]) {
    const rawList = match[1];
    const items = rawList.split(/[,;•\n]+/).map((s) => s.trim());
    for (const item of items) {
      const clean = cleanIngredientString(item);
      if (clean && clean.length > 1 && clean.length < 50 && !ingredients.includes(clean)) {
        ingredients.push(clean);
      }
    }
  }

  if (ingredients.length === 0) {
    const words = text.toLowerCase();
    const candidates = [
      "aqua",
      "glycerin",
      "mineral oil",
      "cetyl alcohol",
      "cetearyl alcohol",
      "fragrance",
      "parfum",
      "dimethicone",
      "phenoxyethanol",
      "niacinamide",
      "hyaluronic acid",
      "salicylic acid",
      "shea butter",
      "panthenol",
      "sodium laureth sulfate",
      "tocopherol",
      "potassium sorbate",
      "sodium benzoate",
      "lactic acid",
      "glycolic acid",
      "ceramide",
      "citric acid",
      "sugar",
      "salt",
      "milk",
    ];
    for (const c of candidates) {
      if (words.includes(c)) {
        const info = getIngredientInfo(c);
        const name = info?.name || c.charAt(0).toUpperCase() + c.slice(1);
        if (!ingredients.includes(name)) {
          ingredients.push(name);
        }
      }
    }
  }

  return ingredients;
}

function cleanIngredientString(str: string): string {
  return str
    .replace(/^[:*.\s-]+/, "")
    .replace(/[*.]/g, "")
    .replace(/\b(and|or)\b/gi, "")
    .replace(/\(.*?\)/g, "")
    .trim();
}

function extractBrandAndProductName(lines: string[]): { brand: string; productName: string } {
  const knownBrands = [
    "NIVEA",
    "L'OREAL",
    "L'ORÉAL",
    "DOVE",
    "CERAVE",
    "NEUTROGENA",
    "CETAPHIL",
    "GARNIER",
    "OLAY",
    "VASELINE",
    "COLGATE",
    "CREST",
    "HEAD & SHOULDERS",
    "PANTENE",
    "AVEENO",
    "LA ROCHE-POSAY",
    "THE ORDINARY",
    "KIEHL'S",
    "SEBAMED",
    "BIODERMA",
    "EUCERIN",
    "NESTLE",
    "KELLOGG'S",
    "HEINZ",
    "AMUL",
    "DANONE",
    "KRAFT",
  ];

  let brand = "";
  let productName = "";

  const topLines = lines.slice(0, 6).filter((l) => {
    return !/^(exp|mfg|best|use|\d+[/.-]|\d+$)/i.test(l) && l.length > 2;
  });

  for (const line of topLines) {
    const lineUpper = line.toUpperCase();
    for (const b of knownBrands) {
      if (lineUpper.includes(b)) {
        brand = b;
        break;
      }
    }
    if (brand) break;
  }

  if (!brand && topLines.length > 0) {
    const first = topLines[0];
    if (first && first.length <= 25) {
      brand = first;
    }
  }

  for (const line of topLines) {
    if (line !== brand && line.length > 3) {
      productName = line;
      break;
    }
  }

  if (brand && productName) {
    if (!productName.toLowerCase().includes(brand.toLowerCase())) {
      productName = `${brand} ${productName}`;
    }
  } else if (!productName && brand) {
    productName = brand;
  }

  return { brand, productName };
}

function inferCategory(text: string, ingredients: string[]): string {
  const lower = text.toLowerCase();
  const ingLower = ingredients.map((i) => i.toLowerCase()).join(" ");

  if (
    lower.includes("lotion") ||
    lower.includes("cream") ||
    lower.includes("moisturizer") ||
    lower.includes("serum") ||
    lower.includes("facial") ||
    lower.includes("sunscreen") ||
    ingLower.includes("hyaluronic") ||
    ingLower.includes("niacinamide")
  ) {
    return "Skincare";
  }

  if (
    lower.includes("shampoo") ||
    lower.includes("conditioner") ||
    lower.includes("soap") ||
    lower.includes("wash") ||
    lower.includes("deodorant") ||
    lower.includes("toothpaste")
  ) {
    return "Personal Care";
  }

  if (
    lower.includes("milk") ||
    lower.includes("snack") ||
    lower.includes("chocolate") ||
    lower.includes("flour") ||
    lower.includes("cereal") ||
    lower.includes("juice") ||
    ingLower.includes("sugar") ||
    ingLower.includes("salt")
  ) {
    return "Food";
  }

  return "Personal Care";
}

function checkUserPreferences(
  ingredients: string[],
  prefs: UserPreferencesConfig,
): PreferenceFlag[] {
  const flags: PreferenceFlag[] = [];

  for (const raw of ingredients) {
    const info = getIngredientInfo(raw);

    if (prefs.fragranceFree && (info?.isFragrance || /fragrance|parfum|perfume/i.test(raw))) {
      flags.push({
        type: "fragrance",
        title: "Fragrance detected",
        message: "You marked fragrance-free as a preference. This product contains fragrance.",
        ingredient: raw,
      });
    }

    if (prefs.sensitiveSkin && (info?.considerations || info?.isPotentialAllergen)) {
      flags.push({
        type: "sensitive_skin",
        title: "Potential skin sensitivity",
        message: info?.considerations || `${raw} may require patch testing for sensitive skin.`,
        ingredient: raw,
      });
    }

    if (prefs.avoidedIngredients && prefs.avoidedIngredients.length > 0) {
      for (const avoided of prefs.avoidedIngredients) {
        if (avoided && raw.toLowerCase().includes(avoided.toLowerCase())) {
          flags.push({
            type: "avoided_ingredient",
            title: `Contains avoided item: ${avoided}`,
            message: `This matches an ingredient you previously configured to avoid.`,
            ingredient: raw,
          });
        }
      }
    }

    if (prefs.vegan && info?.isVegan === false) {
      flags.push({
        type: "dietary",
        title: "Non-vegan ingredient",
        message: `${raw} may be derived from animal sources.`,
        ingredient: raw,
      });
    }

    if (prefs.glutenAvoidance && info?.isGlutenFree === false) {
      flags.push({
        type: "dietary",
        title: "Gluten-containing ingredient",
        message: `${raw} contains gluten.`,
        ingredient: raw,
      });
    }
  }

  return flags;
}
