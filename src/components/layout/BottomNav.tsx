import { Link, useLocation } from "wouter";
import { Home, Heart, Car, Package, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/my-brands", label: "My Brands", icon: Heart },
  { path: "/vehicles", label: "Vehicles", icon: Car },
  { path: "/products", label: "Products", icon: Package },
  { path: "/search", label: "Search", icon: Search },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          const iconColor = 
            item.path === "/my-brands" ? "text-pink-500" :
            item.path === "/vehicles" ? "text-blue-500" :
            item.path === "/products" ? "text-purple-500" :
            isActive ? "text-primary" : "text-muted-foreground";
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110",
                    isActive && iconColor
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppHeader() {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-center h-14 px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">sortir</h1>
        </div>
      </div>
    </header>
  );
}
