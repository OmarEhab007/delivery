import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { auth } from '../api/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    createdAt: '',
    lastLogin: '',
    profilePicture: null
  });
  
  const [activityStats, setActivityStats] = useState({
    totalLogins: 45,
    lastWeekActivity: 12,
    recentActions: [
      { id: 1, action: 'Updated user settings', time: '2 hours ago' },
      { id: 2, action: 'Approved shipment #12345', time: '5 hours ago' },
      { id: 3, action: 'Approved new driver application', time: '1 day ago' },
      { id: 4, action: 'Modified system settings', time: '3 days ago' },
    ]
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
            role: user.role || '',
            createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : new Date().toLocaleDateString(),
            profilePicture: user.profilePicture || null
          });
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

  const handleEditProfile = () => {
    navigate('/settings');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        My Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={userData.profilePicture}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  boxShadow: 3
                }}
              />
              <Typography variant="h5" fontWeight="bold">{userData.name}</Typography>
              <Chip 
                label={userData.role} 
                color="primary" 
                sx={{ mt: 1 }}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary={userData.email} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone" 
                  secondary={userData.phone} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <AccountIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Account Created" 
                  secondary={userData.createdAt} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <TimeIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Last Login" 
                  secondary={userData.lastLogin} 
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                onClick={handleEditProfile}
                fullWidth
              >
                Edit Profile
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Activity Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Security Overview
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Two-Factor Authentication</Typography>
                      <Chip label="Enabled" color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Last Password Change</Typography>
                      <Typography variant="body2">30 days ago</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Active Sessions</Typography>
                      <Typography variant="body2">1 device</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Password Strength</Typography>
                      <Chip label="Strong" color="success" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Activity Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Total Logins</Typography>
                      <Typography variant="body2">{activityStats.totalLogins}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Last Week Activity</Typography>
                      <Typography variant="body2">{activityStats.lastWeekActivity} actions</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Last Action</Typography>
                      <Typography variant="body2">{activityStats.recentActions[0].time}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Active Status</Typography>
                      <Chip label="Online" color="success" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Activity
                  </Typography>
                  <List>
                    {activityStats.recentActions.map((action) => (
                      <React.Fragment key={action.id}>
                        <ListItem>
                          <ListItemText 
                            primary={action.action}
                            secondary={action.time}
                          />
                        </ListItem>
                        {action.id !== activityStats.recentActions.length && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 