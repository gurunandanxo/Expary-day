import React, { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Tag,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScanSuccessResult } from "./CameraScanner";
import { StoredProduct } from "@/lib/product-storage";
import { isImportantIngredient } from "@/lib/ingredient-database";

interface ScanConfirmationProps {
  scanResult: ScanSuccessResult;
  onConfirm: (confirmedProduct: Omit<StoredProduct, "id" | "created_at">) => void;
  onScanAgain: () => void;
  onBack?: () => void;
}

export function ScanConfirmation({
  scanResult,
  onConfirm,
  onScanAgain,
  onBack,
}: ScanConfirmationProps) {
  const { data, barcode, imagePreviewUrl, source } = scanResult;

  // Editable form state
  const [productName, setProductName] = useState(data.productName || "");
  const [brand, setBrand] = useState(data.brand || "");
  const [category, setCategory] = useState(data.category || "Skincare");
  const [quantity, setQuantity] = useState(data.quantity || "");
  const [expiryDate, setExpiryDate] = useState(data.expiryDate || "");
  const [manufacturingDate, setManufacturingDate] = useState(data.manufacturingDate || "");
  const [reminderDays, setReminderDays] = useState(7);
  const [ingredients, setIngredients] = useState<string[]>(data.ingredients || []);
  const [newIngredient, setNewIngredient] = useState("");
  const [showIngredients, setShowIngredients] = useState(false);
  const [onlyKeyIngredients, setOnlyKeyIngredients] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onConfirm({
      name: productName.trim() || "Scanned Product",
      brand: brand.trim() || undefined,
      category,
      quantity: quantity.trim() || undefined,
      expiry_date: expiryDate || undefined,
      manufacturing_date: manufacturingDate || undefined,
      ingredients,
      barcode: barcode || undefined,
      image_url: imagePreviewUrl || undefined,
      identification_confidence: data.confidence,
      reminder_days: reminderDays,
    });
  };

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <div className="glass-panel overflow-hidden p-5 sm:p-7">
        {/* Header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (onBack ? onBack() : onScanAgain())}
                className="h-7 -ml-1 gap-1 px-2 text-xs"
                aria-label="Go back"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Button>
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                Product Found
              </span>
            </div>
            <span className="rounded-full bg-safe-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-safe">
              {source === "barcode" ? "Barcode Verified" : "OCR Extracted"} · {data.confidence}%
              confidence
            </span>
          </div>
          <h2 className="mt-1.5 font-display text-2xl font-bold">Review & Confirm</h2>
          <p className="text-xs text-muted-foreground">
            Verify the scanned details before saving them to your private inventory.
          </p>
        </div>

        {/* Product Image & Key Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary sm:size-28">
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt={productName} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                <ImageIcon className="size-8 opacity-40" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">
                {brand || "Brand unspecified"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Done Editing" : "Edit All"}
              </Button>
            </div>
            <h3 className="truncate font-display text-xl font-semibold">
              {productName || "Unnamed Product"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {category} {quantity ? `· ${quantity}` : ""}
            </p>
            {barcode && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Barcode: <span className="text-foreground">{barcode}</span>
              </p>
            )}
          </div>
        </div>

        {/* Warning if only Month/Year was detected */}
        {data.needsDayConfirmation && !expiryDate && (
          <div className="mt-5 rounded-lg border border-warning/40 bg-warning-soft p-3.5 text-xs text-warning">
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlert className="size-4 shrink-0" />
              Detected Expiry: {data.detectedMonthYear}
            </p>
            <p className="mt-1 text-muted-foreground">
              The package only specified the month/year. Please select the exact expiry day below.
            </p>
          </div>
        )}

        {/* Form Fields */}
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Product Name *
            </span>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Body Lotion"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Brand</span>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. NIVEA"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Expiry Date *
            </span>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Skincare">Skincare</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Food">Food & Beverage</option>
              <option value="Medicine">Medicine & Health</option>
              <option value="Household">Household</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Quantity / Size
            </span>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 400 ml or 250 g"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Expiry Reminder
            </span>
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={1}>1 day before</option>
              <option value={3}>3 days before</option>
              <option value={7}>7 days before</option>
              <option value={14}>14 days before</option>
              <option value={30}>30 days before</option>
            </select>
          </label>
        </div>

        {/* Ingredients section */}
        <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left text-sm font-medium"
            onClick={() => setShowIngredients(!showIngredients)}
          >
            <span>
              Ingredients Detected ({ingredients.length}
              {ingredients.length > 0
                ? ` · ${ingredients.filter((i) => isImportantIngredient(i)).length} key`
                : ""}
              )
            </span>
            {showIngredients ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {showIngredients && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {onlyKeyIngredients
                    ? `Showing ${ingredients.filter((i) => isImportantIngredient(i)).length} key ingredients`
                    : `Showing all ${ingredients.length} ingredients (★ = key active)`}
                </span>
                {ingredients.some((i) => isImportantIngredient(i)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary"
                    onClick={() => setOnlyKeyIngredients(!onlyKeyIngredients)}
                  >
                    {onlyKeyIngredients ? "Show all" : "Show key only"}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ingredients
                  .map((ing, idx) => ({ ing, idx, isKey: isImportantIngredient(ing) }))
                  .filter(({ isKey }) => !onlyKeyIngredients || isKey)
                  .map(({ ing, idx, isKey }) => {
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ${
                          isKey
                            ? "border border-primary/30 bg-primary/10 font-medium text-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isKey && <span className="text-[10px] text-primary">★</span>}
                        {ing}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${ing}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none"
                  placeholder="Add missing ingredient…"
                />
                <Button size="sm" variant="outline" onClick={handleAddIngredient}>
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2.5 sm:flex-row">
          <Button variant="outline" onClick={onScanAgain}>
            <RefreshCw className="size-4" /> Scan Again
          </Button>
          <Button onClick={handleSave} className="font-medium">
            <Check className="size-4" /> Confirm & View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
