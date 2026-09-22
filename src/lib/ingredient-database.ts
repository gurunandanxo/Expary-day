export interface IngredientInfo {
  name: string;
  category: string;
  purpose: string;
  considerations?: string;
  isFragrance?: boolean;
  isPreservative?: boolean;
  isPotentialAllergen?: boolean;
  isGlutenFree?: boolean;
  isVegan?: boolean;
}

export const INGREDIENT_DATABASE: Record<string, IngredientInfo> = {
  // Solvents & Bases
  aqua: {
    name: "Aqua (Water)",
    category: "Solvent",
    purpose:
      "Purified water used as the primary liquid base in skincare and personal care formulas.",
    isVegan: true,
    isGlutenFree: true,
  },
  water: {
    name: "Water",
    category: "Solvent",
    purpose: "Essential solvent and vehicle for dissolving other active ingredients.",
    isVegan: true,
    isGlutenFree: true,
  },

  // Humectants & Hydrators
  glycerin: {
    name: "Glycerin",
    category: "Humectant",
    purpose:
      "Attracts and binds atmospheric moisture into the stratum corneum to restore hydration.",
    isVegan: true,
    isGlutenFree: true,
  },
  hyaluronicacid: {
    name: "Hyaluronic Acid",
    category: "Humectant",
    purpose:
      "Holds up to 1,000 times its weight in water, helping retain tissue moisture and elasticity.",
    isVegan: true,
    isGlutenFree: true,
  },
  sodiumhyaluronate: {
    name: "Sodium Hyaluronate",
    category: "Humectant",
    purpose: "Salt form of hyaluronic acid with smaller molecular weight for deeper hydration.",
    isVegan: true,
    isGlutenFree: true,
  },
  propyleneglycol: {
    name: "Propylene Glycol",
    category: "Humectant / Solvent",
    purpose: "Enhances moisture retention and assists skin penetration of active ingredients.",
    considerations: "Occasional mild sensitivity in hypersensitive individuals.",
    isVegan: true,
    isGlutenFree: true,
  },
  butyleneglycol: {
    name: "Butylene Glycol",
    category: "Humectant / Solvent",
    purpose: "Provides a light conditioning feel while aiding product spreadability.",
    isVegan: true,
    isGlutenFree: true,
  },
  panthenol: {
    name: "Panthenol (Pro-Vitamin B5)",
    category: "Skin Protectant",
    purpose: "Soothes irritated skin, supports barrier repair, and aids moisture retention.",
    isVegan: true,
    isGlutenFree: true,
  },
  niacinamide: {
    name: "Niacinamide (Vitamin B3)",
    category: "Active Ingredient",
    purpose: "Strengthens skin lipid barrier, improves uneven skin tone, and regulates sebum.",
    isVegan: true,
    isGlutenFree: true,
  },

  // Emollients & Fatty Alcohols
  cetylalcohol: {
    name: "Cetyl Alcohol",
    category: "Emollient / Thickener",
    purpose:
      "Fatty alcohol that conditions the skin, softens rough patches, and stabilizes creams.",
    isVegan: true,
    isGlutenFree: true,
  },
  cetearylalcohol: {
    name: "Cetearyl Alcohol",
    category: "Emollient / Emulsifier",
    purpose:
      "Fatty alcohol blend offering luxurious texture, slip, and skin-conditioning benefits.",
    isVegan: true,
    isGlutenFree: true,
  },
  stearylalcohol: {
    name: "Stearyl Alcohol",
    category: "Emollient",
    purpose: "Helps lock in natural skin moisture and maintains cream consistency.",
    isVegan: true,
    isGlutenFree: true,
  },
  mineraloil: {
    name: "Mineral Oil (Paraffinum Liquidum)",
    category: "Occlusive Emollient",
    purpose:
      "Forms a non-comedogenic physical moisture barrier to prevent transepidermal water loss.",
    isVegan: true,
    isGlutenFree: true,
  },
  petrolatum: {
    name: "Petrolatum (Petroleum Jelly)",
    category: "Occlusive",
    purpose: "Highly effective skin protectant that reduces water loss by more than 98%.",
    isVegan: true,
    isGlutenFree: true,
  },
  dimethicone: {
    name: "Dimethicone",
    category: "Silicone Conditioning Agent",
    purpose: "Provides a velvety smooth sensory feel and creates a breathable protective seal.",
    isVegan: true,
    isGlutenFree: true,
  },
  sheabutter: {
    name: "Shea Butter (Butyrospermum Parkii)",
    category: "Natural Emollient",
    purpose: "Rich in fatty acids and vitamins A and E to deeply nourish dry or cracked skin.",
    isVegan: true,
    isGlutenFree: true,
  },
  jojobaoil: {
    name: "Jojoba Oil (Simmondsia Chinensis)",
    category: "Plant Lipid",
    purpose: "Mimics natural human sebum to soften and balance skin without clogging pores.",
    isVegan: true,
    isGlutenFree: true,
  },
  squalane: {
    name: "Squalane",
    category: "Emollient",
    purpose: "Lightweight, non-greasy lipid that reinforces the natural skin moisture barrier.",
    isVegan: true,
    isGlutenFree: true,
  },
  tocopherol: {
    name: "Tocopherol (Vitamin E)",
    category: "Antioxidant",
    purpose:
      "Protects formulation lipids from rancidity and helps defend skin cells from free radicals.",
    isVegan: true,
    isGlutenFree: true,
  },
  tocopherylacetate: {
    name: "Tocopheryl Acetate",
    category: "Antioxidant",
    purpose: "Stable ester of Vitamin E offering antioxidant support and conditioning.",
    isVegan: true,
    isGlutenFree: true,
  },

  // Fragrance & Aromas
  fragrance: {
    name: "Fragrance / Parfum",
    category: "Fragrance",
    purpose: "Imparts a pleasant aroma or masks intrinsic chemical odors of raw ingredients.",
    considerations:
      "Common source of contact sensitivity; may irritate sensitive or eczema-prone skin.",
    isFragrance: true,
    isPotentialAllergen: true,
  },
  parfum: {
    name: "Parfum",
    category: "Fragrance",
    purpose: "Aromatic blend designed to impart scent.",
    considerations: "May trigger contact dermatitis or sensitivity in reactive skin types.",
    isFragrance: true,
    isPotentialAllergen: true,
  },
  linalool: {
    name: "Linalool",
    category: "Fragrance Component",
    purpose:
      "Naturally occurring terpene alcohol found in floral essential oils providing a fresh scent.",
    considerations: "Can oxidize on air exposure and trigger fragrance allergy.",
    isFragrance: true,
    isPotentialAllergen: true,
  },
  limonene: {
    name: "Limonene",
    category: "Fragrance Component",
    purpose: "Citrus-derived aromatic compound used for citrus aroma and solvent properties.",
    considerations: "May cause photosensitivity or allergic contact reactions.",
    isFragrance: true,
    isPotentialAllergen: true,
  },
  citronellol: {
    name: "Citronellol",
    category: "Fragrance Component",
    purpose: "Floral aromatic component imparting a rosy scent note.",
    isFragrance: true,
    isPotentialAllergen: true,
  },
  geraniol: {
    name: "Geraniol",
    category: "Fragrance Component",
    purpose: "Rose-like fragrance compound commonly isolated from geranium.",
    isFragrance: true,
    isPotentialAllergen: true,
  },

  // Preservatives
  phenoxyethanol: {
    name: "Phenoxyethanol",
    category: "Preservative",
    purpose: "Broad-spectrum preservative preventing growth of bacteria, yeast, and mold.",
    considerations:
      "Well-tolerated global standard alternative to parabens under 1% concentration.",
    isPreservative: true,
    isVegan: true,
    isGlutenFree: true,
  },
  methylparaben: {
    name: "Methylparaben",
    category: "Preservative",
    purpose: "Effective antifungal preservative widely used in foods and personal care.",
    considerations:
      "Subject of consumer avoidance preferences regarding endocrine concern debates.",
    isPreservative: true,
    isPotentialAllergen: true,
  },
  ethylparaben: {
    name: "Ethylparaben",
    category: "Preservative",
    purpose: "Preservative protecting products against microbial spoilage.",
    isPreservative: true,
  },
  propylparaben: {
    name: "Propylparaben",
    category: "Preservative",
    purpose: "Lipid-soluble antimicrobial preservative.",
    isPreservative: true,
  },
  sodiumbenzoate: {
    name: "Sodium Benzoate",
    category: "Food & Cosmetic Preservative",
    purpose: "Acid-active preservative inhibiting mold and yeast development.",
    isPreservative: true,
    isVegan: true,
    isGlutenFree: true,
  },
  potassiumsorbate: {
    name: "Potassium Sorbate",
    category: "Preservative",
    purpose: "Widely used food-grade preservative effective against molds and fungi.",
    isPreservative: true,
    isVegan: true,
    isGlutenFree: true,
  },
  benzylalcohol: {
    name: "Benzyl Alcohol",
    category: "Preservative / Fragrance",
    purpose: "Antimicrobial preservative and natural aromatic constituent.",
    considerations: "Can be irritating to sensitive skin at higher percentages.",
    isPreservative: true,
    isFragrance: true,
  },

  // Surfactants & Cleansers
  sodiumlaurethsulfate: {
    name: "Sodium Laureth Sulfate (SLES)",
    category: "Surfactant / Foaming Agent",
    purpose: "Primary surfactant that produces rich lather and removes sebum and debris.",
    considerations: "Gentler than SLS, but can be drying if used excessively on dehydrated skin.",
  },
  sodiumlaurylsulfate: {
    name: "Sodium Lauryl Sulfate (SLS)",
    category: "Surfactant / Cleanser",
    purpose: "Strong detergent and cleansing agent that creates abundant lather.",
    considerations:
      "Known potential irritant; commonly avoided by sensitive skin or dry scalp users.",
  },
  cocamidopropylbetaine: {
    name: "Cocamidopropyl Betaine",
    category: "Amphoteric Surfactant",
    purpose:
      "Coconut-derived mild secondary surfactant that reduces harshness of primary foaming agents.",
  },
  cocoamphodiacetate: {
    name: "Disodium Cocoamphodiacetate",
    category: "Mild Surfactant",
    purpose: "Ultra-gentle foaming cleanser frequently used in baby shampoos and facial washes.",
  },

  // Actives & Exfoliants
  salicylicacid: {
    name: "Salicylic Acid (BHA)",
    category: "Beta Hydroxy Acid Exfoliant",
    purpose:
      "Lipid-soluble acid that penetrates and clears clogged sebum pores and softens keratin.",
    considerations: "Can cause initial purging or dryness; avoid if allergic to aspirin.",
  },
  glycolicacid: {
    name: "Glycolic Acid (AHA)",
    category: "Alpha Hydroxy Acid Exfoliant",
    purpose: "Smallest AHA molecule that loosens dead surface skin cells to brighten complexion.",
    considerations: "Increases sun sensitivity; always pair with daytime broad-spectrum SPF.",
  },
  lacticacid: {
    name: "Lactic Acid",
    category: "AHA / Natural Moisturizing Factor",
    purpose:
      "Gentle alpha hydroxy acid that exfoliates while simultaneously boosting surface hydration.",
  },
  retinol: {
    name: "Retinol (Vitamin A)",
    category: "Cell-Communicating Active",
    purpose:
      "Stimulates cellular turnover, collagen synthesis, and diminishes appearance of fine lines.",
    considerations: "May cause retinization (dryness, peeling); not recommended during pregnancy.",
  },
  ascorbicacid: {
    name: "Ascorbic Acid (Vitamin C)",
    category: "Antioxidant Active",
    purpose: "Potent free-radical scavenger that helps fade hyperpigmentation and brighten tone.",
  },
  ceramide: {
    name: "Ceramide NP / AP / EOP",
    category: "Skin-Identical Lipid",
    purpose: "Constitutes 50% of healthy skin barrier; replenishes depleted intercellular lipids.",
    isVegan: true,
  },

  // Common Food Ingredients
  sugar: {
    name: "Sugar / Sucrose",
    category: "Sweetener",
    purpose: "Provides sweetness and acts as a natural food humectant and preserver.",
    isVegan: true,
    isGlutenFree: true,
  },
  salt: {
    name: "Salt (Sodium Chloride)",
    category: "Mineral / Seasoning",
    purpose: "Enhances flavor profiles and acts as a natural preservative and thickener.",
    isVegan: true,
    isGlutenFree: true,
  },
  milk: {
    name: "Milk / Dairy Solids",
    category: "Dairy",
    purpose: "Provides creaminess, protein, and calcium in food products.",
    considerations: "Contains lactose; not vegan or dairy-free.",
    isVegan: false,
    isGlutenFree: true,
  },
  wheatflour: {
    name: "Wheat Flour",
    category: "Grain",
    purpose: "Provides structural carbohydrate base and gluten network in baked goods.",
    considerations: "Contains gluten; not suitable for celiac or gluten-intolerant individuals.",
    isGlutenFree: false,
    isVegan: true,
  },
  palmoil: {
    name: "Palm Oil",
    category: "Vegetable Oil",
    purpose: "Semi-solid edible vegetable fat with neutral flavor and high smoke point.",
    considerations: "Frequent subject of sustainability and environmental certifications.",
    isVegan: true,
    isGlutenFree: true,
  },
  soylecithin: {
    name: "Soy Lecithin",
    category: "Emulsifier",
    purpose: "Prevents separation of fats and water in food and confectionary products.",
    considerations: "Derived from soy; relevant for soy allergen tracking.",
    isVegan: true,
    isGlutenFree: true,
  },
};

