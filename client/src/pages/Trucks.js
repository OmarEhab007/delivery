import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Trucks = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Trucks
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Trucks management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Trucks; 