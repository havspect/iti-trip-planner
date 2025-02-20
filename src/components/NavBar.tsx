import { MapPin } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <span className="text-xl font-semibold">Trip Planner</span>
        </div>
      </div>
    </nav>
  );
}
