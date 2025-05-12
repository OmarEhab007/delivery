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
  Paper,
  Grid,
  Chip,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { applications } from '../api/api';

// Status mapping for consistent styling
const statusMap = {
  'PENDING': { label: 'Pending', color: 'warning' },
  'APPROVED': { label: 'Approved', color: 'success' },
  'REJECTED': { label: 'Rejected', color: 'error' }
};

// Application details dialog
const ApplicationDetailsDialog = ({ open, onClose, application }) => {
  if (!application) return null;

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
        Application Details
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
                <Typography variant="body2" color="text.secondary">Applicant Name</Typography>
                <Typography variant="body1">{application.name}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{application.email}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{application.phone}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Application Type</Typography>
                <Typography variant="body1">{application.applicationType}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip
                  label={statusMap[application.status]?.label || application.status}
                  color={statusMap[application.status]?.color || 'default'}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Business Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Business Name</Typography>
                <Typography variant="body1">{application.businessName || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Business Type</Typography>
                <Typography variant="body1">{application.businessType || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Business Address</Typography>
                <Typography variant="body1">{application.businessAddress || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Additional Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Message</Typography>
                <Typography variant="body1">{application.message || 'No message provided'}</Typography>
              </Box>
              
              {application.documents && application.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Documents</Typography>
                  <Grid container spacing={1}>
                    {application.documents.map((doc, index) => (
                      <Grid item key={index}>
                        <Chip 
                          label={doc.name || `Document ${index + 1}`}
                          component="a"
                          href={doc.url}
                          target="_blank"
                          clickable
                          sx={{ '&:hover': { backgroundColor: 'primary.light' } }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
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

// Status update confirmation dialog
const StatusUpdateDialog = ({ open, onClose, onConfirm, application, newStatus }) => {
  const statusText = newStatus === 'APPROVED' ? 'approve' : 'reject';
  
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
        Confirm {newStatus === 'APPROVED' ? 'Approval' : 'Rejection'}
      </DialogTitle>
      <DialogContent>
        <Alert severity={newStatus === 'APPROVED' ? 'info' : 'warning'} sx={{ mb: 2 }}>
          This action will {newStatus === 'APPROVED' ? 'create a new user account and notify the applicant' : 'notify the applicant that their application was rejected'}.
        </Alert>
        <Typography>
          Are you sure you want to {statusText} the application from <strong>{application?.name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={newStatus === 'APPROVED' ? 'success' : 'error'}
        >
          {newStatus === 'APPROVED' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete application confirmation dialog
const DeleteApplicationDialog = ({ open, onClose, onConfirm, applicationName }) => (
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
        Are you sure you want to delete the application from <strong>{applicationName}</strong>?
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

const Applications = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [applicationsData, setApplicationsData] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState(null);

  // Fetch applications data
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await applications.getAll();
      if (response.data && response.data.data) {
        setApplicationsData(response.data.data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      enqueueSnackbar('Failed to load applications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle viewing application details
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  // Handle changing application status
  const handleStatusChange = (application, status) => {
    setSelectedApplication(application);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (application) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
  };

  // Handle status update confirmation
  const handleStatusConfirm = async () => {
    if (!selectedApplication || !newStatus) return;

    setStatusDialogOpen(false);
    setLoading(true);

    try {
      await applications.updateStatus(selectedApplication._id, newStatus);
      enqueueSnackbar(`Application ${newStatus === 'APPROVED' ? 'approved' : 'rejected'} successfully`, { 
        variant: 'success' 
      });
      fetchApplications();
    } catch (error) {
      console.error(`Error updating application status:`, error);
      enqueueSnackbar(`Failed to ${newStatus === 'APPROVED' ? 'approve' : 'reject'} application`, { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedApplication) return;

    setDeleteDialogOpen(false);
    setLoading(true);

    try {
      await applications.delete(selectedApplication._id);
      enqueueSnackbar('Application deleted successfully', { variant: 'success' });
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      enqueueSnackbar('Failed to delete application', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
  const columns = [
    { 
      field: 'name', 
      headerName: 'Applicant Name',
      flex: 1,
      minWidth: 150,
    },
    { 
      field: 'email', 
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    { 
      field: 'phone', 
      headerName: 'Phone',
      flex: 0.7,
      minWidth: 130,
    },
    { 
      field: 'applicationType', 
      headerName: 'Type',
      flex: 0.8,
      minWidth: 120,
    },
    { 
      field: 'status', 
      headerName: 'Status',
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (
        <StatusChip
          label={statusMap[params.value]?.label || params.value}
          color={statusMap[params.value]?.color || 'default'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Submitted On',
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
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

          {params.row.status === 'PENDING' && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange(params.row, 'APPROVED')}
                  color="success"
                >
                  <ApproveIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange(params.row, 'REJECTED')}
                  color="error"
                >
                  <RejectIcon />
                </IconButton>
              </Tooltip>
            </>
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

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Applications Management
      </Typography>
      
      <Paper sx={{ p: 0, mb: 3 }}>
        <Box sx={{ height: 600, width: '100%' }}>
          <EnhancedDataGrid
            rows={applicationsData}
            columns={columns}
            loading={loading}
            getRowId={(row) => row._id}
            onFilterChange={(value) => setFilterValue(value)}
            filterPlaceholder="Search applications..."
            pageSize={pageSize}
            onPageSizeChange={(newSize) => setPageSize(newSize)}
            pageSizeOptions={[5, 10, 25, 50]}
            page={page}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </Box>
      </Paper>

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        application={selectedApplication}
      />

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusConfirm}
        application={selectedApplication}
        newStatus={newStatus}
      />

      {/* Delete Application Dialog */}
      <DeleteApplicationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        applicationName={selectedApplication?.name}
      />
    </Box>
  );
};

export default Applications; 