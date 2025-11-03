import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import ProfileModal from './ProfileModal';

interface HeaderProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  currentUser: any;
  onProfileUpdate: (updatedProfile: any) => void;
}

export default function Header({ onNavigate, isAuthenticated, onLogout, currentUser, onProfileUpdate }: HeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getInitials = (username: string) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">RentalHub</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => onNavigate('landing')}
                  className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span>Home</span>
                </button>
                <button
                  onClick={() => onNavigate('about')}
                  className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span>About</span>
                </button>
                <button
                  onClick={() => onNavigate('service')}
                  className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span>Service</span>
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => onNavigate('dashboard')}
                    variant="outline"
                    size="sm"
                  >
                    Dashboard
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 cursor-pointer">
                          <AvatarImage 
                            src={currentUser?.profilePicture} 
                            alt={currentUser?.username}
                          />
                          <AvatarFallback>
                            {getInitials(currentUser?.username)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={currentUser?.profilePicture} 
                            alt={currentUser?.username}
                          />
                          <AvatarFallback>
                            {getInitials(currentUser?.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {currentUser?.username}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {currentUser?.userType === 'renter' ? 'Renter' : 'Property Owner'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="px-3 py-3 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Location:</span>
                            <span className="truncate ml-2">{currentUser?.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Phone:</span>
                            <span className="truncate ml-2">{currentUser?.phoneNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">NID:</span>
                            <span className="truncate ml-2">{currentUser?.nidNumber}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => onNavigate('profile')}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={onLogout}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => onNavigate('login')}
                    variant="outline"
                    size="sm"
                    className="font-medium"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => onNavigate('signup')}
                    size="sm"
                    className="font-medium"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdate={onProfileUpdate}
        />
      )}
    </>
  );
}