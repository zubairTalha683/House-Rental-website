import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import PropertyCard from './PropertyCard';
import SearchResults from './SearchResults';
import { api } from '../services/api';

interface DashboardProps {
  onPropertyUpload: (propertyData: any) => Promise<boolean>;
  properties: any[];
  currentUser: any;
}

export default function Dashboard({ onPropertyUpload, properties, currentUser }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState({
    location: '',
    rentType: 'all',
    propertyType: 'all'
  });

  // Upload form state
  const [formData, setFormData] = useState({
    location: '',
    monthlyPrice: '',
    phoneNumber: '',
    roomDetails: '',
    propertyType: '',
    rentType: 'monthly',
    temporaryDays: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSearchChange = (field: string, value: string) => {
    setSearchQuery(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, images: imageUrls }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.monthlyPrice.trim()) {
      newErrors.monthlyPrice = 'Price is required';
    } else if (isNaN(Number(formData.monthlyPrice))) {
      newErrors.monthlyPrice = 'Please enter a valid price';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.roomDetails.trim()) {
      newErrors.roomDetails = 'Room details are required';
    }

    if (!formData.propertyType) {
      newErrors.propertyType = 'Property type is required';
    }

    if (formData.rentType === 'temporary') {
      if (!formData.temporaryDays.trim()) {
        newErrors.temporaryDays = 'Number of days is required';
      } else {
        const days = parseInt(formData.temporaryDays);
        if (isNaN(days) || days < 1 || days > 15) {
          newErrors.temporaryDays = 'Days must be between 1 and 15';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setUploading(true);
      
      try {
        // Upload images first
        const imageUrls: string[] = [];
        for (const file of imageFiles) {
          try {
            const result = await api.uploadImage(file);
            if (result.url) {
              imageUrls.push(result.url);
            }
          } catch (error) {
            console.error('Image upload failed:', error);
          }
        }
        
        // Prepare property data
        const propertyData = {
          location: formData.location,
          monthlyPriceRange: formData.monthlyPrice,
          phoneNumber: formData.phoneNumber,
          roomDetails: formData.roomDetails,
          propertyType: formData.propertyType,
          images: imageUrls,
          temporaryRent: formData.rentType === 'temporary',
          temporaryRentDays: formData.rentType === 'temporary' ? parseInt(formData.temporaryDays) : null
        };
        
        const success = await onPropertyUpload(propertyData);
        
        if (success) {
          // Reset form
          setFormData({
            location: '',
            monthlyPrice: '',
            phoneNumber: '',
            roomDetails: '',
            propertyType: '',
            rentType: 'monthly',
            temporaryDays: '',
            images: []
          });
          setImageFiles([]);
          setShowUploadForm(false);
        }
      } catch (error) {
        console.error('Property upload error:', error);
        setErrors({ submit: 'Failed to upload property' });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSearch = async () => {
    try {
      const filters: any = {};
      
      if (searchQuery.location.trim()) {
        filters.location = searchQuery.location;
      }
      
      if (searchQuery.rentType && searchQuery.rentType !== 'all') {
        filters.rentType = searchQuery.rentType;
      }
      
      if (searchQuery.propertyType && searchQuery.propertyType !== 'all') {
        filters.propertyType = searchQuery.propertyType;
      }
      
      const data = await api.getProperties(filters);
      setSearchResults(data.properties || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {currentUser?.username}!</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="w-full"
            >
              {showUploadForm ? 'Hide Upload Form' : 'Upload Property'}
            </Button>

            {showUploadForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Property</CardTitle>
                  <CardDescription>
                    Add a new property listing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="Enter property location"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="rentType">Rent Type</Label>
                      <Select value={formData.rentType} onValueChange={(value) => handleChange('rentType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rent type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly Rent</SelectItem>
                          <SelectItem value="temporary">Temporary Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.rentType === 'temporary' && (
                      <div>
                        <Label htmlFor="temporaryDays">Number of Days (1-15)</Label>
                        <Input
                          id="temporaryDays"
                          type="number"
                          min="1"
                          max="15"
                          value={formData.temporaryDays}
                          onChange={(e) => handleChange('temporaryDays', e.target.value)}
                          placeholder="Enter number of days"
                        />
                        {errors.temporaryDays && (
                          <p className="mt-1 text-sm text-red-600">{errors.temporaryDays}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="monthlyPrice">
                        {formData.rentType === 'monthly' ? 'Monthly Price Range' : 'Daily Price'}
                      </Label>
                      <Input
                        id="monthlyPrice"
                        type="text"
                        value={formData.monthlyPrice}
                        onChange={(e) => handleChange('monthlyPrice', e.target.value)}
                        placeholder={formData.rentType === 'monthly' ? 'e.g., 15000-20000' : 'e.g., 2000'}
                      />
                      {errors.monthlyPrice && (
                        <p className="mt-1 text-sm text-red-600">{errors.monthlyPrice}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        placeholder="Enter contact number"
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="roomDetails">Room Details</Label>
                      <Textarea
                        id="roomDetails"
                        value={formData.roomDetails}
                        onChange={(e) => handleChange('roomDetails', e.target.value)}
                        placeholder="Describe the property details..."
                        rows={3}
                      />
                      {errors.roomDetails && (
                        <p className="mt-1 text-sm text-red-600">{errors.roomDetails}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Select onValueChange={(value) => handleChange('propertyType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bachelor">Bachelor</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.propertyType && (
                        <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="images">Property Images</Label>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {formData.images.length > 0 && (
                        <p className="mt-1 text-sm text-green-600">
                          {formData.images.length} image(s) selected
                        </p>
                      )}
                    </div>

                    {errors.submit && (
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    )}

                    <Button type="submit" className="w-full" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload Property'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Properties</CardTitle>
                <CardDescription>
                  Find properties that match your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="searchLocation">Location</Label>
                    <Input
                      id="searchLocation"
                      type="text"
                      value={searchQuery.location}
                      onChange={(e) => handleSearchChange('location', e.target.value)}
                      placeholder="Enter location to search"
                    />
                  </div>

                  <div>
                    <Label htmlFor="searchRentType">Rent Type</Label>
                    <Select value={searchQuery.rentType} onValueChange={(value) => handleSearchChange('rentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="monthly">Monthly Rent</SelectItem>
                        <SelectItem value="temporary">Temporary Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="searchPropertyType">Property Type</Label>
                    <Select value={searchQuery.propertyType} onValueChange={(value) => handleSearchChange('propertyType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="bachelor">Bachelor</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSearch} className="w-full">
                    Search Properties
                  </Button>
                </div>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <SearchResults 
                results={searchResults} 
                searchQuery={searchQuery}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Listings</h1>
          <p className="text-gray-600">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} available
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-4">Upload your first property to get started!</p>
            <Button onClick={() => {
              setActiveTab('upload');
              setShowUploadForm(true);
            }}>
              Upload Property
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}