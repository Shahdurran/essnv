import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp } from "lucide-react";

/**
 * LocationSelector Component
 * 
 * Interactive button layout for selecting Rao Dermatology practice locations.
 * Matches the design specification with button-style selection (not dropdown).
 * Supports multi-location analytics with "All Locations" aggregation option.
 * 
 * Features:
 * - Visual button layout for all 5 practice locations
 * - "All Locations" option with count indicator
 * - Active state management with visual feedback
 * - Real practice location data integration
 * - Responsive design for mobile and desktop
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location ID
 * @param {Function} props.onLocationChange - Callback when location selection changes
 */
export default function LocationSelector({ selectedLocationId, onLocationChange }) {
  
  /**
   * Fetch practice locations from the API
   * Uses TanStack Query for efficient caching and state management
   */
  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['/api/locations'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since locations rarely change
  });

  /**
   * Handle location button click
   * Updates the selected location and triggers parent callback
   * @param {string} locationId - The location ID to select
   */
  const handleLocationClick = (locationId) => {
    onLocationChange(locationId);
  };

  /**
   * Render loading state while fetching location data
   */
  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <MapPin className="text-primary mr-3 h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Practice Locations</h2>
          </div>
          <p className="text-gray-600 mb-6">Loading practice locations...</p>
          <div className="flex flex-wrap gap-3">
            {/* Loading skeleton buttons */}
            {[...Array(6)].map((_, index) => (
              <div key={index} className="px-4 py-2 bg-gray-200 animate-pulse rounded-lg h-10 w-32"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state if location data fails to load
   */
  if (error) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <MapPin className="text-red-600 mr-3 h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Practice Locations</h2>
          </div>
          <p className="text-red-600 mb-6">Failed to load practice locations. Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-4 sm:p-6">
        {/* Section Header - Mobile Responsive */}
        <div className="flex items-center mb-3 sm:mb-4">
          <MapPin className="text-primary mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Practice Locations</h2>
        </div>
        
        {/* Section Description */}
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Select locations to analyze - view individual sites or all locations together
        </p>
        
        {/* Location Selection Buttons - Mobile Responsive */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          
          {/* "All Locations" Button */}
          <Button
            variant={selectedLocationId === "all" ? "default" : "outline"}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4 py-2 ${
              selectedLocationId === "all" 
                ? "bg-primary text-white hover:bg-primary/90" 
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => handleLocationClick("all")}
          >
            <TrendingUp className="h-4 w-4" />
            <span>All Locations</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedLocationId === "all" 
                ? "bg-primary-foreground/20" 
                : "bg-gray-200"
            }`}>
              {locations.length}
            </span>
          </Button>

          {/* Individual Location Buttons - Mobile Responsive */}
          {locations.map((location) => (
            <Button
              key={location.id}
              variant={selectedLocationId === location.id ? "destructive" : "outline"}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4 py-2 ${
                selectedLocationId === location.id
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => handleLocationClick(location.id)}
            >
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{location.name}</span>
            </Button>
          ))}
        </div>

        {/* Selected Location Summary */}
        {selectedLocationId !== "all" && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {(() => {
              const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
              if (selectedLocation) {
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Viewing analytics for: {selectedLocation.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Phone:</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLocation.phone}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* All Locations Summary */}
        {selectedLocationId === "all" && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Viewing aggregated analytics across all practice locations
                </p>
                <p className="text-xs text-blue-700">
                  Data includes all {locations.length} Rao Dermatology locations
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Total Locations:</p>
                <p className="text-lg font-bold text-blue-900">{locations.length}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
