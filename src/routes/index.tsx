import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Box,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  GitCompareArrows,
  Home,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Leaf,
  LogOut,
  PackageSearch,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { User } from "@supabase/supabase-js";
import { CameraScanner, ScanSuccessResult } from "@/components/scanner/CameraScanner";
import { ScanConfirmation } from "@/components/scanner/ScanConfirmation";
import { ProductDetails } from "@/components/scanner/ProductDetails";
import {
  StoredProduct,
  calculateExpiryStatus,
  loadProducts,
  saveProduct,
  deleteProduct,
} from "@/lib/product-storage";
import { UserPreferencesConfig } from "@/lib/parser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExpiryEye — Scan. Understand. Track." },
      {
        name: "description",
        content:
          "Scan products, understand ingredients, and track expiry dates in one private inventory.",
      },
      { property: "og:title", content: "ExpiryEye — Scan. Understand. Track." },
      {
        property: "og:description",
        content: "Your private product scanner, ingredient guide, and expiry tracker.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpiryEye,
});

type View =
  | "home"
  | "products"
  | "scan"
  | "alerts"
  | "compare"
  | "ingredients"
  | "profile"
  | "product_detail";

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Box },
  { id: "scan", label: "Scan Product", icon: ScanLine },
  { id: "alerts", label: "Expiring Soon", icon: Clock3 },
  { id: "ingredients", label: "Ingredients", icon: Leaf },
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "profile", label: "Settings", icon: Settings },
];

const toneStyles = {
  expired: "bg-expired-soft text-expired",
  warn: "bg-warning-soft text-warning",
  safe: "bg-safe-soft text-safe",
  info: "bg-info-soft text-info",
};

