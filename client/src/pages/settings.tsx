/*
 * ADMIN SETTINGS PAGE
 * ===================
 * 
 * This page allows admin users to:
 * - Manage user accounts (create, edit, delete)
 * - Customize dashboard settings for each user
 * - Configure widget titles and subheadings
 * - Upload branding images
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Save, RefreshCw, Plus, Edit, Trash2, User } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Default subheadings - these must match the actual line_item values from raw data
const DEFAULT_REVENUE_KEYS = [
  'Office Visits',
  'Intravitreal Injections',
  'Cataract Surgeries',
  'Diagnostics & Minor Procedures',
  'Oculoplastics',
  'Corneal Procedures',
  'Refractive Cash',
  'Optical / Contact Lens Sales'
];
const DEFAULT_EXPENSES_KEYS = [
  'Drug Acquisition (injections)',
  'Surgical Supplies & IOLs',
  'Optical Cost of Goods',
  'Staff Wages & Benefits',
  'Rent & Utilities',
  'Insurance',
  'Billing & Coding Vendors',
  'Bad Debt Expense',
  'Marketing & Outreach',
  'Technology',
  'Equipment Service & Leases',
  'Office & Miscellaneous'
];
const DEFAULT_CASH_IN_KEYS = [
  'Patient Payments',
  'Insurance Reimbursements'
];
const DEFAULT_CASH_OUT_KEYS = [
  'Staff Wages & Benefits',
  'Drug Purchases',
  'Optical Goods',
  'Rent & Utilities',
  'Insurance',
  'Billing & Coding Vendors',
  'Marketing & Outreach',
  'Technology',
  'Equipment Service & Leases',
  'Office & Miscellaneous'
];
const DEFAULT_CASH_FLOW_KEYS = [
  'Net Cash from Operating',
  'Net Cash from Investing',
  'Net Cash from Financing'
];
const DEFAULT_AR_KEYS = ['0-30', '31-60', '61-90', '90+'];

// Clinical Procedure Name Overrides (for Top Revenue Procedures widget)
const DEFAULT_CLINICAL_PROCEDURE_KEYS = [
  'With IOL insertion',
  'Medication injection',
  'Refractive surgery',
  'Upper eyelid surgery',
  'Retinal imaging',
  'Laser glaucoma treatment',
  'New patient exam',
  '45-59 minutes'
];

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserConfig {
  username: string;
  role: 'admin' | 'user';
  practiceName: string;
  practiceSubtitle: string | null;
  logoUrl: string | null;
  ownerName: string | null;
  ownerTitle: string | null;
  ownerPhotoUrl: string | null;
  revenueTitle: string;
  expensesTitle: string;
  profitLossTitle: string;
  cashInTitle: string;
  cashOutTitle: string;
  topRevenueTitle: string;
  revenueSubheadings: Record<string, string>;
  expensesSubheadings: Record<string, string>;
  cashInSubheadings: Record<string, string>;
  cashOutSubheadings: Record<string, string>;
  cashFlowSubheadings: Record<string, string>;
  arSubheadings: Record<string, string>;
  procedureNameOverrides: Record<string, string>;
  locationNameOverrides: Record<string, string>;
  showCollectionsWidget: boolean;
  providers: Array<{
    name: string;
    percentage: number;
  }>;
  userLocations?: string[]; // Array of location IDs that this user has access to
}

interface PracticeLocation {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string | null;
  isActive?: boolean | null;
}

// Default providers when user has none
const DEFAULT_PROVIDERS = [
  { name: 'Dr. John Josephson', percentage: 19 },
  { name: 'Dr. Meghan G. Moroux', percentage: 14 },
  { name: 'Dr. Hubert H. Pham', percentage: 13 },
  { name: 'Dr. Sabita Ittoop', percentage: 10 },
  { name: 'Dr. Kristen E. Dunbar', percentage: 9 },
  { name: 'Dr. Erin Ong', percentage: 9 },
  { name: 'Dr. Prema Modak', percentage: 8 },
  { name: 'Dr. Julia Pierce', percentage: 7 },
  { name: 'Dr. Heloi Stark', percentage: 6 },
  { name: 'Dr. Noushin Sahraei', percentage: 5 }
];

export default function Settings() {
  const { toast } = useToast();
  const { user: currentUser, isAdmin, refreshUser, updateUser } = useAuth();
  
  // State declarations
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserConfig | null>(null);
  const [locations, setLocations] = useState<PracticeLocation[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });

  // Fetch users and locations on mount
  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin && !loading) {
      window.location.href = '/';
    }
  }, [isAdmin, loading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersRes = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (!usersRes.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersData = await usersRes.json();
      
      // Initialize users with safe defaults
      const usersWithDefaults = usersData.map((user: UserConfig) => {
        // Safely initialize providers
        if (!user.providers || !Array.isArray(user.providers) || user.providers.length === 0) {
          user.providers = [...DEFAULT_PROVIDERS];
        }
        
        // Safely initialize locations
        if (!user.userLocations || !Array.isArray(user.userLocations)) {
          user.userLocations = [];
        }
        
        // Safely initialize all subheading objects
        const initSubheadings = (existing: any, defaults: string[], labelFn: (k: string) => string = (k: string) => '') => {
          if (!existing || typeof existing !== 'object') {
            const result: Record<string, string> = {};
            defaults.forEach(key => { result[key] = labelFn(key) || ''; });
            return result;
          }
          const result = { ...existing };
          defaults.forEach(key => {
            if (!result.hasOwnProperty(key)) { result[key] = labelFn(key) || ''; }
          });
          return result;
        };
        
        user.revenueSubheadings = initSubheadings(user.revenueSubheadings, DEFAULT_REVENUE_KEYS);
        user.expensesSubheadings = initSubheadings(user.expensesSubheadings, DEFAULT_EXPENSES_KEYS);
        user.cashInSubheadings = initSubheadings(user.cashInSubheadings, DEFAULT_CASH_IN_KEYS);
        user.cashOutSubheadings = initSubheadings(user.cashOutSubheadings, DEFAULT_CASH_OUT_KEYS);
        user.cashFlowSubheadings = initSubheadings(user.cashFlowSubheadings, DEFAULT_CASH_FLOW_KEYS);
        user.arSubheadings = initSubheadings(user.arSubheadings, DEFAULT_AR_KEYS, (k) => `${k} days`);
        user.procedureNameOverrides = initSubheadings(user.procedureNameOverrides, DEFAULT_CLINICAL_PROCEDURE_KEYS);
        user.locationNameOverrides = user.locationNameOverrides || {};
        
        return user;
      });
      
      setUsers(usersWithDefaults);
      
      // Select first user by default
      if (usersWithDefaults.length > 0) {
        setSelectedUser(usersWithDefaults[0].username);
        setEditingUser(usersWithDefaults[0]);
      }
      
      // Fetch locations
      try {
        const locRes = await fetch('/api/locations');
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(Array.isArray(locData) ? locData : []);
        } else {
          setLocations([]);
        }
      } catch (locError) {
        console.error('Error fetching locations:', locError);
        setLocations([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleUserSelect = async (username: string) => {
    setSelectedUser(username);
    
    // Find user in local state first
    const cachedUser = users.find(u => u.username === username);
    if (cachedUser) {
      setEditingUser(cachedUser);
      return;
    }
    
    // Fetch fresh user data from API
    try {
      const response = await fetch(`/api/users/${username}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        
        // Ensure user has all required fields with defaults
        if (!user.providers || !Array.isArray(user.providers) || user.providers.length === 0) {
          user.providers = [...DEFAULT_PROVIDERS];
        }
        if (!user.userLocations || !Array.isArray(user.userLocations)) {
          user.userLocations = [];
        }
        
        setEditingUser(user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleInputChange = (field: keyof UserConfig, value: any) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [field]: value
      });
    }
  };

  const handleSubheadingChange = (category: 'revenueSubheadings' | 'expensesSubheadings' | 'cashInSubheadings' | 'cashOutSubheadings' | 'cashFlowSubheadings' | 'arSubheadings' | 'procedureNameOverrides', key: string, value: string) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [category]: {
          ...((editingUser[category] as object) || {}),
          [key]: value
        }
      });
    }
  };

  const handleImageUpload = async (field: 'logoUrl' | 'ownerPhotoUrl', file: File) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result?.toString() || '';
        
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "File size must be less than 5MB",
            variant: "destructive"
          });
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Error",
            description: "File must be an image",
            variant: "destructive"
          });
          return;
        }
        
        handleInputChange(field, base64Data);
        
        toast({
          title: "Success",
          description: "Image processed successfully (will be saved when you click Save Changes)"
        });
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/users/${editingUser.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editingUser)
      });
      
      if (!response.ok) {
        throw new Error('Save failed');
      }
      
      const updatedUser = await response.json();
      
      // Update users list
      setUsers(users.map(u => u.username === updatedUser.username ? updatedUser : u));
      setEditingUser(updatedUser);
      
      // CRITICAL: Immediately update AuthContext if editing current user
      if (currentUser && updatedUser.username === currentUser.username) {
        updateUser(updatedUser);
      }
      
      await refreshUser();
      
      toast({
        title: "Success",
        description: `Settings saved for ${editingUser.username}`
      });
      
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.username || !newUserData.password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUserData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setIsCreateDialogOpen(false);
      setNewUserData({ username: '', password: '', role: 'user' });
      
      toast({
        title: "Success",
        description: `User ${newUser.username} created successfully`
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') {
      toast({
        title: "Error",
        description: "Cannot delete admin user",
        variant: "destructive"
      });
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${username}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/users/${username}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Immediately remove user from sidebar state
      const remainingUsers = users.filter(u => u.username !== username);
      setUsers(remainingUsers);
      
      // If we deleted the selected user, switch to another user
      if (selectedUser === username) {
        if (remainingUsers.length > 0) {
          window.location.href = '/settings';
        } else {
          setSelectedUser(null);
          setEditingUser(null);
        }
      }
      
      toast({
        title: "Success",
        description: `User ${username} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  // CRITICAL: Loading guard
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  // CRITICAL: Editing user guard
  if (!editingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No user selected. Please select a user from the sidebar.</p>
          {users.length === 0 && (
            <p className="text-red-500 mt-2">No users found. Please reload the page.</p>
          )}
        </div>
      </div>
    );
  }

  // Safe providers array
  const safeProviders = editingUser.providers ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Admin Settings</h1>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* User List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Users</CardTitle>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="new-username">Username</Label>
                          <Input
                            id="new-username"
                            value={newUserData.username}
                            onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password">Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            placeholder="Enter password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-role">Role</Label>
                          <Select
                            value={newUserData.role}
                            onValueChange={(value: 'admin' | 'user') => setNewUserData({ ...newUserData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateUser}>Create User</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user.username}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedUser === user.username ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                      onClick={() => handleUserSelect(user.username)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      {user.username !== 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.username);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="branding" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="subheadings">Subheadings</TabsTrigger>
                <TabsTrigger value="providers">Providers</TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Branding</CardTitle>
                    <CardDescription>Customize practice name and logo for {editingUser.username}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="practiceName">Practice Name *</Label>
                        <Input
                          id="practiceName"
                          value={editingUser.practiceName}
                          onChange={(e) => handleInputChange('practiceName', e.target.value)}
                          placeholder="e.g., Smith Eye Care"
                        />
                      </div>
                      <div>
                        <Label htmlFor="practiceSubtitle">Practice Subtitle</Label>
                        <Input
                          id="practiceSubtitle"
                          value={editingUser.practiceSubtitle || ''}
                          onChange={(e) => handleInputChange('practiceSubtitle', e.target.value)}
                          placeholder="e.g., Premier Vision Care"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Practice Logo</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        {editingUser.logoUrl && (
                          <img 
                            src={editingUser.logoUrl} 
                            alt="Practice Logo" 
                            className="h-16 w-16 object-contain border rounded"
                          />
                        )}
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload('logoUrl', file);
                            }}
                            className="hidden"
                            id="logoUpload"
                          />
                          <Label htmlFor="logoUpload" className="cursor-pointer">
                            <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </div>
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB, JPEG/PNG/GIF/WebP</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                    <CardDescription>Customize owner/doctor information displayed in header</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerName">Owner Name</Label>
                        <Input
                          id="ownerName"
                          value={editingUser.ownerName || ''}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          placeholder="e.g., Dr. Sarah Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerTitle">Owner Title</Label>
                        <Input
                          id="ownerTitle"
                          value={editingUser.ownerTitle || ''}
                          onChange={(e) => handleInputChange('ownerTitle', e.target.value)}
                          placeholder="e.g., Medical Director"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Owner Photo</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        {editingUser.ownerPhotoUrl && (
                          <img 
                            src={editingUser.ownerPhotoUrl} 
                            alt="Owner Photo" 
                            className="h-16 w-16 object-cover border rounded-full"
                          />
                        )}
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload('ownerPhotoUrl', file);
                            }}
                            className="hidden"
                            id="photoUpload"
                          />
                          <Label htmlFor="photoUpload" className="cursor-pointer">
                            <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Photo
                            </div>
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB, JPEG/PNG/GIF/WebP</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Locations Tab */}
              <TabsContent value="locations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Locations</CardTitle>
                    <CardDescription>
                      Manage practice locations. Add, edit, or remove locations for your practice.
                      <br />
                      <span className="text-orange-500">Total Locations: {locations?.length || 0}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {locations?.map((location, index) => (
                      <div key={location.id} className="flex items-start gap-4 p-3 border rounded-lg">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label htmlFor={`location-name-${index}`}>Location Name</Label>
                            <Input
                              id={`location-name-${index}`}
                              value={location.name}
                              onChange={(e) => {
                                const newLocations = [...locations];
                                newLocations[index].name = e.target.value;
                                setLocations(newLocations);
                              }}
                              placeholder="e.g., Fairfax Office"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`location-address-${index}`}>Address (Optional)</Label>
                            <Input
                              id={`location-address-${index}`}
                              value={location.address || ''}
                              onChange={(e) => {
                                const newLocations = [...locations];
                                newLocations[index].address = e.target.value;
                                setLocations(newLocations);
                              }}
                              placeholder="e.g., 123 Main St, City, State ZIP"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`location-phone-${index}`}>Phone</Label>
                            <Input
                              id={`location-phone-${index}`}
                              value={location.phone || ''}
                              onChange={(e) => {
                                const newLocations = [...locations];
                                newLocations[index].phone = e.target.value;
                                setLocations(newLocations);
                              }}
                              placeholder="e.g., (555) 123-4567"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete ${location.name}?`)) {
                              return;
                            }
                            
                            try {
                              const response = await fetch('/api/locations', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ id: location.id })
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to delete location');
                              }
                              
                              setLocations(locations.filter(loc => loc.id !== location.id));
                              
                              toast({
                                title: "Success",
                                description: `Location ${location.name} deleted successfully`
                              });
                            } catch (error) {
                              console.error('Error deleting location:', error);
                              toast({
                                title: "Error",
                                description: "Failed to delete location",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Total Locations: {locations?.length || 0}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newLocation = {
                            id: `location-${Date.now()}`,
                            name: '',
                            address: '',
                            phone: null,
                            isActive: true
                          };
                          setLocations([...(locations || []), newLocation]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Location
                      </Button>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button
                        onClick={async () => {
                          try {
                            for (const location of (locations || [])) {
                              if (!location.name) {
                                toast({
                                  title: "Error",
                                  description: "All locations must have a name",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              if (location.id.startsWith('location-')) {
                                const response = await fetch('/api/locations', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify(location)
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to create location');
                                }
                              } else {
                                const response = await fetch('/api/locations', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify(location)
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to update location');
                                }
                              }
                            }
                            
                            await fetchData();
                            
                            toast({
                              title: "Success",
                              description: "Locations saved successfully"
                            });
                          } catch (error) {
                            console.error('Error saving locations:', error);
                            toast({
                              title: "Error",
                              description: "Failed to save locations",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save All Locations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subheadings Tab */}
              <TabsContent value="subheadings" className="space-y-6">
                {/* Revenue Subheadings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Subheadings</CardTitle>
                    <CardDescription>Customize revenue category names</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_REVENUE_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key}</Label>
                        <Input
                          value={editingUser.revenueSubheadings?.[key] || key}
                          onChange={(e) => handleSubheadingChange('revenueSubheadings', key, e.target.value)}
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Expenses Subheadings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses Subheadings</CardTitle>
                    <CardDescription>Customize expense category names</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_EXPENSES_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key}</Label>
                        <Input
                          value={editingUser.expensesSubheadings?.[key] || key}
                          onChange={(e) => handleSubheadingChange('expensesSubheadings', key, e.target.value)}
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Cash In Subheadings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cash In Subheadings</CardTitle>
                    <CardDescription>Customize cash inflow category names</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_CASH_IN_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key}</Label>
                        <Input
                          value={editingUser.cashInSubheadings?.[key] || key}
                          onChange={(e) => handleSubheadingChange('cashInSubheadings', key, e.target.value)}
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Cash Out Subheadings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Out Subheadings</CardTitle>
                    <CardDescription>Customize cash outflow category names</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_CASH_OUT_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key}</Label>
                        <Input
                          value={editingUser.cashOutSubheadings?.[key] || key}
                          onChange={(e) => handleSubheadingChange('cashOutSubheadings', key, e.target.value)}
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AR Buckets Subheadings */}
                <Card>
                  <CardHeader>
                    <CardTitle>AR Buckets Subheadings</CardTitle>
                    <CardDescription>Customize AR aging bucket labels (0-30, 31-60, 61-90, 90+ days)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_AR_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key} days</Label>
                        <Input
                          value={editingUser.arSubheadings?.[key] ?? `${key} days`}
                          onChange={(e) => handleSubheadingChange('arSubheadings', key, e.target.value)}
                          placeholder={`${key} days`}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Cash Flow Subheadings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Subheadings</CardTitle>
                    <CardDescription>Customize cash flow statement category names (Operating, Investing, Financing)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_CASH_FLOW_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key}</Label>
                        <Input
                          value={editingUser.cashFlowSubheadings?.[key] || key}
                          onChange={(e) => handleSubheadingChange('cashFlowSubheadings', key, e.target.value)}
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Clinical Procedures - Top Revenue Procedures */}
                <Card>
                  <CardHeader>
                    <CardTitle>Clinical Procedures</CardTitle>
                    <CardDescription>Customize clinical procedure names displayed in the Top Revenue Procedures widget</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEFAULT_CLINICAL_PROCEDURE_KEYS.map((key) => (
                      <div key={key}>
                        <Label className="text-xs text-gray-500">{key}</Label>
                        <Input
                          value={editingUser.procedureNameOverrides?.[key] || ''}
                          onChange={(e) => handleSubheadingChange('procedureNameOverrides', key, e.target.value)}
                          placeholder={key}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Providers Tab */}
              <TabsContent value="providers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Provider/Doctor Revenue Distribution</CardTitle>
                    <CardDescription>
                      Customize the list of providers and their revenue percentages for the Revenue Breakdown widget.
                      Total percentage must equal 100%.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {safeProviders.map((provider, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor={`provider-name-${index}`}>Provider Name</Label>
                          <Input
                            id={`provider-name-${index}`}
                            value={provider.name}
                            onChange={(e) => {
                              const newProviders = [...safeProviders];
                              newProviders[index].name = e.target.value;
                              handleInputChange('providers', newProviders);
                            }}
                            placeholder="e.g., Dr. John Smith"
                          />
                        </div>
                        <div className="w-32">
                          <Label htmlFor={`provider-percentage-${index}`}>Percentage</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`provider-percentage-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={provider.percentage}
                              onChange={(e) => {
                                const newProviders = [...safeProviders];
                                newProviders[index].percentage = parseFloat(e.target.value) || 0;
                                handleInputChange('providers', newProviders);
                              }}
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newProviders = safeProviders.filter((_, i) => i !== index);
                            handleInputChange('providers', newProviders);
                          }}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium">
                          Total: {safeProviders.reduce((sum, p) => sum + p.percentage, 0)}%
                        </p>
                        {safeProviders.reduce((sum, p) => sum + p.percentage, 0) !== 100 && (
                          <p className="text-xs text-red-500">Warning: Total should equal 100%</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newProviders = [...safeProviders, { name: '', percentage: 0 }];
                          handleInputChange('providers', newProviders);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Provider
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
