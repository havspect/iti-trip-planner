"use client";

import { useEffect, useState } from "react";
import { Car, Plane, Bike, PersonStanding } from "lucide-react";
import {
  calculateAllModes,
  RouteInfo,
  getModeName,
} from "../lib/distanceService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TravelOptionsProps = {
  from: {
    name: string;
    coordinates: [number, number];
  };
  to: {
    name: string;
    coordinates: [number, number];
  };
};

export default function TravelOptions({ from, to }: TravelOptionsProps) {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const routeData = await calculateAllModes(
          from.coordinates,
          to.coordinates,
        );
        setRoutes(routeData);
        setError(null);
      } catch (err) {
        setError("Failed to load route information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [from, to]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "driving-car":
        return <Car className="h-4 w-4" />;
      case "cycling-regular":
        return <Bike className="h-4 w-4" />;
      case "foot-walking":
        return <PersonStanding className="h-4 w-4" />;
      case "flight":
        return <Plane className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return <div className="animate-pulse p-4">Loading travel options...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Travel Options</CardTitle>
        <CardDescription>
          {from.name} → {to.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {routes.map((route, index) => (
            <div
              key={route.mode + index}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2">
                {getModeIcon(route.mode)}
                <span className="font-medium">{getModeName(route.mode)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(route.distance)}km •{" "}
                {formatDuration(route.duration)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