/**
 * Clean and normalize an ingredient name string for lookup.
 */
export function normalizeIngredientName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Retrieve factual information about an ingredient.
 * If not recognized, returns undefined instead of inventing info.
 */
export function getIngredientInfo(rawName: string): IngredientInfo | undefined {
  const normalized = normalizeIngredientName(rawName);
  if (INGREDIENT_DATABASE[normalized]) {
    return INGREDIENT_DATABASE[normalized];
  }

  // Partial substring match
  for (const [key, val] of Object.entries(INGREDIENT_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }

  return undefined;
}

/**
 * Determines whether an ingredient is a key functional active, primary hydrator/lipid,
 * or significant allergen/fragrance note, as opposed to a minor formulating excipient
 * (such as thickeners, chelators, pH adjusters, or colorants).
 */
export function isImportantIngredient(rawName: string, info?: IngredientInfo): boolean {
  const norm = normalizeIngredientName(rawName);

  // 1. If database entry exists
  if (info) {
    if (info.isFragrance || info.isPotentialAllergen) return true;
    const cat = info.category.toLowerCase();
    if (
      cat.includes("active") ||
      cat.includes("protectant") ||
      cat.includes("antioxidant") ||
      cat.includes("nourishing") ||
      cat.includes("barrier") ||
      cat.includes("lipid") ||
      cat.includes("humectant") ||
      cat.includes("retinoid") ||
      cat.includes("exfoliant") ||
      cat.includes("soothing") ||
      cat.includes("sunscreen")
    ) {
      return true;
    }
  }

  // 2. High-importance active & benefit keywords (cosmetics, personal care, food)
  const KEY_KEYWORDS = [
    "niacinamide",
    "hyaluron",
    "retinol",
    "retin",
    "vitamin",
    "ascorb",
    "tocopher",
    "salicylic",
    "glycolic",
    "lactic",
    "ceramide",
    "peptide",
    "panthenol",
    "squalane",
    "shea",
    "jojoba",
    "argan",
    "aloe",
    "centella",
    "cica",
    "caffeine",
    "zinc",
    "sulfate",
    "paraben",
    "fragrance",
    "parfum",
    "tea tree",
    "collagen",
    "bakuchiol",
    "azelaic",
    "benzoyl",
    "coq10",
    "ubiquinone",
    "glycerin",
    "avobenzone",
    "zinc oxide",
    "titanium dioxide",
    "green tea",
    "licorice",
    "protein",
    "probiotic",
    "ferment",
    "butter",
    "essential oil",
    "honey",
    "oat",
    "curcumin",
    "bha",
    "aha",
  ];

  for (const kw of KEY_KEYWORDS) {
    if (norm.includes(normalizeIngredientName(kw))) {
      return true;
    }
  }

  // 3. Known minor formulating excipients, thickeners, chelating agents, pH adjusters, dyes
  const MINOR_EXCIPIENTS = [
    "edta",
    "carbomer",
    "hydroxide",
    "crosspolymer",
    "polysorbate",
    "polyacrylate",
    "ci",
    "fdc",
    "dc",
    "yellow",
    "red",
    "blue",
    "peg",
    "ceteareth",
    "steareth",
    "sorbate",
    "benzoate",
    "phenoxyethanol",
  ];

  for (const exc of MINOR_EXCIPIENTS) {
    if (norm.includes(exc)) {
      return false;
    }
  }

  return false;
}

/**
 * Splits an ingredient list into Important/Key ingredients and Standard/Formulation ingredients.
 */
export function filterImportantIngredients(ingredients: string[]): {
  important: string[];
  other: string[];
} {
  const important: string[] = [];
  const other: string[] = [];

  for (const ing of ingredients) {
    const info = getIngredientInfo(ing);
    if (isImportantIngredient(ing, info)) {
      important.push(ing);
    } else {
      other.push(ing);
    }
  }

  // Fallback: If no ingredients matched the key keywords (e.g. food with simple names),
  // treat the first 5 ingredients (the primary components by weight) as key.
  if (important.length === 0 && ingredients.length > 0) {
    return {
      important: ingredients.slice(0, 5),
      other: ingredients.slice(5),
    };
  }

  return { important, other };
}

