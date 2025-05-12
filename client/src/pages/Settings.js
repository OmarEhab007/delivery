import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  VpnKey as PasswordIcon,
  SettingsApplications as SettingsIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { auth } from '../api/api';

// Password validation schema
const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required')
});

// Profile validation schema
const profileSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().required('Phone number is required')
});

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [systemSettings, setSystemSettings] = useState({
    enableNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    autoLogout: true,
    logoutTime: 30,
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await auth.getProfile();
        if (response.data && response.data.data) {
          const user = response.data.data.user;
          setUserData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || ''
          });
          // If user has a profile picture, set it
          if (user.profilePicture) {
            setProfileImage(user.profilePicture);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        enqueueSnackbar('Failed to load user profile', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [enqueueSnackbar]);

  // Profile form
  const profileFormik = useFormik({
    initialValues: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        // Mock API call for updating user profile - would use a real endpoint in production
        // await axios.put('/api/users/profile', values);
        
        // Update local state to simulate successful update
        setUserData({
          ...userData,
          ...values
        });
        
        enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error updating profile:', error);
        enqueueSnackbar('Failed to update profile', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  // Password form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        // Mock API call for password change - would use a real endpoint in production
        // await axios.post('/api/users/change-password', {
        //   currentPassword: values.currentPassword,
        //   newPassword: values.newPassword
        // });
        
        enqueueSnackbar('Password changed successfully', { variant: 'success' });
        
        // Reset form
        passwordFormik.resetForm();
      } catch (error) {
        console.error('Error changing password:', error);
        enqueueSnackbar('Failed to change password', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Settings change handler
  const handleSettingChange = (setting) => (event) => {
    setSystemSettings({
      ...systemSettings,
      [setting]: event.target.checked
    });
  };

  // Handle file upload for profile picture
  const handleProfilePictureChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      
      reader.readAsDataURL(file);
      
      // Would upload file to server in real implementation
      // const formData = new FormData();
      // formData.append('profilePicture', file);
      // axios.post('/api/users/profile-picture', formData);
    }
  };

  // Save system settings
  const handleSaveSettings = () => {
    // Would save settings to server in real implementation
    // axios.post('/api/admin/settings', systemSettings);
    
    enqueueSnackbar('Settings saved successfully', { variant: 'success' });
  };

  if (loading && !userData.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Settings
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Profile" icon={<Avatar sx={{ width: 24, height: 24 }} />} iconPosition="start" />
          <Tab label="Security" icon={<PasswordIcon />} iconPosition="start" />
          <Tab label="System Settings" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={profileFormik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={profileImage}
                  sx={{
                    width: 150,
                    height: 150,
                    mb: 2,
                    boxShadow: 3
                  }}
                />
                <input
                  accept="image/*"
                  id="profile-picture-input"
                  type="file"
                  hidden
                  onChange={handleProfilePictureChange}
                />
                <label htmlFor="profile-picture-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CameraIcon />}
                    sx={{ mb: 1 }}
                  >
                    Change Picture
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary">
                  Recommended: 200x200px, Max 2MB
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Full Name"
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                      helperText={profileFormik.touched.name && profileFormik.errors.name}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email Address"
                      type="email"
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                      helperText={profileFormik.touched.email && profileFormik.errors.email}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="phone"
                      name="phone"
                      label="Phone Number"
                      value={profileFormik.values.phone}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                      helperText={profileFormik.touched.phone && profileFormik.errors.phone}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="role"
                      name="role"
                      label="Role"
                      value={userData.role}
                      disabled
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={profileFormik.isSubmitting || !profileFormik.dirty}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
        
        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={passwordFormik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Strong passwords include a mix of letters, numbers, and special characters.
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="currentPassword"
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                  helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  type="password"
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                  helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                  helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<PasswordIcon />}
                    disabled={passwordFormik.isSubmitting}
                  >
                    Change Password
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
          
          <Divider sx={{ my: 4 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Login Sessions
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Session
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IP Address: 192.168.1.1
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Activity: {new Date().toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Device: Chrome on MacOS
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" color="error" size="small">
                      Logout from all devices
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* System Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.enableNotifications}
                    onChange={handleSettingChange('enableNotifications')}
                    color="primary"
                  />
                }
                label="Enable Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.emailNotifications}
                    onChange={handleSettingChange('emailNotifications')}
                    color="primary"
                    disabled={!systemSettings.enableNotifications}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.smsNotifications}
                    onChange={handleSettingChange('smsNotifications')}
                    color="primary"
                    disabled={!systemSettings.enableNotifications}
                  />
                }
                label="SMS Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Display Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.darkMode}
                    onChange={handleSettingChange('darkMode')}
                    color="primary"
                  />
                }
                label="Dark Mode"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Security Settings
        </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.autoLogout}
                    onChange={handleSettingChange('autoLogout')}
                    color="primary"
                  />
                }
                label="Auto Logout on Inactivity"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Logout Time (minutes)"
                value={systemSettings.logoutTime}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  logoutTime: e.target.value
                })}
                disabled={!systemSettings.autoLogout}
                InputProps={{ inputProps: { min: 1, max: 120 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSettings}
                >
                  Save Settings
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings; 