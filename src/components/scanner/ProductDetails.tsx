import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Info,
  Leaf,
  Plus,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoredProduct, calculateExpiryStatus } from "@/lib/product-storage";
import { filterImportantIngredients, getIngredientInfo } from "@/lib/ingredient-database";
import { UserPreferencesConfig } from "@/lib/parser";

interface ProductDetailsProps {
  product: StoredProduct;
  userPreferences?: UserPreferencesConfig;
  onScanAnother: () => void;
  onViewInventory: () => void;
  onBack?: () => void;
}

export function ProductDetails({
  product,
  userPreferences = {},
  onScanAnother,
  onViewInventory,
  onBack,
}: ProductDetailsProps) {
  const [openIngredient, setOpenIngredient] = useState<string | null>(null);
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  const { important, other } = useMemo(() => {
    return filterImportantIngredients(product.ingredients || []);
  }, [product.ingredients]);

  const displayedIngredients =
    showAllIngredients || important.length === 0
      ? product.ingredients || []
      : important;

  const expiry = calculateExpiryStatus(product.expiry_date);

  // Preference matching
  const preferenceAlerts: { title: string; text: string; ingredient: string }[] = [];
  if (product.ingredients && product.ingredients.length > 0) {
    for (const ing of product.ingredients) {
      const info = getIngredientInfo(ing);
      if (userPreferences.fragranceFree && (info?.isFragrance || /fragrance|parfum/i.test(ing))) {
        preferenceAlerts.push({
          title: "Fragrance detected",
          text: "You marked fragrance-free as a preference. This product contains fragrance.",
          ingredient: ing,
        });
      }
      if (userPreferences.avoidedIngredients) {
        for (const avoided of userPreferences.avoidedIngredients) {
          if (avoided && ing.toLowerCase().includes(avoided.toLowerCase())) {
            preferenceAlerts.push({
              title: `Avoided ingredient: ${avoided}`,
              text: `This matches an ingredient (${ing}) you marked to avoid.`,
              ingredient: ing,
            });
          }
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-rise">
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-9 gap-1.5 px-3 text-xs"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
          )}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
              Product Intelligence
            </span>
            <h1 className="mt-0.5 font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.brand ? `${product.brand} · ` : ""}
              {product.category}
              {product.quantity ? ` · ${product.quantity}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onScanAnother}>
            <ScanLine className="size-4" /> Scan another
          </Button>
          <Button size="sm" onClick={onViewInventory}>
            <Box className="size-4" /> View in inventory
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.3fr]">
        {/* Left Column: Product Summary & Expiry Status */}
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary sm:size-28">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <ImageIcon className="size-8 opacity-40" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded px-2 py-0.5 font-mono text-[11px] font-medium ${
                    expiry.tone === "expired"
                      ? "bg-expired-soft text-expired"
                      : expiry.tone === "warn"
                        ? "bg-warning-soft text-warning"
                        : "bg-safe-soft text-safe"
                  }`}
                >
                  {expiry.badge}
                </span>

                <h3 className="mt-2 truncate font-display text-lg font-semibold">{product.name}</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {product.brand || "Unspecified brand"} · {product.category}
                </p>

                {product.identification_confidence && (
                  <p className="mt-2 font-mono text-[10px] text-safe">
                    ✓ Verified · {product.identification_confidence}% confidence
                  </p>
                )}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Expiry Date</p>
                <p className="mt-1 font-display text-sm font-semibold">
                  {product.expiry_date
                    ? new Date(product.expiry_date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Not specified"}
                </p>
              </div>

              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Status</p>
                <p className="mt-1 font-display text-sm font-semibold">{expiry.statusText}</p>
              </div>

              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Ingredients</p>
                <p className="mt-1 font-display text-sm font-semibold">
                  {product.ingredients?.length || 0} detected
                </p>
              </div>

              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Barcode</p>
                <p className="mt-1 font-mono text-xs font-semibold">{product.barcode || "None"}</p>
              </div>
            </div>

            {/* User Preferences Flag Alerts */}
            {preferenceAlerts.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  Your Preferences Match
                </p>
                {preferenceAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-xs text-warning"
                  >
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {alert.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {alert.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Factual Ingredient Breakdown */}
        <div className="glass-panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold">
                {showAllIngredients ? "All Ingredients" : "Key & Important Ingredients"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {showAllIngredients
                  ? `Showing all ${product.ingredients?.length || 0} ingredients`
                  : `Showing ${important.length} key active & functional ingredients`}
              </p>
            </div>

            {other.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowAllIngredients(!showAllIngredients)}
              >
                {showAllIngredients ? (
                  <>Show Key Only ({important.length})</>
                ) : (
                  <>Show All ({product.ingredients?.length || 0})</>
                )}
              </Button>
            )}
          </div>

          {displayedIngredients.length > 0 ? (
            <div className="space-y-2">
              {displayedIngredients.map((ing) => {
                const info = getIngredientInfo(ing);
                const isOpen = openIngredient === ing;

                return (
                  <div
                    key={ing}
                    className="overflow-hidden rounded-lg border border-border bg-secondary/40 transition-colors hover:bg-secondary/70"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIngredient(isOpen ? null : ing)}
                      className="flex w-full items-center justify-between p-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{info?.name || ing}</span>
                        {info?.category && (
                          <span className="ml-2 inline-block rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                            {info.category}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/60 bg-background/50 p-3.5 text-xs text-muted-foreground">
                        {info ? (
                          <div className="space-y-1.5">
                            <p>
                              <strong className="text-foreground">Purpose:</strong> {info.purpose}
                            </p>
                            {info.considerations && (
                              <p className="text-warning">
                                <strong className="text-foreground">Note:</strong>{" "}
                                {info.considerations}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="italic">
                            Information unavailable in current ingredient database. No assumptions
                            or invented claims are made.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {!showAllIngredients && other.length > 0 && (
                <div className="mt-3 rounded-lg border border-dashed border-border bg-secondary/20 p-3.5 text-center text-xs text-muted-foreground">
                  <p>
                    + {other.length} standard formulation aids (water, thickeners, stabilizers, pH adjusters) omitted for clarity.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 font-medium text-xs text-primary"
                    onClick={() => setShowAllIngredients(true)}
                  >
                    View all {product.ingredients?.length || 0} ingredients
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              <Leaf className="mx-auto mb-2 size-6 opacity-40" />
              No ingredients were detected on this product label.
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Always verify original physical packaging. Ingredient summaries are neutral and for
            informational tracking purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
