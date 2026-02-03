import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';

import PageHeader from '../components/layout/PageHeader';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { driver } from '../api/api';

const shipmentStatusMap = {
  ASSIGNED: { label: 'Assigned', color: 'primary' },
  LOADING: { label: 'Loading', color: 'warning' },
  IN_TRANSIT: { label: 'In Transit', color: 'warning' },
  AT_BORDER: { label: 'At Border', color: 'warning' },
  UNLOADING: { label: 'Unloading', color: 'warning' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  COMPLETED: { label: 'Completed', color: 'success' },
  DELAYED: { label: 'Delayed', color: 'error' },
};

const statusOptions = ['LOADING', 'IN_TRANSIT', 'AT_BORDER', 'UNLOADING', 'DELIVERED'];

const issueTypes = [
  'DELAY',
  'ACCIDENT',
  'CARGO_DAMAGED',
  'VEHICLE_BREAKDOWN',
  'CUSTOMS_HOLD',
  'OTHER',
];

const DriverPortal = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
    latitude: '',
    longitude: '',
    address: '',
  });
  const [locationForm, setLocationForm] = useState({
    latitude: '',
    longitude: '',
    address: '',
  });
  const [podForm, setPodForm] = useState({
    file: null,
    type: 'PHOTO',
    notes: '',
  });
  const [issueForm, setIssueForm] = useState({
    issueType: 'DELAY',
    description: '',
    latitude: '',
    longitude: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchAssignedShipments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await driver.getAssignedShipments();
      const payload = response.data?.data || response.data;
      setShipments(payload?.shipments || []);
    } catch (error) {
      console.error('Failed to load assigned shipments', error);
      enqueueSnackbar('Failed to load assigned shipments', { variant: 'error' });
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchAssignedShipments();
  }, [fetchAssignedShipments]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return shipments;
    const term = searchTerm.toLowerCase();
    return shipments.filter((shipment) => {
      const haystack = [
        shipment._id,
        shipment.origin?.address,
        shipment.destination?.address,
        shipment.origin?.country,
        shipment.destination?.country,
        shipment.status,
        shipment.merchantId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [shipments, searchTerm]);

  const openStatusDialog = (shipment) => {
    setSelectedShipment(shipment);
    setStatusForm({
      status: shipment.status || 'IN_TRANSIT',
      notes: '',
      latitude: '',
      longitude: '',
      address: '',
    });
    setStatusDialogOpen(true);
  };

  const openLocationDialog = (shipment) => {
    setSelectedShipment(shipment);
    setLocationForm({ latitude: '', longitude: '', address: '' });
    setLocationDialogOpen(true);
  };

  const openPodDialog = (shipment) => {
    setSelectedShipment(shipment);
    setPodForm({ file: null, type: 'PHOTO', notes: '' });
    setPodDialogOpen(true);
  };

  const openIssueDialog = (shipment) => {
    setSelectedShipment(shipment);
    setIssueForm({ issueType: 'DELAY', description: '', latitude: '', longitude: '' });
    setIssueDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedShipment) return;
    if (!statusForm.status) {
      enqueueSnackbar('Please select a status', { variant: 'warning' });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        status: statusForm.status,
        notes: statusForm.notes,
      };
      if (statusForm.latitude !== '' && statusForm.longitude !== '') {
        payload.location = {
          type: 'Point',
          coordinates: [Number(statusForm.longitude), Number(statusForm.latitude)],
          address: statusForm.address || undefined,
        };
      }
      await driver.updateShipmentStatus(selectedShipment._id, payload);
      enqueueSnackbar('Shipment status updated', { variant: 'success' });
      setStatusDialogOpen(false);
      await fetchAssignedShipments();
    } catch (error) {
      console.error('Failed to update status', error);
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedShipment) return;
    if (locationForm.latitude === '' || locationForm.longitude === '') {
      enqueueSnackbar('Please enter latitude and longitude', { variant: 'warning' });
      return;
    }

    setActionLoading(true);
    try {
      await driver.updateLocation({
        latitude: Number(locationForm.latitude),
        longitude: Number(locationForm.longitude),
        address: locationForm.address,
        shipmentId: selectedShipment._id,
      });
      enqueueSnackbar('Location updated', { variant: 'success' });
      setLocationDialogOpen(false);
      await fetchAssignedShipments();
    } catch (error) {
      console.error('Failed to update location', error);
      enqueueSnackbar('Failed to update location', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadPOD = async () => {
    if (!selectedShipment) return;
    if (!podForm.file) {
      enqueueSnackbar('Please select a file', { variant: 'warning' });
      return;
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowedTypes.includes(podForm.file.type)) {
      enqueueSnackbar('Invalid file type. Please upload an image or PDF.', { variant: 'warning' });
      return;
    }
    if (podForm.file.size > maxSize) {
      enqueueSnackbar('File size exceeds 10MB limit', { variant: 'warning' });
      return;
    }

    setActionLoading(true);
    try {
      await driver.uploadProofOfDelivery(selectedShipment._id, podForm);
      enqueueSnackbar('Proof of delivery uploaded', { variant: 'success' });
      setPodDialogOpen(false);
    } catch (error) {
      console.error('Failed to upload POD', error);
      enqueueSnackbar('Failed to upload POD', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedShipment) return;
    if (!issueForm.description) {
      enqueueSnackbar('Please provide a description', { variant: 'warning' });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        issueType: issueForm.issueType,
        description: issueForm.description,
      };
      if (issueForm.latitude !== '' && issueForm.longitude !== '') {
        payload.latitude = Number(issueForm.latitude);
        payload.longitude = Number(issueForm.longitude);
      }
      await driver.reportIssue(selectedShipment._id, payload);
      enqueueSnackbar('Issue reported', { variant: 'success' });
      setIssueDialogOpen(false);
    } catch (error) {
      console.error('Failed to report issue', error);
      enqueueSnackbar('Failed to report issue', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: '_id',
        headerName: 'Shipment',
        minWidth: 150,
        flex: 0.6,
        valueGetter: (params) => params.row._id?.slice(-8).toUpperCase(),
      },
      {
        field: 'route',
        headerName: 'Route',
        minWidth: 220,
        flex: 1,
        valueGetter: (params) => {
          const origin = params.row.origin?.country || params.row.origin?.address || '-';
          const destination =
            params.row.destination?.country || params.row.destination?.address || '-';
          return `${origin} -> ${destination}`;
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        flex: 0.6,
        renderCell: (params) => <StatusChip status={params.value} statusMap={shipmentStatusMap} />,
      },
      {
        field: 'merchant',
        headerName: 'Merchant',
        minWidth: 160,
        flex: 0.7,
        valueGetter: (params) => params.row.merchantId?.name || '-',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 260,
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => openStatusDialog(params.row)}>
              Update Status
            </Button>
            <Button size="small" variant="outlined" onClick={() => openLocationDialog(params.row)}>
              Update Location
            </Button>
            <Button size="small" variant="contained" onClick={() => openPodDialog(params.row)}>
              Upload POD
            </Button>
            <Button size="small" onClick={() => openIssueDialog(params.row)}>
              Report Issue
            </Button>
          </Stack>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Driver Portal"
        subtitle="Update shipment status, share location, and upload delivery proof"
      />

      <EnhancedDataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        filterValue={searchTerm}
        onFilterChange={setSearchTerm}
        onRefresh={fetchAssignedShipments}
        title="Assigned Shipments"
        hideAddButton
        getRowId={(row) => row._id}
        noDataMessage="No assigned shipments yet."
      />

      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Shipment Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment: {selectedShipment?._id?.slice(-8).toUpperCase()}
            </Typography>
            <TextField
              select
              label="Status"
              value={statusForm.status}
              onChange={(event) =>
                setStatusForm((prev) => ({ ...prev, status: event.target.value }))
              }
              fullWidth
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes"
              multiline
              minRows={3}
              value={statusForm.notes}
              onChange={(event) =>
                setStatusForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              fullWidth
            />
            <Alert severity="info">Optional: include location to log this milestone.</Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Latitude"
                type="number"
                value={statusForm.latitude}
                onChange={(event) =>
                  setStatusForm((prev) => ({ ...prev, latitude: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Longitude"
                type="number"
                value={statusForm.longitude}
                onChange={(event) =>
                  setStatusForm((prev) => ({ ...prev, longitude: event.target.value }))
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Address"
              value={statusForm.address}
              onChange={(event) =>
                setStatusForm((prev) => ({ ...prev, address: event.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStatus} disabled={actionLoading}>
            {actionLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Location</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment: {selectedShipment?._id?.slice(-8).toUpperCase()}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Latitude"
                type="number"
                value={locationForm.latitude}
                onChange={(event) =>
                  setLocationForm((prev) => ({ ...prev, latitude: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Longitude"
                type="number"
                value={locationForm.longitude}
                onChange={(event) =>
                  setLocationForm((prev) => ({ ...prev, longitude: event.target.value }))
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Address"
              value={locationForm.address}
              onChange={(event) =>
                setLocationForm((prev) => ({ ...prev, address: event.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateLocation} disabled={actionLoading}>
            {actionLoading ? 'Updating...' : 'Update Location'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={podDialogOpen} onClose={() => setPodDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload Proof of Delivery</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment: {selectedShipment?._id?.slice(-8).toUpperCase()}
            </Typography>
            <Button variant="outlined" component="label">
              {podForm.file ? podForm.file.name : 'Choose file'}
              <input
                type="file"
                hidden
                onChange={(event) =>
                  setPodForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))
                }
              />
            </Button>
            <TextField
              select
              label="Type"
              value={podForm.type}
              onChange={(event) => setPodForm((prev) => ({ ...prev, type: event.target.value }))}
              fullWidth
            >
              <MenuItem value="PHOTO">Photo</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="SIGNATURE">Signature</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={podForm.notes}
              onChange={(event) => setPodForm((prev) => ({ ...prev, notes: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPodDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadPOD} disabled={actionLoading}>
            {actionLoading ? 'Uploading...' : 'Upload POD'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={issueDialogOpen}
        onClose={() => setIssueDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Report Issue</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment: {selectedShipment?._id?.slice(-8).toUpperCase()}
            </Typography>
            <TextField
              select
              label="Issue Type"
              value={issueForm.issueType}
              onChange={(event) =>
                setIssueForm((prev) => ({ ...prev, issueType: event.target.value }))
              }
              fullWidth
            >
              {issueTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={issueForm.description}
              onChange={(event) =>
                setIssueForm((prev) => ({ ...prev, description: event.target.value }))
              }
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Latitude"
                type="number"
                value={issueForm.latitude}
                onChange={(event) =>
                  setIssueForm((prev) => ({ ...prev, latitude: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Longitude"
                type="number"
                value={issueForm.longitude}
                onChange={(event) =>
                  setIssueForm((prev) => ({ ...prev, longitude: event.target.value }))
                }
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReportIssue} disabled={actionLoading}>
            {actionLoading ? 'Submitting...' : 'Report Issue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverPortal;
