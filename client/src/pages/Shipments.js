import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  MenuItem,
  Paper,
  Grid,
  Alert,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { shipments } from '../api/api';

// Status mapping for consistent styling
const statusMap = {
  'REQUESTED': { label: 'Requested', color: 'info' },
  'CONFIRMED': { label: 'Confirmed', color: 'primary' },
  'IN_TRANSIT': { label: 'In Transit', color: 'warning' },
  'DELIVERED': { label: 'Delivered', color: 'success' },
  'CANCELLED': { label: 'Cancelled', color: 'error' }
};

// Validation schema for status update
const statusUpdateSchema = Yup.object({
  status: Yup.string()
    .required('Status is required')
    .oneOf(Object.keys(statusMap), 'Invalid status'),
  notes: Yup.string()
});

// Shipment details dialog
const ShipmentDetailsDialog = ({ open, onClose, shipment }) => {
  if (!shipment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold' }}>
        Shipment Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Shipment Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Shipment ID</Typography>
                <Typography variant="body1">{shipment._id}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{shipment.description || 'No description'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Weight (kg)</Typography>
                <Typography variant="body1">{shipment.weight}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Dimensions (cm)</Typography>
                <Typography variant="body1">
                  {shipment.dimensions ? 
                    `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height}` : 
                    'Not specified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip
                  label={statusMap[shipment.status]?.label || shipment.status}
                  color={statusMap[shipment.status]?.color || 'default'}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Locations
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Pickup Location</Typography>
                <Typography variant="body1">
                  {shipment.pickupLocation ? 
                    `${shipment.pickupLocation.address}, ${shipment.pickupLocation.city}, ${shipment.pickupLocation.country}` : 
                    'Not specified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Delivery Location</Typography>
                <Typography variant="body1">
                  {shipment.deliveryLocation ? 
                    `${shipment.deliveryLocation.address}, ${shipment.deliveryLocation.city}, ${shipment.deliveryLocation.country}` : 
                    'Not specified'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Dates & Times
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Created On</Typography>
                <Typography variant="body1">
                  {new Date(shipment.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Expected Pickup</Typography>
                <Typography variant="body1">
                  {shipment.expectedPickupDate ? 
                    new Date(shipment.expectedPickupDate).toLocaleString() : 
                    'Not scheduled'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Expected Delivery</Typography>
                <Typography variant="body1">
                  {shipment.expectedDeliveryDate ? 
                    new Date(shipment.expectedDeliveryDate).toLocaleString() : 
                    'Not scheduled'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Merchant & Truck Details
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Merchant</Typography>
                <Typography variant="body1">
                  {shipment.merchantId?.name || 'Not assigned'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Assigned Truck</Typography>
                <Typography variant="body1">
                  {shipment.assignedTruckId ? 
                    `${shipment.assignedTruckId.registrationNumber} (${shipment.assignedTruckId.type})` : 
                    'Not assigned'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {shipment.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1">{shipment.notes}</Typography>
              </Paper>
            </Grid>
          )}
          
          {shipment.trackingHistory && shipment.trackingHistory.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Tracking History
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {shipment.trackingHistory.map((entry, index) => (
                  <Box key={index} sx={{ mb: index !== shipment.trackingHistory.length - 1 ? 2 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {entry.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {entry.location && (
                      <Typography variant="body2" color="text.secondary">
                        Location: {entry.location}
                      </Typography>
                    )}
                    {entry.notes && <Typography variant="body2">{entry.notes}</Typography>}
                    {index !== shipment.trackingHistory.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Status update dialog
const StatusUpdateDialog = ({ open, onClose, onSubmit, shipment }) => {
  const formik = useFormik({
    initialValues: {
      status: shipment?.status || '',
      notes: ''
    },
    validationSchema: statusUpdateSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold' }}>
        Update Shipment Status
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Changing the status will update the tracking history and notify relevant parties.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                id="status"
                name="status"
                label="Status"
                value={formik.values.status}
                onChange={formik.handleChange}
                error={formik.touched.status && Boolean(formik.errors.status)}
                helperText={formik.touched.status && formik.errors.status}
              >
                {Object.entries(statusMap).map(([value, { label }]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes (Optional)"
                multiline
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={formik.isSubmitting}
          >
            Update Status
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Delete shipment confirmation dialog
const DeleteShipmentDialog = ({ open, onClose, onConfirm, shipmentId }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: { borderRadius: 2 }
    }}
  >
    <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mb: 2 }}>
        This action cannot be undone.
      </Alert>
      <Typography>
        Are you sure you want to delete shipment <strong>{shipmentId}</strong>?
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onClose} variant="outlined">
        Cancel
      </Button>
      <Button onClick={onConfirm} variant="contained" color="error">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const Shipments = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [shipmentsData, setShipmentsData] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Fetch shipments data
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await shipments.getAll();
      if (response.data && response.data.data) {
        setShipmentsData(response.data.data.shipments || []);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      enqueueSnackbar('Failed to load shipments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Handle viewing shipment details
  const handleViewDetails = (shipment) => {
    setSelectedShipment(shipment);
    setDetailsDialogOpen(true);
  };

  // Handle status update click
  const handleStatusUpdateClick = (shipment) => {
    setSelectedShipment(shipment);
    setStatusDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (shipment) => {
    setSelectedShipment(shipment);
    setDeleteDialogOpen(true);
  };

  // Handle status update submission
  const handleStatusUpdate = async (values) => {
    if (!selectedShipment) return;

    setStatusDialogOpen(false);
    setLoading(true);

    try {
      await shipments.changeStatus(selectedShipment._id, values.status, values.notes);
      enqueueSnackbar('Shipment status updated successfully', { variant: 'success' });
      fetchShipments();
    } catch (error) {
      console.error('Error updating shipment status:', error);
      enqueueSnackbar('Failed to update shipment status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedShipment) return;

    setDeleteDialogOpen(false);
    setLoading(true);

    try {
      await shipments.delete(selectedShipment._id);
      enqueueSnackbar('Shipment deleted successfully', { variant: 'success' });
      fetchShipments();
    } catch (error) {
      console.error('Error deleting shipment:', error);
      enqueueSnackbar('Failed to delete shipment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
  const columns = [
    { 
      field: '_id', 
      headerName: 'Shipment ID',
      flex: 1,
      minWidth: 220,
    },
    { 
      field: 'merchantName', 
      headerName: 'Merchant',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        return params.row.merchantId?.name || 'N/A';
      }
    },
    { 
      field: 'weight', 
      headerName: 'Weight (kg)',
      flex: 0.5,
      minWidth: 100,
      type: 'number'
    },
    { 
      field: 'pickupCity', 
      headerName: 'Origin',
      flex: 0.7,
      minWidth: 120,
      valueGetter: (params) => {
        return params.row.pickupLocation?.city || 'N/A';
      }
    },
    { 
      field: 'deliveryCity', 
      headerName: 'Destination',
      flex: 0.7,
      minWidth: 120,
      valueGetter: (params) => {
        return params.row.deliveryLocation?.city || 'N/A';
      }
    },
    { 
      field: 'status', 
      headerName: 'Status',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => (
        <StatusChip
          label={statusMap[params.value]?.label || params.value}
          color={statusMap[params.value]?.color || 'default'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created On',
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleViewDetails(params.row)}
              color="primary"
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Update Status">
            <IconButton
              size="small"
              onClick={() => handleStatusUpdateClick(params.row)}
              color="secondary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Quick status filters
  const renderStatusFilters = () => (
    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {Object.entries(statusMap).map(([status, { label, color }]) => (
        <Chip 
          key={status}
          label={label}
          color={color}
          variant="outlined"
          onClick={() => setFilterValue(status)}
          sx={{ 
            cursor: 'pointer',
            '&:hover': { boxShadow: 1 }
          }}
        />
      ))}
      {filterValue && (
        <Chip 
          label="Clear Filters"
          variant="outlined"
          onClick={() => setFilterValue('')}
          sx={{ cursor: 'pointer' }}
        />
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Shipments Management
      </Typography>
      
      {renderStatusFilters()}
      
      <Paper sx={{ p: 0, mb: 3 }}>
        <Box sx={{ height: 600, width: '100%' }}>
          <EnhancedDataGrid
            rows={shipmentsData}
            columns={columns}
            loading={loading}
            getRowId={(row) => row._id}
            onFilterChange={(value) => setFilterValue(value)}
            filterValue={filterValue}
            filterPlaceholder="Search shipments..."
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            pageSizeOptions={[5, 10, 25, 50]}
            page={page}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </Box>
      </Paper>

      {/* Shipment Details Dialog */}
      <ShipmentDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        shipment={selectedShipment}
      />

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onSubmit={handleStatusUpdate}
        shipment={selectedShipment}
      />

      {/* Delete Shipment Dialog */}
      <DeleteShipmentDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        shipmentId={selectedShipment?._id}
      />
    </Box>
  );
};

export default Shipments; 