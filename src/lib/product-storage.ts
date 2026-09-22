import { supabase } from "@/integrations/supabase/client";

export interface StoredProduct {
  id: string;
  name: string;
  brand?: string | undefined;
  category: string;
  quantity?: string | undefined;
  expiry_date?: string | undefined; // YYYY-MM-DD
  manufacturing_date?: string | undefined;
  ingredients: string[];
  barcode?: string | undefined;
  image_url?: string | undefined;
  identification_confidence?: number | undefined;
  reminder_days?: number | undefined;
  notes?: string | undefined;
  created_at: string;
}

export interface ExpiryStatus {
  statusText: string;
  daysRemaining: number;
  tone: "expired" | "warn" | "safe" | "info";
  badge: string;
}

const GUEST_STORAGE_KEY = "expiryeye_guest_products";

/**
 * Calculate human-readable expiry status and tone.
 */
export function calculateExpiryStatus(expiryDateStr?: string | null): ExpiryStatus {
  if (!expiryDateStr) {
    return {
      statusText: "No expiry set",
      daysRemaining: 9999,
      tone: "info",
      badge: "Unknown",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  if (isNaN(expiry.getTime())) {
    return {
      statusText: "Invalid date",
      daysRemaining: 9999,
      tone: "info",
      badge: "Invalid",
    };
  }

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const ago = Math.abs(diffDays);
    return {
      statusText: ago === 1 ? "Expired yesterday" : `Expired ${ago} days ago`,
      daysRemaining: diffDays,
      tone: "expired",
      badge: `🔴 Expired (${ago}d ago)`,
    };
  }

  if (diffDays === 0) {
    return {
      statusText: "Expires today",
      daysRemaining: 0,
      tone: "expired",
      badge: "🔴 Expires today",
    };
  }

  if (diffDays === 1) {
    return {
      statusText: "Expires tomorrow",
      daysRemaining: 1,
      tone: "warn",
      badge: "🟠 1 day left",
    };
  }

  if (diffDays <= 7) {
    return {
      statusText: `${diffDays} days remaining`,
      daysRemaining: diffDays,
      tone: "warn",
      badge: `🟠 ${diffDays} days left`,
    };
  }

  if (diffDays <= 30) {
    return {
      statusText: `${diffDays} days remaining`,
      daysRemaining: diffDays,
      tone: "safe",
      badge: `🟢 ${diffDays} days left`,
    };
  }

  return {
    statusText: `${diffDays} days remaining`,
    daysRemaining: diffDays,
    tone: "safe",
    badge: `🟢 ${diffDays} days left`,
  };
}

/**
 * Load products from Supabase (if authenticated) or local guest storage.
 */
export async function loadProducts(): Promise<StoredProduct[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (!error && data) {
        return data.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand || undefined,
          category: p.category || "Other",
          quantity: p.quantity || undefined,
          expiry_date: p.expiry_date || undefined,
          manufacturing_date: p.manufacturing_date || undefined,
          ingredients: Array.isArray(p.ingredients) ? (p.ingredients as string[]) : [],
          barcode: p.barcode || undefined,
          image_url: p.image_url || undefined,
          identification_confidence: p.identification_confidence
            ? Number(p.identification_confidence)
            : undefined,
          reminder_days: p.reminder_days,
          notes: p.notes || undefined,
          created_at: p.created_at,
        }));
      }
    }
  } catch (err) {
    console.warn("[Storage] Unable to fetch from Supabase, checking local storage:", err);
  }

  // Fallback to guest localStorage
  return loadGuestProducts();
}

/**
 * Save product to Supabase or guest localStorage.
 */
export async function saveProduct(
  productData: Omit<StoredProduct, "id" | "created_at">,
): Promise<StoredProduct> {
  const nowIso = new Date().toISOString();

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const payload = {
        user_id: userData.user.id,
        name: productData.name,
        brand: productData.brand || null,
        category: productData.category || "Other",
        quantity: productData.quantity || null,
        expiry_date: productData.expiry_date || null,
        manufacturing_date: productData.manufacturing_date || null,
        ingredients: productData.ingredients || [],
        barcode: productData.barcode || null,
        image_url: productData.image_url || null,
        identification_confidence: productData.identification_confidence || null,
        reminder_days: productData.reminder_days || 7,
        notes: productData.notes || null,
      };

      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (!error && data) {
        // Also log scan record
        await supabase.from("scans").insert({
          user_id: userData.user.id,
          product_id: data.id,
          scan_type: productData.barcode ? "barcode" : "camera",
          extracted_data: payload,
          confidence: productData.identification_confidence || null,
          confirmed: true,
        });

        return {
          id: data.id,
          name: data.name,
          brand: data.brand || undefined,
          category: data.category,
          quantity: data.quantity || undefined,
          expiry_date: data.expiry_date || undefined,
          manufacturing_date: data.manufacturing_date || undefined,
          ingredients: Array.isArray(data.ingredients) ? (data.ingredients as string[]) : [],
          barcode: data.barcode || undefined,
          image_url: data.image_url || undefined,
          identification_confidence: data.identification_confidence
            ? Number(data.identification_confidence)
            : undefined,
          reminder_days: data.reminder_days,
          notes: data.notes || undefined,
          created_at: data.created_at,
        };
      }
    }
  } catch (err) {
    console.warn("[Storage] Failed to save to Supabase, falling back to local guest storage:", err);
  }

  // Fallback to local guest storage
  const guestItem: StoredProduct = {
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...productData,
    created_at: nowIso,
  };

  const current = loadGuestProducts();
  const updated = [guestItem, ...current];
  saveGuestProducts(updated);

  return guestItem;
}

/**
 * Remove product by ID.
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user && !id.startsWith("guest_")) {
      await supabase.from("products").delete().eq("id", id);
      return;
    }
  } catch (err) {
    console.warn("[Storage] Error deleting from Supabase:", err);
  }

  const current = loadGuestProducts();
  saveGuestProducts(current.filter((p) => p.id !== id));
}

function loadGuestProducts(): StoredProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveGuestProducts(items: StoredProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("[Storage] Unable to write to localStorage:", err);
  }
}
