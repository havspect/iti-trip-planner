"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Car, Plane, Bike, PersonStanding } from "lucide-react";
import {
  calculateAllModes,
  RouteInfo,
  getModeName,
} from "../lib/distanceService";

import type { Location } from "./TripPlanner";
import { Calendar } from "./ui/calendar";

// Fix for default marker icons in Leaflet with Next.js
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 bg-${color}-500 rounded-full text-white border-2 border-white shadow-lg">
      ${
        color === "blue"
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
      }
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const cityIcon = createCustomIcon("blue");
const stopIcon = createCustomIcon("red");

type MapViewProps = {
  locations: Location[];
};

type RouteWithLocations = {
  from: Location;
  to: Location;
  routes?: RouteInfo[];
};

const formatDate = (date?: Date) => {
  if (!date) return "";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

export default function MapView({ locations }: MapViewProps) {
  const [center, setCenter] = useState<[number, number]>([20.5, -100]); // Center of Mexico
  const [zoom, setZoom] = useState(5);
  const [mapKey, setMapKey] = useState(0);
  const [routeInfo, setRouteInfo] = useState<Record<string, RouteInfo[]>>({});

  // Get consecutive pairs of main cities
  const cityPairs = useMemo(() => {
    const cities = locations.filter((loc) => loc.type === "city");
    return cities.slice(0, -1).map((city, index) => ({
      from: city,
      to: cities[index + 1],
      key: `${city.name}-${cities[index + 1].name}`,
    }));
  }, [locations]);

  // Calculate route information for city pairs
  useEffect(() => {
    const fetchRoutes = async () => {
      const newRouteInfo: Record<string, RouteInfo[]> = {};

      for (const pair of cityPairs) {
        try {
          const routes = await calculateAllModes(
            pair.from.coordinates,
            pair.to.coordinates,
          );
          newRouteInfo[pair.key] = routes;
        } catch (error) {
          console.error(`Failed to fetch routes for ${pair.key}:`, error);
        }
      }

      setRouteInfo(newRouteInfo);
    };

    fetchRoutes();
  }, [cityPairs]);

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get bounds for locations to fit all markers
  const getBounds = () => {
    if (locations.length === 0) return undefined;
    const bounds = L.latLngBounds(
      locations.map((loc) => L.latLng(loc.coordinates[0], loc.coordinates[1])),
    );
    return bounds;
  };

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      className="h-full w-full"
      bounds={getBounds()}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Draw connections between cities with hoverable route info */}
      {cityPairs.map(({ from, to, key }) => (
        <Polyline
          key={key}
          positions={[from.coordinates, to.coordinates]}
          color="#6366f1"
          weight={3}
          opacity={0.6}
        >
          <Tooltip sticky className="custom-tooltip">
            <div className="bg-white py-2 px-4 rounded-md">
              <div className="font-medium mb-2">
                {from.name} → {to.name}
              </div>
              <div className="space-y-1 ">
                {routeInfo[key]?.map((route) => (
                  <div
                    key={route.mode}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="flex items-center gap-1">
                      {route.mode === "driving-car" && (
                        <Car className="h-3 w-3" />
                      )}
                      {route.mode === "cycling-regular" && (
                        <Bike className="h-3 w-3" />
                      )}
                      {route.mode === "foot-walking" && (
                        <PersonStanding className="h-3 w-3" />
                      )}
                      {route.mode === "flight" && <Plane className="h-3 w-3" />}
                      {getModeName(route.mode)}:
                    </span>
                    <span>
                      {Math.round(route.distance)}km •{" "}
                      {formatDuration(route.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {/* City and stop markers */}
      {locations.map((location, index) => (
        <Marker
          key={`${location.name}-${index}`}
          position={location.coordinates}
          icon={location.type === "city" ? cityIcon : stopIcon}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{location.name}</div>
              {location.type === "stop" && location.parent && (
                <div className="text-sm text-muted-foreground">
                  Part of: {location.parent}
                </div>
              )}
              {location.date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(location.date)}
                </div>
              )}
              <div className="text-sm">
                {location.coordinates[0].toFixed(4)},{" "}
                {location.coordinates[1].toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
