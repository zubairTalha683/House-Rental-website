import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface SearchResultsProps {
  results: any[];
  searchQuery: any;
}

export default function SearchResults({ results, searchQuery }: SearchResultsProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Mock coordinates for demonstration - in a real app, you'd geocode the addresses
  const getCoordinatesForLocation = (location: string) => {
    const mockCoordinates = {
      'dhaka': { lat: 23.8103, lng: 90.4125 },
      'chittagong': { lat: 22.3569, lng: 91.7832 },
      'sylhet': { lat: 24.8949, lng: 91.8687 },
      'rajshahi': { lat: 24.3745, lng: 88.6042 },
      'khulna': { lat: 22.8456, lng: 89.5403 },
      'barisal': { lat: 22.7010, lng: 90.3535 }
    };
    
    const locationKey = location.toLowerCase();
    return mockCoordinates[locationKey] || { lat: 23.8103, lng: 90.4125 };
  };

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapLoaded && results.length > 0) {
      initializeMap();
    }
  }, [mapLoaded, results]);

  const initializeMap = () => {
    // For demonstration, we'll create a mock map interface
    // In a real implementation, you'd use the Google Maps API
    const mapContainer = document.getElementById('search-map');
    if (!mapContainer) return;

    // Mock map initialization
    const center = results.length > 0 ? getCoordinatesForLocation(results[0].location) : { lat: 23.8103, lng: 90.4125 };
    
    // Create mock map with pinpoints
    mapContainer.innerHTML = `
      <div class="bg-blue-100 rounded-lg p-4 h-64 flex items-center justify-center relative">
        <div class="text-center">
          <div class="text-blue-600 mb-2">
            <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <p class="text-sm text-blue-800">Map showing ${results.length} properties</p>
          <p class="text-xs text-blue-600 mt-1">Center: ${results[0]?.location || 'Dhaka'}</p>
        </div>
        ${results.map((result, index) => `
          <div class="absolute bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold" 
               style="top: ${20 + index * 40}px; left: ${50 + index * 30}px;">
            ${index + 1}
          </div>
        `).join('')}
      </div>
    `;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Search Results Map
          </CardTitle>
          <CardDescription>
            Showing {results.length} properties matching your search criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="search-map" className="w-full">
            {!mapLoaded ? (
              <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : null}
          </div>
          
          {results.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Properties Found:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={result.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                    <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{result.location}</span>
                      <span className="text-gray-600 ml-2">৳{result.monthlyPrice}</span>
                      {result.rentType === 'temporary' && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {result.temporaryDays} days
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria to find more properties.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}