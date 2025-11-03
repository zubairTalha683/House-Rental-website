import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

const BUCKET_NAME = 'make-5dcf8578-rental-images';

// Initialize Supabase Storage bucket
async function initStorage() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
    });
    console.log('Storage bucket created:', BUCKET_NAME);
  }
}

// Initialize storage on startup
initStorage();

// Helper function to create Supabase client with service role
function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Helper function to get user from access token
async function getAuthUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }
  
  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    console.log('Auth error:', error);
    return null;
  }
  
  return user;
}

// SIGNUP ROUTE
app.post('/make-server-5dcf8578/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { username, location, phoneNumber, nidNumber, userType, password } = body;
    
    // Validate required fields
    if (!username || !location || !phoneNumber || !nidNumber || !userType || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    
    const supabase = getServiceClient();
    
    // Create auth user with email format (username@rental.local)
    const email = `${username.toLowerCase().replace(/\s+/g, '')}@rental.local`;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (authError) {
      console.log('Signup auth error:', authError);
      return c.json({ error: authError.message || 'Failed to create user' }, 400);
    }
    
    const userId = authData.user.id;
    
    // Store extended user data in KV store
    const userData = {
      userId,
      username,
      location,
      phoneNumber,
      nidNumber,
      userType,
      profilePicture: null,
      joinedDate: new Date().toISOString()
    };
    
    await kv.set(`user:${userId}`, userData);
    
    return c.json({ 
      success: true, 
      message: 'User created successfully',
      userId 
    });
    
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// SIGNIN ROUTE
app.post('/make-server-5dcf8578/signin', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }
    
    const supabase = getServiceClient();
    const email = `${username.toLowerCase().replace(/\s+/g, '')}@rental.local`;
    
    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error || !data.session) {
      console.log('Signin error:', error);
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    
    // Get user data from KV store
    const userData = await kv.get(`user:${data.user.id}`);
    
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }
    
    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: userData
    });
    
  } catch (error) {
    console.log('Signin error:', error);
    return c.json({ error: 'Internal server error during signin' }, 500);
  }
});

// SIGNOUT ROUTE
app.post('/make-server-5dcf8578/signout', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const supabase = getServiceClient();
    await supabase.auth.admin.signOut(user.id);
    
    return c.json({ success: true });
    
  } catch (error) {
    console.log('Signout error:', error);
    return c.json({ error: 'Internal server error during signout' }, 500);
  }
});

// GET USER DATA
app.get('/make-server-5dcf8578/user', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }
    
    return c.json({ user: userData });
    
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Internal server error while fetching user' }, 500);
  }
});

// UPDATE USER PROFILE
app.put('/make-server-5dcf8578/user/profile', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { location, phoneNumber, nidNumber, userType } = body;
    
    // Get existing user data
    const existingData = await kv.get(`user:${user.id}`);
    
    if (!existingData) {
      return c.json({ error: 'User data not found' }, 404);
    }
    
    // Update user data
    const updatedData = {
      ...existingData,
      location: location || existingData.location,
      phoneNumber: phoneNumber || existingData.phoneNumber,
      nidNumber: nidNumber || existingData.nidNumber,
      userType: userType || existingData.userType,
    };
    
    await kv.set(`user:${user.id}`, updatedData);
    
    return c.json({ success: true, user: updatedData });
    
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: 'Internal server error while updating profile' }, 500);
  }
});

// UPLOAD IMAGE (for properties or profile)
app.post('/make-server-5dcf8578/upload-image', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const supabase = getServiceClient();
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.log('Upload error:', error);
      return c.json({ error: 'Failed to upload image' }, 500);
    }
    
    // Create signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000);
    
    return c.json({ 
      success: true, 
      filePath: fileName,
      url: signedUrlData?.signedUrl 
    });
    
  } catch (error) {
    console.log('Upload image error:', error);
    return c.json({ error: 'Internal server error during image upload' }, 500);
  }
});

