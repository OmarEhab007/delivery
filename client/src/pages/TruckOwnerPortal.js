import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Tabs,
  Tab,
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
import { applications, truckOwner } from '../api/api';

const shipmentStatusMap = {
  REQUESTED: { label: 'Requested', color: 'info' },
  CONFIRMED: { label: 'Confirmed', color: 'primary' },
  ASSIGNED: { label: 'Assigned', color: 'primary' },
  LOADING: { label: 'Loading', color: 'warning' },
  IN_TRANSIT: { label: 'In Transit', color: 'warning' },
  AT_BORDER: { label: 'At Border', color: 'warning' },
  UNLOADING: { label: 'Unloading', color: 'warning' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

const applicationStatusMap = {
  PENDING: { label: 'Pending', color: 'warning' },
  ACCEPTED: { label: 'Accepted', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

const tabConfig = {
  available: 'available',
  applications: 'applications',
  active: 'active',
};

const currencyOptions = ['USD', 'EGP', 'SAR', 'AED', 'KWD', 'QAR'];

const TruckOwnerPortal = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(tabConfig.available);

  const [availableShipments, setAvailableShipments] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availablePage, setAvailablePage] = useState(0);
  const [availablePageSize, setAvailablePageSize] = useState(10);
  const [availableRowCount, setAvailableRowCount] = useState(0);
  const [availableSearch, setAvailableSearch] = useState('');

  const [applicationsRows, setApplicationsRows] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsSearch, setApplicationsSearch] = useState('');

  const [activeShipments, setActiveShipments] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeSearch, setActiveSearch] = useState('');

  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [bidForm, setBidForm] = useState({
    assignedTruckId: '',
    driverId: '',
    price: '',
    currency: 'USD',
    notes: '',
    validUntil: '',
  });
  const [bidSubmitting, setBidSubmitting] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    driverId: '',
    truckId: '',
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const fetchAvailableShipments = useCallback(async () => {
    setAvailableLoading(true);
    try {
      const params = { page: availablePage + 1, limit: availablePageSize };
      const response = await truckOwner.getAvailableShipments(params);
      const payload = response.data?.data || response.data;
      const list = payload?.shipments || [];
      setAvailableShipments(list);
      setAvailableRowCount(payload?.total ?? list.length);
    } catch (error) {
      console.error('Failed to load available shipments', error);
      enqueueSnackbar('Failed to load available shipments', { variant: 'error' });
      setAvailableShipments([]);
      setAvailableRowCount(0);
    } finally {
      setAvailableLoading(false);
    }
  }, [availablePage, availablePageSize, enqueueSnackbar]);

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const response = await applications.getMy();
      const payload = response.data?.data || response.data;
      const list = payload?.applications || payload?.data?.applications || [];
      setApplicationsRows(list);
    } catch (error) {
      console.error('Failed to load applications', error);
      enqueueSnackbar('Failed to load applications', { variant: 'error' });
      setApplicationsRows([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchActiveShipments = useCallback(async () => {
    setActiveLoading(true);
    try {
      const response = await truckOwner.getMyShipments();
      const payload = response.data?.data || response.data;
      const list = payload?.shipments || [];
      setActiveShipments(list);
    } catch (error) {
      console.error('Failed to load active shipments', error);
      enqueueSnackbar('Failed to load active shipments', { variant: 'error' });
      setActiveShipments([]);
    } finally {
      setActiveLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchAvailableResources = useCallback(async () => {
    setResourcesLoading(true);
    try {
      const [driversResponse, trucksResponse] = await Promise.all([
        truckOwner.getAvailableDrivers(),
        truckOwner.getAvailableTrucks(),
      ]);
      const driversPayload = driversResponse.data?.data || driversResponse.data;
      const trucksPayload = trucksResponse.data?.data || trucksResponse.data;
      setAvailableDrivers(driversPayload?.drivers || []);
      setAvailableTrucks(trucksPayload?.trucks || []);
    } catch (error) {
      console.error('Failed to load drivers/trucks', error);
      enqueueSnackbar('Failed to load available drivers or trucks', { variant: 'error' });
    } finally {
      setResourcesLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (activeTab === tabConfig.available) {
      fetchAvailableShipments();
    }
    if (activeTab === tabConfig.applications) {
      fetchApplications();
    }
    if (activeTab === tabConfig.active) {
      fetchActiveShipments();
    }
  }, [activeTab, fetchAvailableShipments, fetchApplications, fetchActiveShipments]);

  useEffect(() => {
    if (bidDialogOpen || assignDialogOpen) {
      fetchAvailableResources();
    }
  }, [bidDialogOpen, assignDialogOpen, fetchAvailableResources]);

  const availableRows = useMemo(() => {
    if (!availableSearch) return availableShipments;
    const term = availableSearch.toLowerCase();
    return availableShipments.filter((shipment) => {
      const haystack = [
        shipment._id,
        shipment.origin?.address,
        shipment.origin?.country,
        shipment.destination?.address,
        shipment.destination?.country,
        shipment.merchantId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [availableSearch, availableShipments]);

  const applicationRowsFiltered = useMemo(() => {
    if (!applicationsSearch) return applicationsRows;
    const term = applicationsSearch.toLowerCase();
    return applicationsRows.filter((application) => {
      const shipment = application.shipmentId || {};
      const haystack = [
        application._id,
        shipment.origin?.address,
        shipment.destination?.address,
        shipment.origin?.country,
        shipment.destination?.country,
        application.bidDetails?.price,
        application.bidDetails?.currency,
        application.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [applicationsRows, applicationsSearch]);

  const activeRows = useMemo(() => {
    if (!activeSearch) return activeShipments;
    const term = activeSearch.toLowerCase();
    return activeShipments.filter((shipment) => {
      const haystack = [
        shipment._id,
        shipment.origin?.address,
        shipment.destination?.address,
        shipment.origin?.country,
        shipment.destination?.country,
        shipment.status,
        shipment.assignedDriverId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [activeSearch, activeShipments]);

  const handleOpenBidDialog = (shipment) => {
    setSelectedShipment(shipment);
    setBidForm({
      assignedTruckId: '',
      driverId: '',
      price: '',
      currency: 'USD',
      notes: '',
      validUntil: '',
    });
    setBidDialogOpen(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedShipment) return;
    if (!bidForm.assignedTruckId || !bidForm.driverId || !bidForm.price) {
      enqueueSnackbar('Please select a truck, driver, and bid price', { variant: 'warning' });
      return;
    }

    setBidSubmitting(true);
    try {
      await applications.create({
        shipmentId: selectedShipment._id,
        assignedTruckId: bidForm.assignedTruckId,
        driverId: bidForm.driverId,
        bidDetails: {
          price: Number(bidForm.price),
          currency: bidForm.currency,
          notes: bidForm.notes,
          validUntil: bidForm.validUntil ? new Date(bidForm.validUntil).toISOString() : undefined,
        },
      });
      enqueueSnackbar('Bid submitted successfully', { variant: 'success' });
      setBidDialogOpen(false);
      await Promise.allSettled([fetchAvailableShipments(), fetchApplications()]);
    } catch (error) {
      console.error('Failed to submit bid', error);
      enqueueSnackbar('Failed to submit bid', { variant: 'error' });
    } finally {
      setBidSubmitting(false);
    }
  };

  const handleOpenAssignDialog = (shipment) => {
    setSelectedShipment(shipment);
    setAssignmentForm({
      driverId: '',
      truckId: shipment.assignedTruckId?._id || '',
    });
    setAssignDialogOpen(true);
  };

  const handleAssignDriver = async () => {
    if (!selectedShipment) return;
    if (!assignmentForm.driverId) {
      enqueueSnackbar('Please select a driver', { variant: 'warning' });
      return;
    }

    setAssignSubmitting(true);
    try {
      await truckOwner.assignShipment(selectedShipment._id, {
        driverId: assignmentForm.driverId,
        truckId: assignmentForm.truckId || undefined,
      });
      enqueueSnackbar('Driver assigned successfully', { variant: 'success' });
      setAssignDialogOpen(false);
      await fetchActiveShipments();
    } catch (error) {
      console.error('Failed to assign driver', error);
      enqueueSnackbar('Failed to assign driver', { variant: 'error' });
    } finally {
      setAssignSubmitting(false);
    }
  };

  const availableColumns = useMemo(
    () => [
      {
        field: '_id',
        headerName: 'Shipment',
        minWidth: 160,
        flex: 0.6,
        valueGetter: (params) => params.row._id?.slice(-8).toUpperCase(),
      },
      {
        field: 'origin',
        headerName: 'Origin',
        flex: 1,
        minWidth: 180,
        valueGetter: (params) =>
          params.row.origin?.address || params.row.origin?.country || '-',
      },
      {
        field: 'destination',
        headerName: 'Destination',
        flex: 1,
        minWidth: 180,
        valueGetter: (params) =>
          params.row.destination?.address || params.row.destination?.country || '-',
      },
      {
        field: 'weight',
        headerName: 'Weight (t)',
        flex: 0.5,
        minWidth: 120,
        valueGetter: (params) => params.row.cargoDetails?.weight ?? '-',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 120,
        renderCell: (params) => <StatusChip status={params.value} statusMap={shipmentStatusMap} />,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.7,
        minWidth: 140,
        sortable: false,
        renderCell: (params) => (
          <Button size="small" variant="contained" onClick={() => handleOpenBidDialog(params.row)}>
            Submit Bid
          </Button>
        ),
      },
    ],
    []
  );

  const applicationColumns = useMemo(
    () => [
      {
        field: '_id',
        headerName: 'Application',
        minWidth: 160,
        flex: 0.6,
        valueGetter: (params) => params.row._id?.slice(-8).toUpperCase(),
      },
      {
        field: 'shipment',
        headerName: 'Route',
        minWidth: 220,
        flex: 1,
        valueGetter: (params) => {
          const shipment = params.row.shipmentId || {};
          const origin = shipment.origin?.country || shipment.origin?.address || '-';
          const destination = shipment.destination?.country || shipment.destination?.address || '-';
          return `${origin} -> ${destination}`;
        },
      },
      {
        field: 'bidDetails',
        headerName: 'Bid',
        minWidth: 140,
        flex: 0.6,
        valueGetter: (params) => {
          const bid = params.row.bidDetails || {};
          return bid.price ? `${bid.price} ${bid.currency || ''}`.trim() : '-';
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 120,
        renderCell: (params) =>
          <StatusChip status={params.value} statusMap={applicationStatusMap} />,
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 0.8,
        minWidth: 160,
        valueGetter: (params) => params.row.driverId?.name || '-',
      },
      {
        field: 'truck',
        headerName: 'Truck',
        flex: 0.8,
        minWidth: 160,
        valueGetter: (params) => params.row.assignedTruckId?.plateNumber || '-',
      },
    ],
    []
  );

  const activeColumns = useMemo(
    () => [
      {
        field: '_id',
        headerName: 'Shipment',
        minWidth: 160,
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
          const destination = params.row.destination?.country || params.row.destination?.address || '-';
          return `${origin} -> ${destination}`;
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 120,
        renderCell: (params) => <StatusChip status={params.value} statusMap={shipmentStatusMap} />,
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 0.8,
        minWidth: 160,
        valueGetter: (params) => params.row.assignedDriverId?.name || '-',
      },
      {
        field: 'truck',
        headerName: 'Truck',
        flex: 0.8,
        minWidth: 160,
        valueGetter: (params) => params.row.assignedTruckId?.plateNumber || '-',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 160,
        flex: 0.7,
        sortable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOpenAssignDialog(params.row)}
            disabled={Boolean(params.row.assignedDriverId)}
          >
            {params.row.assignedDriverId ? 'Assigned' : 'Assign Driver'}
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Carrier Portal"
        subtitle="Bid on available loads, manage assignments, and monitor active shipments"
      />

      <Tabs
        value={activeTab}
        onChange={(event, value) => setActiveTab(value)}
        sx={{ mb: 3 }}
      >
        <Tab label="Available Loads" value={tabConfig.available} />
        <Tab label="My Applications" value={tabConfig.applications} />
        <Tab label="Active Loads" value={tabConfig.active} />
      </Tabs>

      {activeTab === tabConfig.available && (
        <EnhancedDataGrid
          rows={availableRows}
          columns={availableColumns}
          loading={availableLoading}
          page={availablePage}
          pageSize={availablePageSize}
          rowCount={availableRowCount}
          onPageChange={(value) => setAvailablePage(value)}
          onPageSizeChange={(value) => setAvailablePageSize(value)}
          filterValue={availableSearch}
          onFilterChange={setAvailableSearch}
          onRefresh={fetchAvailableShipments}
          title="Shipments"
          hideAddButton
          getRowId={(row) => row._id}
          serverSidePagination
          noDataMessage="No available shipments at the moment."
        />
      )}

      {activeTab === tabConfig.applications && (
        <EnhancedDataGrid
          rows={applicationRowsFiltered}
          columns={applicationColumns}
          loading={applicationsLoading}
          filterValue={applicationsSearch}
          onFilterChange={setApplicationsSearch}
          onRefresh={fetchApplications}
          title="Applications"
          hideAddButton
          getRowId={(row) => row._id}
          noDataMessage="No applications submitted yet."
        />
      )}

      {activeTab === tabConfig.active && (
        <EnhancedDataGrid
          rows={activeRows}
          columns={activeColumns}
          loading={activeLoading}
          filterValue={activeSearch}
          onFilterChange={setActiveSearch}
          onRefresh={fetchActiveShipments}
          title="Active Loads"
          hideAddButton
          getRowId={(row) => row._id}
          noDataMessage="No active loads yet."
        />
      )}

      <Dialog open={bidDialogOpen} onClose={() => setBidDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Submit Bid</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment: {selectedShipment?._id?.slice(-8).toUpperCase()}
            </Typography>

            {resourcesLoading && <Alert severity="info">Loading available drivers and trucks...</Alert>}

            <TextField
              select
              label="Truck"
              value={bidForm.assignedTruckId}
              onChange={(event) =>
                setBidForm((prev) => ({ ...prev, assignedTruckId: event.target.value }))
              }
              fullWidth
            >
              {availableTrucks.map((truck) => (
                <MenuItem key={truck._id} value={truck._id}>
                  {truck.plateNumber} ({truck.model})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Driver"
              value={bidForm.driverId}
              onChange={(event) => setBidForm((prev) => ({ ...prev, driverId: event.target.value }))}
              fullWidth
            >
              {availableDrivers.map((driver) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.name} ({driver.phone})
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Bid Price"
                type="number"
                value={bidForm.price}
                onChange={(event) => setBidForm((prev) => ({ ...prev, price: event.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Currency"
                value={bidForm.currency}
                onChange={(event) =>
                  setBidForm((prev) => ({ ...prev, currency: event.target.value }))
                }
                fullWidth
              >
                {currencyOptions.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Valid Until"
              type="datetime-local"
              value={bidForm.validUntil}
              onChange={(event) =>
                setBidForm((prev) => ({ ...prev, validUntil: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Notes"
              multiline
              minRows={3}
              value={bidForm.notes}
              onChange={(event) => setBidForm((prev) => ({ ...prev, notes: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitBid} disabled={bidSubmitting}>
            {bidSubmitting ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment: {selectedShipment?._id?.slice(-8).toUpperCase()}
            </Typography>
            {resourcesLoading && <Alert severity="info">Loading available drivers and trucks...</Alert>}
            <TextField
              select
              label="Driver"
              value={assignmentForm.driverId}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, driverId: event.target.value }))
              }
              fullWidth
            >
              {availableDrivers.map((driver) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.name} ({driver.phone})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Truck (optional)"
              value={assignmentForm.truckId}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, truckId: event.target.value }))
              }
              fullWidth
            >
              <MenuItem value="">Use assigned truck</MenuItem>
              {availableTrucks.map((truck) => (
                <MenuItem key={truck._id} value={truck._id}>
                  {truck.plateNumber} ({truck.model})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignDriver} disabled={assignSubmitting}>
            {assignSubmitting ? 'Assigning...' : 'Assign Driver'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TruckOwnerPortal;
