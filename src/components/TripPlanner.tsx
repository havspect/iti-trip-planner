"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// Import CodeMirror components for the editor
import CodeMirror from "@uiw/react-codemirror";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";

// Dynamically import the map component to prevent SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
});

export type Location = {
  name: string;
  coordinates: [number, number];
  type: "city" | "stop";
  parent?: string;
  date?: Date;
};

// Add validation type
type ValidationError = {
  line: number;
  message: string;
};

export default function TripPlanner() {
  const [itinerary, setItinerary] = useState<string>(
    `# Trip to Mexico

## Mexico City (19.4326, -99.1332)
* National Palace (19.4326, -99.1332)
* World War Museum (19.4342, -99.1386)
* Chapultepec Castle (19.4204, -99.1824)

## Cancun (21.1619, -86.8515)
* Chichen Itza (20.6843, -88.5678)
* Tulum Ruins (20.2114, -87.4295)
* Xcaret Park (20.5792, -87.1199)

## Oaxaca (17.0732, -96.7266)
* Monte Alban (17.0437, -96.7679)
* Hierve el Agua (16.8655, -96.2755)
* Santo Domingo Church (17.0650, -96.7242)`,
  );

  const [locations, setLocations] = useState<Location[]>([]);
  const editorRef = useRef<EditorView | null>(null);

  // Add these helper functions
  const parseDate = (dateStr: string): Date | undefined => {
    const dateMatch = dateStr.match(/\[(.*?)\]/);
    if (!dateMatch) return undefined;

    const date = new Date(dateMatch[1]);
    return isNaN(date.getTime()) ? undefined : date;
  };

  // Parse the itinerary to extract locations with coordinates and hierarchy
  useEffect(() => {
    const lines = itinerary.split("\n");
    const extractedLocations: Location[] = [];
    let currentCity: string | null = null;
    let lastLocation: Location | null = null;

    const locationRegex = /([^()]+)\s*\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/;
    const commentDateRegex = /\/\/\s*Date:\s*(.+)/;

    lines.forEach((line) => {
      // Check for comment with date
      const commentMatch = line.trim().match(commentDateRegex);
      if (commentMatch && lastLocation) {
        const dateStr = commentMatch[1].trim();
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          lastLocation.date = date;
        }
        return;
      }

      // Skip empty lines and title
      if (!line.trim() || line.trim().startsWith("# ")) return;

      // Check if it's a city (starts with ##)
      if (line.trim().startsWith("## ")) {
        const match = line.match(locationRegex);
        if (match) {
          currentCity = match[1].replace("## ", "").trim();
          const newLocation: Location = {
            name: currentCity,
            coordinates: [parseFloat(match[2]), parseFloat(match[3])] as [
              number,
              number,
            ],
            type: "city",
            date: parseDate(line),
          };
          extractedLocations.push(newLocation);
          lastLocation = newLocation;
        }
      }
      // Check if it's a stop (starts with *)
      else if (line.trim().startsWith("* ") && currentCity) {
        const match = line.match(locationRegex);
        if (match) {
          const newLocation: Location = {
            name: match[1].replace("* ", "").trim(),
            coordinates: [parseFloat(match[2]), parseFloat(match[3])] as [
              number,
              number,
            ],
            type: "stop",
            parent: currentCity,
            date: parseDate(line),
          };
          extractedLocations.push(newLocation);
          lastLocation = newLocation;
        }
      }
    });

    setLocations(extractedLocations);
  }, [itinerary]);

  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "heading",
        content: "Personal trip planner",
      },
      {
        type: "heading",
        content: "Personal trip planner",
      },
      {
        type: "heading",
        content: "Personal trip planner",
      },
      {
        type: "heading",
        content: "Personal trip planner",
      },
    ],
  });

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full rounded-none">
      {/* Itinerary Editor Panel */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full flex-col bg-muted/5">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-medium">Itinerary Editor</span>
            <div className="text-sm text-muted-foreground">
              ## City (lat, lng) • * Stop (lat, lng)
            </div>
          </div>
          <div className="flex-1 relative">
            <BlockNoteView editor={editor} />
            {/* <CodeMirror
              value={itinerary}
              onChange={setItinerary}
              extensions={[basicSetup]}
              className="h-full border rounded-md"
              onDrop={(e) => {
                e.preventDefault();
                // Handle line drop here
              }}
              ref={(editor) => {
                if (editor) {
                  editorRef.current = editor.view || null;
                }
              }}
            /> */}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Map View Panel */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-medium">Map View</span>
          </div>
          <div className="flex-1">
            <MapView locations={locations} />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
