import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Shipments = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Shipments
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Shipments management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Shipments; 