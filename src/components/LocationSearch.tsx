"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: { name: string; coordinates: [number, number] }) => void;
  searchTerm: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelect,
  searchTerm,
}: CommandPaletteProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchLocation = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`,
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error searching locations:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchLocation, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CommandInput placeholder="Search for a location..." value={searchTerm} />
      <CommandList>
        {loading ? (
          <CommandItem>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          </CommandItem>
        ) : results.length === 0 ? (
          <CommandEmpty>No locations found</CommandEmpty>
        ) : (
          <CommandGroup heading="Locations">
            {results.map((result) => {
              const mainName = result.display_name.split(",")[0];
              const restOfAddress = result.display_name
                .split(",")
                .slice(1)
                .join(",")
                .trim();

              return (
                <CommandItem
                  key={result.display_name}
                  onSelect={() => {
                    onSelect({
                      name: mainName,
                      coordinates: [
                        parseFloat(result.lat),
                        parseFloat(result.lon),
                      ],
                    });
                    onClose();
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">{mainName}</div>
                    <div className="text-xs text-muted-foreground">
                      {restOfAddress}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
