import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          User profile settings will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile; 