/**
 * Command Palette Component
 * Global search interface using cmdk library
 */

'use client';

import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Package, Truck, User, Users, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCommandPalette } from '@/hooks/use-command-palette';
import type { SearchResult } from '@/hooks/use-command-palette';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const getResultIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'shipment':
      return Package;
    case 'truck':
      return Truck;
    case 'driver':
      return User;
    case 'user':
      return Users;
    default:
      return Search;
  }
};

const getGroupLabel = (type: SearchResult['type']) => {
  switch (type) {
    case 'shipment':
      return 'الشحنات';
    case 'truck':
      return 'الشاحنات';
    case 'driver':
      return 'السائقون';
    case 'user':
      return 'المستخدمون';
    default:
      return 'نتائج';
  }
};

export function CommandPalette({ isOpen, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { query, setQuery, results, isSearching } = useCommandPalette();

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResult['type'], SearchResult[]>
  );

  const handleSelect = (link: string) => {
    router.push(link);
    onOpenChange(false);
    setQuery('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[640px]">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {/* Search Input */}
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="ابحث عن شحنات، شاحنات، أو مستخدمين..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isSearching && (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {/* Empty State */}
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {query.length < 2
                ? 'اكتب حرفين على الأقل للبحث'
                : 'لا توجد نتائج مطابقة'}
            </Command.Empty>

            {/* Grouped Results */}
            {Object.entries(groupedResults).map(([type, items]) => {
              const Icon = getResultIcon(type as SearchResult['type']);
              const label = getGroupLabel(type as SearchResult['type']);

              return (
                <Command.Group key={type} heading={label}>
                  {items.map((result) => (
                    <Command.Item
                      key={result.id}
                      value={`${result.type}-${result.id}-${result.title}`}
                      onSelect={() => handleSelect(result.link)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-sm outline-none hover:bg-accent aria-selected:bg-accent"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate font-medium">{result.title}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          {/* Footer Hint */}
          {query && !isSearching && results.length > 0 && (
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              اضغط Enter للانتقال أو ESC للإلغاء
            </div>
          )}
        </Command>
      </DialogContent>
    </Dialog>
  );
}
