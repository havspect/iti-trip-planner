const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
const ORS_API_URL = "https://api.openrouteservice.org";

export type TravelMode =
  | "driving-car"
  | "foot-walking"
  | "cycling-regular"
  | "flight";
export type RouteInfo = {
  distance: number; // in kilometers
  duration: number; // in minutes
  mode: TravelMode;
};

export async function calculateRoute(
  start: [number, number],
  end: [number, number],
  mode: TravelMode,
): Promise<RouteInfo> {
  // If it's a flight, use direct distance calculation
  if (mode === "flight") {
    const distance = calculateFlightDistance(start, end);
    const duration = (distance / 800) * 60; // Assume 800 km/h average speed
    return { distance, duration, mode };
  }

  const url = `${ORS_API_URL}/v2/directions/${mode}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY!,
      },
      body: JSON.stringify({
        coordinates: [
          [start[1], start[0]], // ORS expects [lon, lat] format
          [end[1], end[0]],
        ],
        units: "km",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const route = data.features[0];

    return {
      distance: route.properties.segments[0].distance,
      duration: route.properties.segments[0].duration / 60, // Convert to minutes
      mode,
    };
  } catch (error) {
    console.error(`Error calculating ${mode} route:`, error);

    // Fallback to direct distance calculation if API fails
    const distance = calculateFlightDistance(start, end);
    const speeds: Record<TravelMode, number> = {
      "driving-car": 60, // 60 km/h average
      "foot-walking": 5, // 5 km/h average
      "cycling-regular": 15, // 15 km/h average
      flight: 800, // 800 km/h average
    };

    return {
      distance,
      duration: (distance / speeds[mode]) * 60,
      mode,
    };
  }
}

// Calculate flight distance using the Haversine formula
export function calculateFlightDistance(
  start: [number, number],
  end: [number, number],
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(end[0] - start[0]);
  const dLon = toRad(end[1] - start[1]);
  const lat1 = toRad(start[0]);
  const lat2 = toRad(end[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate all travel modes between two points
export async function calculateAllModes(
  start: [number, number],
  end: [number, number],
): Promise<RouteInfo[]> {
  const modes: TravelMode[] = [
    "driving-car",
    "foot-walking",
    "cycling-regular",
  ];
  const distance = calculateFlightDistance(start, end);

  // Only include flight option for distances over 100km
  if (distance > 100) {
    modes.push("flight");
  }

  try {
    const routes = await Promise.all(
      modes.map((mode) => calculateRoute(start, end, mode)),
    );

    return routes;
  } catch (error) {
    console.error("Error calculating routes:", error);
    throw error;
  }
}

// Helper function to get a human-readable mode name
export function getModeName(mode: TravelMode): string {
  const modeNames: Record<TravelMode, string> = {
    "driving-car": "Driving",
    "foot-walking": "Walking",
    "cycling-regular": "Cycling",
    flight: "Flight",
  };
  return modeNames[mode];
}
