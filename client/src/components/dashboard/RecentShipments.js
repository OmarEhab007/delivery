import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stack,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { StatusChip } from '../common/EnhancedDataGrid';

const RecentShipments = ({ shipments, statusMap, emptyLabel }) => {
  if (!Array.isArray(shipments) || shipments.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {shipments.map((shipment, index) => {
        const merchantName = shipment.merchantId?.name || 'Unknown merchant';
        const status = (shipment.status || '').toUpperCase();

        return (
          <React.Fragment key={shipment._id || index}>
            <ListItem sx={{ alignItems: 'flex-start', px: 0 }}>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalShippingIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.primary">
                      {shipment.cargoDetails?.description || 'Shipment'}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {merchantName} • {new Date(shipment.createdAt).toLocaleString()}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <StatusChip status={status} statusMap={statusMap} />
              </ListItemSecondaryAction>
            </ListItem>
            {index < shipments.length - 1 && <Divider component="li" sx={{ mx: 0 }} />}
          </React.Fragment>
        );
      })}
    </List>
  );
};

RecentShipments.propTypes = {
  shipments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      createdAt: PropTypes.string,
      status: PropTypes.string,
      merchantId: PropTypes.shape({
        name: PropTypes.string,
      }),
      cargoDetails: PropTypes.shape({
        description: PropTypes.string,
      }),
    })
  ),
  statusMap: PropTypes.object.isRequired,
  emptyLabel: PropTypes.string,
};

RecentShipments.defaultProps = {
  shipments: [],
  emptyLabel: 'No recent shipments yet.',
};

export default RecentShipments;
