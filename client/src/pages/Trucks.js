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
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Add as AddIcon,
  CheckCircle as AvailableIcon,
  DoNotDisturb as UnavailableIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { trucks } from '../api/api';

// Status mapping for consistent styling
const statusMap = {
  'Available': { label: 'Available', color: 'success' },
  'In Use': { label: 'In Use', color: 'warning' },
  'Maintenance': { label: 'Maintenance', color: 'error' },
  'Inactive': { label: 'Inactive', color: 'default' }
};

// Truck types for dropdown
const truckTypes = [
  'Flatbed',
  'Refrigerated',
  'Box Truck',
  'Semi-Trailer',
  'Tanker',
  'Dump Truck',
  'Car Carrier',
  'Logging Truck',
  'Concrete Mixer',
  'Other'
];

// Validation schema
const truckValidationSchema = Yup.object({
  registrationNumber: Yup.string().required('Registration number is required'),
  type: Yup.string().required('Truck type is required'),
  capacity: Yup.number()
    .positive('Capacity must be positive')
    .required('Capacity is required'),
  make: Yup.string().required('Make is required'),
  model: Yup.string().required('Model is required'),
  year: Yup.number()
    .integer('Year must be an integer')
    .min(1950, 'Year must be 1950 or later')
    .max(new Date().getFullYear() + 1, `Year cannot be later than ${new Date().getFullYear() + 1}`)
    .required('Year is required'),
  ownerId: Yup.string(),
  status: Yup.string()
    .required('Status is required')
    .oneOf(Object.keys(statusMap), 'Invalid status')
});

