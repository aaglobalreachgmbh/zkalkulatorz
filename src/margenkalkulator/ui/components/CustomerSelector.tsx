// ============================================
// Customer Selector Component
// Reusable customer selection with search
// ============================================

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { useCustomers } from "../../hooks/useCustomers";
import { cn } from "@/lib/utils";

interface CustomerSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function CustomerSelector({
  value,
  onChange,
  onCreateNew,
  className,
}: CustomerSelectorProps) {
  const { customers, isLoading } = useCustomers();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Find selected customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === value),
    [customers, value]
  );

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const lower = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.company_name.toLowerCase().includes(lower) ||
        c.contact_name?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower)
    );
  }, [customers, search]);

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm text-muted-foreground">
        Kunde zuordnen (optional)
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedCustomer ? (
              <span className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{selectedCustomer.company_name}</span>
                {selectedCustomer.contact_name && (
                  <span className="text-muted-foreground truncate">
                    ({selectedCustomer.contact_name})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">Kein Kunde ausgewählt</span>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <X
                  className="w-4 h-4 text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                />
              )}
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          {/* Search */}
          <div className="flex items-center border-b px-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Kunde suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Customer list */}
          <ScrollArea className="max-h-[200px]">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Lade Kunden...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search ? "Keine Kunden gefunden" : "Noch keine Kunden"}
              </div>
            ) : (
              <div className="p-1">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelect(customer.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm hover:bg-muted transition-colors",
                      value === customer.id && "bg-muted"
                    )}
                  >
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {customer.company_name}
                      </div>
                      {customer.contact_name && (
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {customer.contact_name}
                        </div>
                      )}
                    </div>
                    {value === customer.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Create new button */}
          {onCreateNew && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCreateNew();
                  setOpen(false);
                }}
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <Plus className="w-4 h-4" />
                Neuer Kunde
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
