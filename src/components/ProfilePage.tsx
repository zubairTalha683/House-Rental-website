import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ProfileModal from './ProfileModal';
import PropertyCard from './PropertyCard';
import { api } from '../services/api';

interface ProfilePageProps {
  currentUser: any;
  onProfileUpdate: (updatedProfile: any) => Promise<boolean>;
  onNavigate: (page: string) => void;
}

export default function ProfilePage({ currentUser, onProfileUpdate, onNavigate }: ProfilePageProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProperties, setUserProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProperties = async () => {
      try {
        const data = await api.getUserProperties();
        setUserProperties(data.properties || []);
      } catch (error) {
        console.error('Failed to load user properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProperties();
  }, []);

  const getInitials = (username: string) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountAge = () => {
    if (!currentUser?.joinedDate) return 'Unknown';
    const joinDate = new Date(currentUser.joinedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
              className="mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information and view your activity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center pb-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.username} />
                      <AvatarFallback className="text-4xl">
                        {getInitials(currentUser?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{currentUser?.username}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant={currentUser?.userType === 'owner' ? 'default' : 'secondary'}>
                          {currentUser?.userType === 'owner' ? 'Property Owner' : 'Renter'}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowEditModal(true)}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium">{getAccountAge()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Properties listed</span>
                    <span className="font-medium">{userProperties.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account type</span>
                    <Badge variant={currentUser?.userType === 'owner' ? 'default' : 'secondary'}>
                      {currentUser?.userType === 'owner' ? 'Owner' : 'Renter'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Personal Details</TabsTrigger>
                  <TabsTrigger value="properties">My Properties</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Your personal details and contact information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Username</label>
                          <p className="mt-1 text-gray-900">{currentUser?.username}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">User Type</label>
                          <p className="mt-1">
                            <Badge variant={currentUser?.userType === 'owner' ? 'default' : 'secondary'}>
                              {currentUser?.userType === 'owner' ? 'Property Owner' : 'Renter'}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Location</label>
                          <p className="mt-1 text-gray-900">{currentUser?.location}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone Number</label>
                          <p className="mt-1 text-gray-900">{currentUser?.phoneNumber}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">NID Number</label>
                          <p className="mt-1 text-gray-900 font-mono">{currentUser?.nidNumber}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>
                        Your account creation and activity details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Join Date</label>
                          <p className="mt-1 text-gray-900">{formatDate(currentUser?.joinedDate)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Account Status</label>
                          <p className="mt-1">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="properties" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Properties ({userProperties.length})</CardTitle>
                      <CardDescription>
                        Properties you have listed on RentalHub
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userProperties.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties listed</h3>
                          <p className="text-gray-600 mb-4">You haven't listed any properties yet.</p>
                          <Button onClick={() => onNavigate('dashboard')}>
                            Go to Dashboard
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {userProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowEditModal(false)}
          onUpdate={onProfileUpdate}
        />
      )}
    </>
  );
}