// UPDATE PROFILE PICTURE
app.put('/make-server-5dcf8578/user/profile-picture', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { imageUrl } = body;
    
    if (!imageUrl) {
      return c.json({ error: 'Image URL is required' }, 400);
    }
    
    // Get existing user data
    const existingData = await kv.get(`user:${user.id}`);
    
    if (!existingData) {
      return c.json({ error: 'User data not found' }, 404);
    }
    
    // Update profile picture
    const updatedData = {
      ...existingData,
      profilePicture: imageUrl,
    };
    
    await kv.set(`user:${user.id}`, updatedData);
    
    return c.json({ success: true, user: updatedData });
    
  } catch (error) {
    console.log('Update profile picture error:', error);
    return c.json({ error: 'Internal server error while updating profile picture' }, 500);
  }
});

// CREATE PROPERTY
app.post('/make-server-5dcf8578/property', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { 
      location, 
      monthlyPriceRange, 
      phoneNumber, 
      roomDetails, 
      propertyType, 
      images,
      temporaryRent,
      temporaryRentDays
    } = body;
    
    // Validate required fields
    if (!location || !phoneNumber || !roomDetails || !propertyType) {
      return c.json({ error: 'Required fields are missing' }, 400);
    }
    
    const propertyId = `prop_${Date.now()}_${user.id}`;
    
    const propertyData = {
      id: propertyId,
      userId: user.id,
      location,
      monthlyPriceRange: monthlyPriceRange || null,
      phoneNumber,
      roomDetails,
      propertyType, // 'bachelor' or 'family'
      images: images || [],
      temporaryRent: temporaryRent || false,
      temporaryRentDays: temporaryRentDays || null,
      uploadedAt: new Date().toISOString()
    };
    
    // Store property
    await kv.set(`property:${propertyId}`, propertyData);
    
    // Add property ID to user's property list
    const userPropertiesKey = `properties:user:${user.id}`;
    const existingProperties = await kv.get(userPropertiesKey) || [];
    await kv.set(userPropertiesKey, [...existingProperties, propertyId]);
    
    // Add to all properties index
    const allPropertiesKey = 'properties:all';
    const allProperties = await kv.get(allPropertiesKey) || [];
    await kv.set(allPropertiesKey, [...allProperties, propertyId]);
    
    return c.json({ success: true, property: propertyData });
    
  } catch (error) {
    console.log('Create property error:', error);
    return c.json({ error: 'Internal server error while creating property' }, 500);
  }
});

// GET ALL PROPERTIES (with optional filters)
app.get('/make-server-5dcf8578/properties', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get query parameters for filtering
    const location = c.req.query('location');
    const rentType = c.req.query('rentType'); // 'temporary' or 'monthly'
    const propertyType = c.req.query('propertyType'); // 'bachelor' or 'family'
    
    // Get all property IDs
    const allPropertiesKey = 'properties:all';
    const propertyIds = await kv.get(allPropertiesKey) || [];
    
    // Fetch all properties
    const properties = [];
    for (const propId of propertyIds) {
      const property = await kv.get(`property:${propId}`);
      if (property) {
        properties.push(property);
      }
    }
    
    // Apply filters
    let filteredProperties = properties;
    
    if (location) {
      filteredProperties = filteredProperties.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (rentType === 'temporary') {
      filteredProperties = filteredProperties.filter(p => p.temporaryRent === true);
    } else if (rentType === 'monthly') {
      filteredProperties = filteredProperties.filter(p => p.temporaryRent === false);
    }
    
    if (propertyType) {
      filteredProperties = filteredProperties.filter(p => 
        p.propertyType === propertyType
      );
    }
    
    return c.json({ properties: filteredProperties });
    
  } catch (error) {
    console.log('Get properties error:', error);
    return c.json({ error: 'Internal server error while fetching properties' }, 500);
  }
});

// GET USER'S PROPERTIES
app.get('/make-server-5dcf8578/user-properties', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userPropertiesKey = `properties:user:${user.id}`;
    const propertyIds = await kv.get(userPropertiesKey) || [];
    
    // Fetch all user's properties
    const properties = [];
    for (const propId of propertyIds) {
      const property = await kv.get(`property:${propId}`);
      if (property) {
        properties.push(property);
      }
    }
    
    return c.json({ properties });
    
  } catch (error) {
    console.log('Get user properties error:', error);
    return c.json({ error: 'Internal server error while fetching user properties' }, 500);
  }
});

Deno.serve(app.fetch);