function ExpiryEye() {
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Products inventory state
  const [productsList, setProductsList] = useState<StoredProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Active scan state
  const [scanStep, setScanStep] = useState<"camera" | "confirm" | "detail">("camera");
  const [activeScanResult, setActiveScanResult] = useState<ScanSuccessResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StoredProduct | null>(null);

  // User preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferencesConfig>({
    sensitiveSkin: true,
    fragranceFree: true,
    vegan: false,
    vegetarian: false,
    glutenAvoidance: false,
    avoidedIngredients: ["Fragrance"],
  });

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Load products from storage
  const refreshProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const items = await loadProducts();
      setProductsList(items);
    } catch (err) {
      console.error("[ExpiryEye] Failed to load products:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, [currentUser]);

  const changeView = (next: View) => {
    setView(next);
    if (next === "scan") {
      setScanStep("camera");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle successful scan from CameraScanner
  const handleScanComplete = (result: ScanSuccessResult) => {
    setActiveScanResult(result);
    setScanStep("confirm");
  };

  // Handle confirmation and save
  const handleConfirmProduct = async (productToSave: Omit<StoredProduct, "id" | "created_at">) => {
    try {
      const saved = await saveProduct(productToSave);
      await refreshProducts();
      setSelectedProduct(saved);
      setScanStep("detail");
    } catch (err) {
      console.error("[ExpiryEye] Error saving product:", err);
    }
  };

  // Handle product removal
  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    await refreshProducts();
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
      changeView("products");
    }
  };

  // Open product details from any view
  const openProductDetail = (p: StoredProduct) => {
    setSelectedProduct(p);
    setView("product_detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate alerts badge
  const expiringCount = useMemo(() => {
    return productsList.filter((p) => {
      const status = calculateExpiryStatus(p.expiry_date);
      return status.daysRemaining <= 7 && status.daysRemaining >= 0;
    }).length;
  }, [productsList]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-panel/70 px-4 py-6 backdrop-blur-2xl lg:flex">
        <Brand />
        <nav className="mt-7 flex flex-col gap-1" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id || (item.id === "products" && view === "product_detail")}
              alertCount={item.id === "alerts" ? expiringCount : undefined}
              onClick={() => changeView(item.id)}
            />
          ))}
        </nav>
        <Button className="mt-6 w-full" onClick={() => changeView("scan")}>
          <ScanLine className="size-4" /> Scan a product
        </Button>
        <button
          onClick={() => setAuthOpen(true)}
          className="mt-auto flex items-center gap-2.5 border-t border-border px-1 pt-4 text-left"
        >
          <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">
            {currentUser ? currentUser.email?.slice(0, 2).toUpperCase() : "GC"}
          </span>
          <span className="min-w-0 flex-1 truncate">
            <span className="block truncate text-xs font-medium">
              {currentUser ? currentUser.email : "Guest collection"}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {currentUser ? "Cloud synced" : "Sign in to sync"}
            </span>
          </span>
        </button>
      </aside>

      {/* Main App Content Area */}
      <main className="pb-24 lg:ml-60 lg:pb-8">
        <Header
          query={query}
          setQuery={setQuery}
          onProfile={() => setAuthOpen(true)}
          currentUser={currentUser}
        />
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Dashboard View */}
          {view === "home" && (
            <Dashboard
              products={productsList}
              onNavigate={changeView}
              onSelectProduct={openProductDetail}
            />
          )}

          {/* Products Inventory View */}
          {view === "products" && (
            <Products
              products={productsList}
              query={query}
              setQuery={setQuery}
              onScan={() => changeView("scan")}
              onSelectProduct={openProductDetail}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {/* Real Scanner View */}
          {view === "scan" && (
            <div>
              {scanStep === "camera" && (
                <CameraScanner
                  onScanComplete={handleScanComplete}
                  onEnterManually={() => {
                    setActiveScanResult({
                      data: {
                        productName: "",
                        brand: "",
                        category: "Skincare",
                        ingredients: [],
                        confidence: 100,
                        preferenceFlags: [],
                      },
                      source: "manual",
                    });
                    setScanStep("confirm");
                  }}
                  userPreferences={userPreferences}
                />
              )}

              {scanStep === "confirm" && activeScanResult && (
                <ScanConfirmation
                  scanResult={activeScanResult}
                  onConfirm={handleConfirmProduct}
                  onScanAgain={() => setScanStep("camera")}
                />
              )}

              {scanStep === "detail" && selectedProduct && (
                <ProductDetails
                  product={selectedProduct}
                  userPreferences={userPreferences}
                  onScanAnother={() => setScanStep("camera")}
                  onViewInventory={() => changeView("products")}
                />
              )}
            </div>
          )}

          {/* Standalone Product Intelligence View */}
          {view === "product_detail" && selectedProduct && (
            <ProductDetails
              product={selectedProduct}
              userPreferences={userPreferences}
              onScanAnother={() => changeView("scan")}
              onViewInventory={() => changeView("products")}
            />
          )}

          {/* Alerts / Expiring Soon View */}
          {view === "alerts" && (
            <Alerts
              products={productsList}
              onSelectProduct={openProductDetail}
              onScan={() => changeView("scan")}
            />
          )}

          {/* Compare View */}
          {view === "compare" && <Compare products={productsList} />}

          {/* Ingredients Library */}
          {view === "ingredients" && <IngredientLibrary />}

          {/* Settings & User Preferences View */}
          {view === "profile" && (
            <Profile
              userPreferences={userPreferences}
              onUpdatePreferences={setUserPreferences}
              onSignIn={() => setAuthOpen(true)}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav view={view} alertCount={expiringCount} onNavigate={changeView} />

      {/* Auth Modal */}
      {authOpen && <AuthModal currentUser={currentUser} onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ScanLine className="size-5" />
      </div>
      <div>
        <div className="font-display text-base font-semibold">ExpiryEye</div>
        <div className="font-mono text-[9px] uppercase text-muted-foreground">
          Scan. Understand. Track.
        </div>
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  alertCount,
  onClick,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  alertCount?: number | undefined;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      {item.label}
      {item.id === "alerts" && typeof alertCount === "number" && alertCount > 0 && (
        <span className="ml-auto rounded bg-expired-soft px-1.5 font-mono text-[10px] text-expired">
          {alertCount}
        </span>
      )}
    </button>
  );
}

function Header({
  query,
  setQuery,
  onProfile,
  currentUser,
}: {
  query: string;
  setQuery: (v: string) => void;
  onProfile: () => void;
  currentUser: User | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-panel/65 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
        <ShieldCheck className="size-4 text-safe" /> Real scanner · Camera & Barcode ready
      </div>
      <div className="flex items-center gap-2">
        <label className="hidden w-64 items-center gap-2 rounded-lg bg-secondary px-3 py-2 md:flex">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search inventory"
          />
        </label>
        <Button variant="ghost" size="icon" aria-label="Profile" onClick={onProfile}>
          <CircleUserRound className="size-5" />
        </Button>
      </div>
    </header>
  );
}

function Dashboard({
  products,
  onNavigate,
  onSelectProduct,
}: {
  products: StoredProduct[];
  onNavigate: (v: View) => void;
  onSelectProduct: (p: StoredProduct) => void;
}) {
  const expiredCount = products.filter((p) => {
    const s = calculateExpiryStatus(p.expiry_date);
    return s.daysRemaining <= 0;
  }).length;

  const expiringSoonCount = products.filter((p) => {
    const s = calculateExpiryStatus(p.expiry_date);
    return s.daysRemaining > 0 && s.daysRemaining <= 7;
  }).length;

  // Sorted by nearest expiry date
  const useFirstList = useMemo(() => {
    return [...products].sort((a, b) => {
      const sa = calculateExpiryStatus(a.expiry_date).daysRemaining;
      const sb = calculateExpiryStatus(b.expiry_date).daysRemaining;
      return sa - sb;
    });
  }, [products]);

  // Recently added
  const recentList = useMemo(() => {
    return [...products].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products]);

  return (
    <div className="animate-rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase text-primary">Live Inventory</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold lg:text-[28px]">
            Product Intelligence <Sparkles className="size-5 text-warning" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track real product lifecycles and analyze ingredient safety.
          </p>
        </div>
        <Button className="lg:hidden" onClick={() => onNavigate("scan")}>
          <ScanLine className="size-4" /> Scan now
        </Button>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Total products"
          value={String(products.length)}
          note="in your inventory"
          tone="info"
        />
        <Metric
          label="Expiring soon"
          value={String(expiringSoonCount)}
          note="within 7 days"
          tone="warn"
        />
        <Metric
          label="Expired"
          value={String(expiredCount)}
          note="needs attention"
          tone="expired"
        />
        <Metric
          label="Active tracks"
          value={String(Math.max(0, products.length - expiredCount))}
          note="safe to use"
          tone="safe"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="glass-panel p-5">
          <SectionHead title="Use first" action="Nearest expiry" />
          {useFirstList.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No products recorded yet. Scan a product to begin tracking.
            </div>
          ) : (
            useFirstList
              .slice(0, 4)
              .map((p) => <ProductRow key={p.id} product={p} onClick={() => onSelectProduct(p)} />)
          )}
          {products.length > 0 && (
            <button
              onClick={() => onNavigate("products")}
              className="mt-3 flex items-center gap-1 text-sm font-medium text-primary"
            >
              View all products ({products.length}) <ChevronRight className="size-4" />
            </button>
          )}
        </section>

        <div className="space-y-4">
          <ScannerMini onClick={() => onNavigate("scan")} />
          <section className="glass-panel p-5">
            <SectionHead title="Recently scanned" action="Recent additions" />
            {recentList.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No recent scans.</div>
            ) : (
              recentList
                .slice(0, 3)
                .map((p) => (
                  <ProductRow key={p.id} product={p} compact onClick={() => onSelectProduct(p)} />
                ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: keyof typeof toneStyles;
}) {
  return (
    <div className="glass-panel p-4">
      <p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-[28px] font-semibold">{value}</p>
      <p className={`mt-0.5 text-xs ${toneStyles[tone].split(" ")[1]}`}>{note}</p>
    </div>
  );
}

function SectionHead({ title, action }: { title: string; action: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <span className="font-mono text-[9px] uppercase text-muted-foreground">{action}</span>
    </div>
  );
}

function ProductRow({
  product,
  compact = false,
  onClick,
}: {
  product: StoredProduct;
  compact?: boolean;
  onClick: () => void;
}) {
  const expiry = calculateExpiryStatus(product.expiry_date);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border py-3 text-left transition-colors hover:bg-secondary/30 last:border-0"
    >
      <div
        className={`${
          compact ? "size-10" : "size-12"
        } shrink-0 overflow-hidden rounded-md border border-border bg-secondary`}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-4 opacity-40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {product.brand ? `${product.brand} · ` : ""}
          {product.category}
          {product.quantity ? ` · ${product.quantity}` : ""}
        </p>
      </div>
      <Status tone={expiry.tone}>{expiry.statusText}</Status>
    </button>
  );
}

function Status({ tone, children }: { tone: keyof typeof toneStyles; children: React.ReactNode }) {
  return (
    <span className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

function ScannerMini({ onClick }: { onClick: () => void }) {
  return (
    <section className="glass-panel p-5">
      <SectionHead title="Scanner" action="Camera ready" />
      <button
        onClick={onClick}
        className="scanner-field relative grid aspect-[16/8] w-full place-items-center overflow-hidden rounded-lg"
      >
        <ScanLine className="size-7 text-primary" />
        <span className="scanline" />
        <span className="absolute bottom-3 text-[10px] font-medium text-foreground">
          Tap to open live camera
        </span>
      </button>
    </section>
  );
}

function Products({
  products,
  query,
  setQuery,
  onScan,
  onSelectProduct,
  onDeleteProduct,
}: {
  products: StoredProduct[];
  query: string;
  setQuery: (v: string) => void;
  onScan: () => void;
  onSelectProduct: (p: StoredProduct) => void;
  onDeleteProduct: (id: string) => void;
}) {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = filter === "All" || p.category === filter;
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(query.toLowerCase()));
      return matchesCat && matchesQuery;
    });
  }, [products, filter, query]);

  return (
    <div className="animate-rise">
      <PageTitle
        eyebrow="Inventory"
        title="Your products"
        subtitle="Real scanned items stored securely in your private collection."
        action={
          <Button onClick={onScan}>
            <Plus className="size-4" /> Add product
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-panel/75 px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search products by name or brand"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {["All", "Skincare", "Personal Care", "Food", "Medicine"].map((x) => (
            <Button
              key={x}
              variant={filter === x ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(x)}
            >
              {x}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Box className="mx-auto size-10 text-muted-foreground opacity-40" />
          <h3 className="mt-3 font-display text-base font-semibold">No products found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {products.length === 0
              ? "Your inventory is currently empty. Tap below to scan your first product."
              : "No items match your search filter."}
          </p>
          <Button className="mt-4" onClick={onScan}>
            <ScanLine className="size-4" /> Scan a product
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const expiry = calculateExpiryStatus(p.expiry_date);
            return (
              <article key={p.id} className="glass-panel overflow-hidden">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <ImageIcon className="size-10 opacity-30" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Status tone={expiry.tone}>{expiry.statusText}</Status>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-sm font-semibold">{p.name}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.brand ? `${p.brand} · ` : ""}
                        {p.category}
                        {p.quantity ? ` · ${p.quantity}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">
                      {p.ingredients?.length || 0} ingredients
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1 text-muted-foreground hover:text-expired"
                        title="Delete product"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="font-medium text-primary hover:underline"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Alerts({
  products,
  onSelectProduct,
  onScan,
}: {
  products: StoredProduct[];
  onSelectProduct: (p: StoredProduct) => void;
  onScan: () => void;
}) {
  const expired = products.filter((p) => calculateExpiryStatus(p.expiry_date).daysRemaining <= 0);
  const expiringToday = products.filter(
    (p) => calculateExpiryStatus(p.expiry_date).daysRemaining === 0,
  );
  const expiringSoon = products.filter((p) => {
    const d = calculateExpiryStatus(p.expiry_date).daysRemaining;
    return d > 0 && d <= 7;
  });
  const upcoming = products.filter((p) => calculateExpiryStatus(p.expiry_date).daysRemaining > 7);

  return (
    <div className="animate-rise">
      <PageTitle
        eyebrow="Alert center"
        title="What needs attention"
        subtitle="Prioritized by real calculated expiry timelines."
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric
          label="Expired"
          value={String(expired.length)}
          note="remove or review"
          tone="expired"
        />
        <Metric
          label="Expiring today"
          value={String(expiringToday.length)}
          note="use immediately"
          tone="warn"
        />
        <Metric
          label="Expiring soon"
          value={String(expiringSoon.length)}
          note="next 7 days"
          tone="warn"
        />
        <Metric label="Safe" value={String(upcoming.length)} note="no action needed" tone="safe" />
      </div>

      <section className="mt-5 glass-panel p-5">
        <SectionHead title="Timeline" action="Nearest expiry first" />
        {products.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No products in your timeline yet.
          </div>
        ) : (
          [...products]
            .sort(
              (a, b) =>
                calculateExpiryStatus(a.expiry_date).daysRemaining -
                calculateExpiryStatus(b.expiry_date).daysRemaining,
            )
            .map((p) => <ProductRow key={p.id} product={p} onClick={() => onSelectProduct(p)} />)
        )}
      </section>
    </div>
  );
}

function Compare({ products }: { products: StoredProduct[] }) {
  const p1 = products[0];
  const p2 = products[1];

  if (!p1 || !p2) {
    return (
      <div className="animate-rise">
        <PageTitle
          eyebrow="Compare products"
          title="See the factual differences"
          subtitle="Compare ingredients, preferences, and expiry without an arbitrary winner."
        />
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <GitCompareArrows className="mx-auto size-8 text-muted-foreground opacity-40" />
          <h3 className="mt-3 font-display text-sm font-semibold">
            Need at least 2 scanned products to compare
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Scan multiple products in your inventory to see neutral side-by-side ingredient
            comparison.
          </p>
        </div>
      </div>
    );
  }

  const s1 = calculateExpiryStatus(p1.expiry_date);
  const s2 = calculateExpiryStatus(p2.expiry_date);

  return (
    <div className="animate-rise">
      <PageTitle
        eyebrow="Compare products"
        title="See the factual differences"
        subtitle="Compare ingredients, preferences, and expiry without an arbitrary winner."
      />
      <section className="glass-panel overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border bg-secondary/60 p-4 text-sm font-medium">
          <span>Detail</span>
          <span className="truncate">{p1.name}</span>
          <span className="truncate">{p2.name}</span>
        </div>
        {[
          ["Brand", p1.brand || "—", p2.brand || "—"],
          ["Category", p1.category, p2.category],
          [
            "Ingredients Detected",
            `${p1.ingredients.length} items`,
            `${p2.ingredients.length} items`,
          ],
          ["Expiry Status", s1.statusText, s2.statusText],
          ["Barcode", p1.barcode || "None", p2.barcode || "None"],
        ].map((r) => (
          <div
            key={r[0]}
            className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border p-4 text-xs last:border-0"
          >
            <span className="text-muted-foreground">{r[0]}</span>
            <span className="truncate font-medium">{r[1]}</span>
            <span className="truncate font-medium">{r[2]}</span>
          </div>
        ))}
      </section>
      <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-info" />
        These details help you choose based on your own needs. ExpiryEye does not declare an
        arbitrary winner.
      </p>
    </div>
  );
}

function IngredientLibrary() {
  const [search, setSearch] = useState("");

  const rows = [
    ["Glycerin", "Humectant", "Attracts and retains atmospheric moisture in the skin."],
    ["Fragrance / Parfum", "Fragrance", "Imparts aroma; may trigger sensitivity in reactive skin."],
    ["Phenoxyethanol", "Preservative", "Broad spectrum antimicrobial preservative."],
    ["Cetyl Alcohol", "Emollient", "Fatty alcohol used for texture and conditioning."],
    ["Aqua (Water)", "Solvent", "Purified water used as base solvent."],
    ["Niacinamide", "Active Ingredient", "Strengthens skin barrier and regulates sebum."],
    ["Salicylic Acid", "Exfoliant", "Beta hydroxy acid that penetrates pores."],
    ["Hyaluronic Acid", "Humectant", "Binds water to retain skin elasticity."],
  ];

  const filtered = rows.filter((r) => {
    const name = r[0];
    const cat = r[1];
    const desc = r[2];
    return (
      (name && name.toLowerCase().includes(search.toLowerCase())) ||
      (cat && cat.toLowerCase().includes(search.toLowerCase())) ||
      (desc && desc.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="animate-rise">
      <PageTitle
        eyebrow="Ingredient library"
        title="Understand what’s inside"
        subtitle="Plain-language, neutral, factual information about commonly used ingredients."
      />
      <section className="glass-panel p-5">
        <label className="mb-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search ingredients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {filtered.map((r, i) => (
          <div
            key={r[0]}
            className="flex w-full items-center gap-3 border-b border-border py-4 text-left last:border-0"
          >
            <span
              className={`grid size-9 place-items-center rounded-md ${
                r[1] === "Fragrance" ? "bg-warning-soft text-warning" : "bg-info-soft text-info"
              }`}
            >
              <Leaf className="size-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{r[0]}</span>
              <span className="block text-xs text-muted-foreground">{r[2]}</span>
            </span>
            <span className="hidden rounded bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground sm:block">
              {r[1]}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Profile({
  userPreferences,
  onUpdatePreferences,
  onSignIn,
  currentUser,
}: {
  userPreferences: UserPreferencesConfig;
  onUpdatePreferences: (p: UserPreferencesConfig) => void;
  onSignIn: () => void;
  currentUser: User | null;
}) {
  const [avoidedInput, setAvoidedInput] = useState("");

  const toggle = (key: keyof UserPreferencesConfig) => {
    onUpdatePreferences({
      ...userPreferences,
      [key]: !userPreferences[key],
    });
  };

  const handleAddAvoided = () => {
    if (avoidedInput.trim()) {
      const current = userPreferences.avoidedIngredients || [];
      if (!current.includes(avoidedInput.trim())) {
        onUpdatePreferences({
          ...userPreferences,
          avoidedIngredients: [...current, avoidedInput.trim()],
        });
      }
      setAvoidedInput("");
    }
  };

  const handleRemoveAvoided = (item: string) => {
    onUpdatePreferences({
      ...userPreferences,
      avoidedIngredients: (userPreferences.avoidedIngredients || []).filter((i) => i !== item),
    });
  };

  return (
    <div className="animate-rise">
      <PageTitle
        eyebrow="Preferences"
        title="Make scanner results relevant to you"
        subtitle="ExpiryEye flags matching ingredients without judging products as good or bad."
        action={
          currentUser ? (
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          ) : (
            <Button onClick={onSignIn}>
              <CircleUserRound className="size-4" /> Sign in to sync
            </Button>
          )
        }
      />

      <section className="glass-panel p-5">
        <SectionHead title="Health & Ingredient Preferences" action="Neutral Matching" />
        <div className="space-y-3">
          {[
            { key: "fragranceFree" as const, label: "Fragrance-free preference" },
            { key: "sensitiveSkin" as const, label: "Sensitive skin considerations" },
            { key: "vegan" as const, label: "Vegan preference" },
            { key: "vegetarian" as const, label: "Vegetarian preference" },
            { key: "glutenAvoidance" as const, label: "Gluten avoidance" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between rounded-lg bg-secondary/70 p-3 text-sm"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={Boolean(userPreferences[item.key])}
                onChange={() => toggle(item.key)}
                className="size-4 accent-primary"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium">Ingredients I prefer to avoid</p>
          <div className="flex flex-wrap gap-2">
            {userPreferences.avoidedIngredients?.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 rounded bg-warning-soft px-2 py-1 text-xs text-warning"
              >
                {ing}
                <button onClick={() => handleRemoveAvoided(ing)} className="hover:text-foreground">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={avoidedInput}
              onChange={(e) => setAvoidedInput(e.target.value)}
              placeholder="e.g. Parabens or Alcohol Denat"
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAvoided();
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={handleAddAvoided}>
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase text-primary">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold lg:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function MobileNav({
  view,
  alertCount,
  onNavigate,
}: {
  view: View;
  alertCount: number;
  onNavigate: (v: View) => void;
}) {
  const items = [
    { id: "home" as View, label: "Home", icon: Home },
    { id: "products" as View, label: "Products", icon: Box },
    { id: "scan" as View, label: "Scan", icon: ScanLine },
    { id: "alerts" as View, label: "Alerts", icon: Bell },
    { id: "profile" as View, label: "Profile", icon: CircleUserRound },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t border-border bg-panel/85 px-2 py-1.5 backdrop-blur-2xl lg:hidden"
      aria-label="Mobile navigation"
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex flex-col items-center gap-1 py-1.5 text-[10px] ${
            view === id || (id === "products" && view === "product_detail")
              ? "text-primary"
              : "text-muted-foreground"
          } ${id === "scan" ? "-mt-5 font-semibold" : ""}`}
        >
          {id === "scan" ? (
            <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              <Icon className="size-5" />
            </span>
          ) : (
            <span className="relative">
              <Icon className="size-4" />
              {id === "alerts" && alertCount > 0 && (
                <span className="absolute -right-1.5 -top-1 size-2 rounded-full bg-expired" />
              )}
            </span>
          )}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function AuthModal({ currentUser, onClose }: { currentUser: User | null; onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage("Working…");
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    setMessage(
      result.error
        ? result.error.message
        : mode === "signup"
          ? "Check your email to confirm your account."
          : "Signed in successfully.",
    );
    if (!result.error && mode === "signin") {
      setTimeout(onClose, 800);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setMessage(result.error.message);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <Brand />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {currentUser ? (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium">Signed in as</p>
            <p className="font-mono text-xs text-muted-foreground">{currentUser.email}</p>
            <Button
              variant="outline"
              className="mt-5 w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                onClose();
              }}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <>
            <h2 className="mt-6 font-display text-xl font-semibold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep your scanned products and preferences synchronized.
            </p>
            <Button variant="outline" className="mt-5 w-full" onClick={google}>
              G&nbsp;&nbsp;Continue with Google
            </Button>
            <div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              OR
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-3">
              <label>
                <span className="mb-1.5 block text-xs text-muted-foreground">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="you@example.com"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-muted-foreground">Password</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="At least 8 characters"
                />
              </label>
            </div>
            {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
            <Button className="mt-4 w-full" disabled={loading} onClick={submit}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 w-full text-center text-xs text-primary"
            >
              {mode === "signin"
                ? "New to ExpiryEye? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
