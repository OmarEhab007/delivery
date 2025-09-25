import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Chip,
  Button,
  Tooltip,
  IconButton,
  Drawer,
  Typography,
  Divider,
  Grid,
} from '@mui/material';
import {
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsBus as TruckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import PageHeader from '../components/layout/PageHeader';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { dashboard, trucks } from '../api/api';

const statusMap = {
  AVAILABLE: { label: 'Available', color: 'success' },
  UNAVAILABLE: { label: 'Unavailable', color: 'warning' },
  IN_SERVICE: { label: 'In Service', color: 'primary' },
  IN_MAINTENANCE: { label: 'Maintenance', color: 'error' },
  ON_ROUTE: { label: 'On Route', color: 'info' },
  OUT_OF_SERVICE: { label: 'Out of Service', color: 'error' },
  INACTIVE: { label: 'Inactive', color: 'default' },
};

const statusFilters = [
  'ALL',
  'AVAILABLE',
  'IN_SERVICE',
  'ON_ROUTE',
  'IN_MAINTENANCE',
  'UNAVAILABLE',
];

const Trucks = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await dashboard.getStats();
      if (response.data?.status === 'success') {
        setSummary(response.data.data.trucks);
      }
    } catch (error) {
      console.error('Failed to load truck stats', error);
    }
  }, []);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await trucks.getAll(params);
      const payload = response.data?.data || response.data;
      const list = payload?.trucks || [];
      const pagination = payload?.pagination;

      setRows(list);
      setRowCount(pagination?.total ?? list.length);
    } catch (error) {
      console.error('Error fetching trucks:', error);
      enqueueSnackbar('Failed to load trucks', { variant: 'error' });
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, page, pageSize, statusFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((truck) =>
      [truck.plateNumber, truck.truckType, truck.ownerId?.name, truck.driverId?.name]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const openDetails = (truck) => {
    setSelectedTruck(truck);
    setDrawerOpen(true);
  };

  const columns = useMemo(
    () => [
      { field: 'plateNumber', headerName: 'Plate Number', flex: 0.8, minWidth: 140 },
      { field: 'truckType', headerName: 'Type', flex: 0.8, minWidth: 140 },
      {
        field: 'capacity',
        headerName: 'Capacity (tons)',
        flex: 0.6,
        minWidth: 120,
        valueFormatter: (params) => params.value ?? '—',
      },
      {
        field: 'owner',
        headerName: 'Owner',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.ownerId?.name || '—',
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.driverId?.name || 'Unassigned',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.7,
        minWidth: 140,
        renderCell: (params) => <StatusChip status={params.value} statusMap={statusMap} />,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.6,
        minWidth: 140,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Details">
              <IconButton size="small" onClick={() => openDetails(params.row)}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  const stats = useMemo(() => {
    if (!summary) return null;
    return [
      { label: 'Total trucks', value: summary.total ?? 0 },
      { label: 'Available now', value: summary.available ?? 0 },
      {
        label: 'Utilization',
        value:
          summary.total && summary.available !== undefined
            ? `${Math.round(((summary.total - summary.available) / summary.total) * 100)}%`
            : '0%',
      },
      {
        label: 'Average fuel level',
        value: summary.avgFuelLevel ? `${Math.round(summary.avgFuelLevel)}%` : '—',
      },
    ];
  }, [summary]);

  return (
    <Box>
      <PageHeader
        title="Fleet Management"
        subtitle="Track availability and assignments across the active fleet."
        actions={
          <Button variant="contained" startIcon={<TruckIcon />}>
            Register Truck
          </Button>
        }
        stats={stats}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {statusFilters.map((status) => (
          <Chip
            key={status}
            label={status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
            color={statusFilter === status ? 'primary' : 'default'}
            variant={statusFilter === status ? 'filled' : 'outlined'}
            onClick={() => {
              setStatusFilter(status);
              setPage(0);
            }}
          />
        ))}
      </Stack>

      <EnhancedDataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        page={page}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(0);
        }}
        filterValue={searchTerm}
        onFilterChange={setSearchTerm}
        serverSidePagination
        rowCount={rowCount}
        onRefresh={fetchTrucks}
        title="Truck"
        getRowId={(row) => row._id}
        sx={{ height: 'calc(100vh - 240px)' }}
      />

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Truck Details
          </Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {selectedTruck ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Registration
              </Typography>
              <Typography variant="body1">{selectedTruck.plateNumber}</Typography>
            </Box>
            <Divider />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">{selectedTruck.truckType || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Capacity
                </Typography>
                <Typography variant="body1">{selectedTruck.capacity ?? '—'} tons</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <StatusChip status={selectedTruck.status} statusMap={statusMap} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Owner
                </Typography>
                <Typography variant="body1">{selectedTruck.ownerId?.name || '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Driver
                </Typography>
                <Typography variant="body1">
                  {selectedTruck.driverId?.name || 'Unassigned'}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a truck to view details.
          </Typography>
        )}
      </Drawer>
    </Box>
  );
};

export default Trucks;