// Truck form dialog for add/edit
const TruckFormDialog = ({ open, onClose, onSubmit, truck, isEditing }) => {
  const formik = useFormik({
    initialValues: {
      registrationNumber: truck?.registrationNumber || '',
      type: truck?.type || '',
      capacity: truck?.capacity || '',
      make: truck?.make || '',
      model: truck?.model || '',
      year: truck?.year || new Date().getFullYear(),
      ownerId: truck?.ownerId || '',
      status: truck?.status || 'Available',
      notes: truck?.notes || ''
    },
    validationSchema: truckValidationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

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
        {isEditing ? 'Edit Truck' : 'Add New Truck'}
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="registrationNumber"
                name="registrationNumber"
                label="Registration Number"
                value={formik.values.registrationNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.registrationNumber && Boolean(formik.errors.registrationNumber)}
                helperText={formik.touched.registrationNumber && formik.errors.registrationNumber}
                disabled={isEditing} // Can't change registration number if editing
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                id="type"
                name="type"
                label="Truck Type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.type && Boolean(formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
              >
                {truckTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="capacity"
                name="capacity"
                label="Capacity (kg)"
                type="number"
                value={formik.values.capacity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.capacity && Boolean(formik.errors.capacity)}
                helperText={formik.touched.capacity && formik.errors.capacity}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                id="status"
                name="status"
                label="Status"
                value={formik.values.status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="make"
                name="make"
                label="Make"
                value={formik.values.make}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.make && Boolean(formik.errors.make)}
                helperText={formik.touched.make && formik.errors.make}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="model"
                name="model"
                label="Model"
                value={formik.values.model}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.model && Boolean(formik.errors.model)}
                helperText={formik.touched.model && formik.errors.model}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="year"
                name="year"
                label="Year"
                type="number"
                value={formik.values.year}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.year && Boolean(formik.errors.year)}
                helperText={formik.touched.year && formik.errors.year}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes"
                multiline
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
            startIcon={isEditing ? <EditIcon /> : <AddIcon />}
            disabled={formik.isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Add Truck'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Truck details dialog
const TruckDetailsDialog = ({ open, onClose, truck }) => {
  if (!truck) return null;

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
        Truck Details
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
              Basic Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Registration Number</Typography>
                <Typography variant="body1">{truck.registrationNumber}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{truck.type}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Make / Model</Typography>
                <Typography variant="body1">{`${truck.make} ${truck.model}`}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Year</Typography>
                <Typography variant="body1">{truck.year}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip
                  label={statusMap[truck.status]?.label || truck.status}
                  color={statusMap[truck.status]?.color || 'default'}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Capacity & Ownership
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Capacity</Typography>
                <Typography variant="body1">{truck.capacity} kg</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Owner</Typography>
                <Typography variant="body1">
                  {truck.ownerId?.name || 'Not assigned'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {truck.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1">{truck.notes}</Typography>
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
const StatusUpdateDialog = ({ open, onClose, onConfirm, truck, newStatus }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Update Truck Status
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Changing status to {statusMap[newStatus]?.label || newStatus}.
        </Alert>
        <Typography>
          Are you sure you want to change the status of truck <strong>{truck?.registrationNumber}</strong> to <strong>{statusMap[newStatus]?.label || newStatus}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained"
          color={statusMap[newStatus]?.color || 'primary'}
        >
          Update Status
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete truck confirmation dialog
const DeleteTruckDialog = ({ open, onClose, onConfirm, registrationNumber }) => (
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
        Are you sure you want to delete truck <strong>{registrationNumber}</strong>?
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

const Trucks = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [trucksData, setTrucksData] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(null);

  // Fetch trucks data
  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trucks.getAll();
      if (response.data && response.data.data) {
        setTrucksData(response.data.data.trucks || []);
      }
    } catch (error) {
      console.error('Error fetching trucks:', error);
      enqueueSnackbar('Failed to load trucks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  // Handle adding a new truck
  const handleAddTruck = () => {
    setSelectedTruck(null);
    setIsEditing(false);
    setFormDialogOpen(true);
  };

  // Handle editing a truck
  const handleEditTruck = (truck) => {
    setSelectedTruck(truck);
    setIsEditing(true);
    setFormDialogOpen(true);
  };

  // Handle viewing truck details
  const handleViewDetails = (truck) => {
    setSelectedTruck(truck);
    setDetailsDialogOpen(true);
  };

  // Handle status update click
  const handleStatusUpdateClick = (truck, status) => {
    setSelectedTruck(truck);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (truck) => {
    setSelectedTruck(truck);
    setDeleteDialogOpen(true);
  };

  // Handle form submission (add/edit)
  const handleTruckSubmit = async (truckData) => {
    setFormDialogOpen(false);
    setLoading(true);

    try {
      if (isEditing) {
        await trucks.update(selectedTruck._id, truckData);
        enqueueSnackbar('Truck updated successfully', { variant: 'success' });
      } else {
        await trucks.create(truckData);
        enqueueSnackbar('Truck added successfully', { variant: 'success' });
      }
      fetchTrucks();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} truck:`, error);
      enqueueSnackbar(`Failed to ${isEditing ? 'update' : 'add'} truck`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle status update confirmation
  const handleStatusConfirm = async () => {
    if (!selectedTruck || !newStatus) return;

    setStatusDialogOpen(false);
    setLoading(true);

    try {
      await trucks.changeStatus(selectedTruck._id, newStatus);
      enqueueSnackbar('Truck status updated successfully', { variant: 'success' });
      fetchTrucks();
    } catch (error) {
      console.error('Error updating truck status:', error);
      enqueueSnackbar('Failed to update truck status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedTruck) return;

    setDeleteDialogOpen(false);
    setLoading(true);

    try {
      await trucks.delete(selectedTruck._id);
      enqueueSnackbar('Truck deleted successfully', { variant: 'success' });
      fetchTrucks();
    } catch (error) {
      console.error('Error deleting truck:', error);
      enqueueSnackbar('Failed to delete truck', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
  const columns = [
    { 
      field: 'registrationNumber', 
      headerName: 'Registration',
      flex: 1,
      minWidth: 150,
    },
    { 
      field: 'type', 
      headerName: 'Type',
      flex: 1,
      minWidth: 120,
    },
    { 
      field: 'makeModel', 
      headerName: 'Make/Model',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => `${params.row.make} ${params.row.model}`,
    },
    { 
      field: 'year', 
      headerName: 'Year',
      flex: 0.5,
      minWidth: 80,
      type: 'number'
    },
    { 
      field: 'capacity', 
      headerName: 'Capacity (kg)',
      flex: 0.7,
      minWidth: 120,
      type: 'number'
    },
    { 
      field: 'status', 
      headerName: 'Status',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <StatusChip
          label={statusMap[params.value]?.label || params.value}
          color={statusMap[params.value]?.color || 'default'}
        />
      ),
    },
    {
      field: 'owner',
      headerName: 'Owner',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.ownerId?.name || 'Unassigned',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 180,
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
          
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditTruck(params.row)}
              color="secondary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          {params.row.status !== 'Available' ? (
            <Tooltip title="Mark as Available">
              <IconButton
                size="small"
                onClick={() => handleStatusUpdateClick(params.row, 'Available')}
                color="success"
              >
                <AvailableIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Mark as Unavailable">
              <IconButton
                size="small"
                onClick={() => handleStatusUpdateClick(params.row, 'Maintenance')}
                color="warning"
              >
                <UnavailableIcon />
              </IconButton>
            </Tooltip>
          )}
          
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Trucks Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTruck}
        >
          Add New Truck
        </Button>
      </Box>
      
      {renderStatusFilters()}
      
      <Paper sx={{ p: 0, mb: 3 }}>
        <Box sx={{ height: 600, width: '100%' }}>
          <EnhancedDataGrid
            rows={trucksData}
            columns={columns}
            loading={loading}
            getRowId={(row) => row._id}
            onFilterChange={(value) => setFilterValue(value)}
            filterValue={filterValue}
            filterPlaceholder="Search trucks..."
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            pageSizeOptions={[5, 10, 25, 50]}
            page={page}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </Box>
      </Paper>

      {/* Truck Form Dialog (Add/Edit) */}
      <TruckFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleTruckSubmit}
        truck={selectedTruck}
        isEditing={isEditing}
      />

      {/* Truck Details Dialog */}
      <TruckDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        truck={selectedTruck}
      />

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusConfirm}
        truck={selectedTruck}
        newStatus={newStatus}
      />

      {/* Delete Truck Dialog */}
      <DeleteTruckDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        registrationNumber={selectedTruck?.registrationNumber}
      />
    </Box>
  );
};

export default Trucks; 