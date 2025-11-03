import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PropertyCardProps {
  property: any;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRentDisplayText = () => {
    if (property.temporaryRent) {
      return `৳${property.monthlyPriceRange}/day`;
    }
    return `৳${property.monthlyPriceRange}/month`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {property.images && property.images.length > 0 ? (
          <div className="relative h-48 bg-gray-200">
            <img
              src={property.images[currentImageIndex]}
              alt={`Property in ${property.location}`}
              className="w-full h-full object-cover"
            />
            
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {property.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"
              alt="Property placeholder"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={property.propertyType === 'bachelor' ? 'default' : 'secondary'}>
            {property.propertyType === 'bachelor' ? 'Bachelor' : 'Family'}
          </Badge>
          {property.temporaryRent && (
            <Badge variant="outline" className="bg-white">
              Temporary
            </Badge>
          )}
        </div>
      </div>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {property.location}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Posted on {formatDate(property.uploadedAt)}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {getRentDisplayText()}
            </div>
            {property.temporaryRent && property.temporaryRentDays && (
              <div className="text-xs text-gray-500">
                Max stay: {property.temporaryRentDays} days
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Room Details</h4>
            <p className="text-gray-600 text-sm line-clamp-3">
              {property.roomDetails}
            </p>
          </div>

          {property.temporaryRent && (
            <div className="flex items-center text-sm text-blue-600 bg-blue-50 p-2 rounded">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Short-term rental available
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.3 10.8a11.05 11.05 0 005.9 5.9l1.413-3.924a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {property.phoneNumber}
            </div>
            
            <Button size="sm" variant="outline">
              Contact Owner
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}