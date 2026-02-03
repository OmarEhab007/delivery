import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  Typography,
  Divider,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  HourglassTop as PendingIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import PageHeader from '../components/layout/PageHeader';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { dashboard, shipments } from '../api/api';
import { normalizeShipment } from '../utils/adminDataTransformers';

const statusMap = {
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'warning' },
  REQUESTED: { label: 'Requested', color: 'info' },
  CONFIRMED: { label: 'Confirmed', color: 'primary' },
  ASSIGNED: { label: 'Assigned', color: 'primary' },
  LOADING: { label: 'Loading', color: 'warning' },
  IN_TRANSIT: { label: 'In Transit', color: 'warning' },
  AT_BORDER: { label: 'At Border', color: 'warning' },
  UNLOADING: { label: 'Unloading', color: 'warning' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  COMPLETED: { label: 'Completed', color: 'success' },
  DELAYED: { label: 'Delayed', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
  REJECTED: { label: 'Rejected', color: 'error' },
};

const approvalStateMap = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
};

const statusFilters = [
  'ALL',
  'PENDING_APPROVAL',
  'REQUESTED',
  'CONFIRMED',
  'ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
];

const tabsConfig = {
  overview: 'overview',
  approvals: 'approvals',
};

const approvalStateFilters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

const Shipments = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState(tabsConfig.overview);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [approvalRows, setApprovalRows] = useState([]);
  const [approvalRowCount, setApprovalRowCount] = useState(0);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalPage, setApprovalPage] = useState(0);
  const [approvalPageSize, setApprovalPageSize] = useState(10);
  const [approvalStateFilter, setApprovalStateFilter] = useState('PENDING');
  const [approvalSearchTerm, setApprovalSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [approveDialogShipment, setApproveDialogShipment] = useState(null);
  const [rejectDialogShipment, setRejectDialogShipment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      const response = await dashboard.getStats();
      if (response.data?.status === 'success') {
        setSummary(response.data.data.shipments);
      }
    } catch (error) {
      console.error('Failed to load shipment stats', error);
    }
  }, []);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: pageSize };
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING_APPROVAL') {
          params.status = statusFilter;
          params.approvalState = 'PENDING';
        } else {
          params.status = statusFilter;
        }
      }

      const response = await shipments.getAll(params);
      const payload = response.data?.data || response.data;
      const list = payload?.shipments?.map(normalizeShipment) || [];
      const pagination = payload?.pagination;

      setRows(list);
      setRowCount(pagination?.total ?? list.length);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      enqueueSnackbar('Failed to load shipments', { variant: 'error' });
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, page, pageSize, statusFilter]);

  const fetchApprovalShipments = useCallback(async () => {
    setApprovalLoading(true);
    try {
      const params = { page: approvalPage + 1, limit: approvalPageSize };

      if (approvalStateFilter !== 'ALL') {
        params.approvalState = approvalStateFilter;
      }

      if (approvalStateFilter === 'PENDING' || approvalStateFilter === 'ALL') {
        params.status = 'PENDING_APPROVAL';
      }

      const response = await shipments.getAll(params);
      const payload = response.data?.data || response.data;
      const list = payload?.shipments?.map(normalizeShipment) || [];
      const pagination = payload?.pagination;

      setApprovalRows(list);
      setApprovalRowCount(pagination?.total ?? list.length);
    } catch (error) {
      console.error('Error fetching approval shipments:', error);
      enqueueSnackbar('Failed to load approval shipments', { variant: 'error' });
      setApprovalRows([]);
      setApprovalRowCount(0);
    } finally {
      setApprovalLoading(false);
    }
  }, [approvalPage, approvalPageSize, approvalStateFilter, enqueueSnackbar]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    if (activeTab === tabsConfig.approvals) {
      fetchApprovalShipments();
    }
  }, [activeTab, fetchApprovalShipments]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((shipment) =>
      [
        shipment._id,
        shipment.merchantId?.name,
        shipment.origin?.address,
        shipment.destination?.address,
        shipment.cargoDetails?.description,
        shipment.status,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const filteredApprovalRows = useMemo(() => {
    if (!approvalSearchTerm) return approvalRows;
    const term = approvalSearchTerm.toLowerCase();
    return approvalRows.filter((shipment) =>
      [
        shipment._id,
        shipment.merchantId?.name,
        shipment.origin?.address,
        shipment.destination?.address,
        shipment.cargoDetails?.description,
        shipment.approvalState,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [approvalRows, approvalSearchTerm]);

  const openDetails = useCallback((shipment) => {
    setSelectedShipment(shipment);
    setIsDrawerOpen(true);
  }, []);

  const closeApproveDialog = useCallback(() => {
    setApproveDialogShipment(null);
  }, []);

  const closeRejectDialog = useCallback(() => {
    setRejectDialogShipment(null);
    setRejectReason('');
    setRejectError('');
  }, []);

  const handleShipmentDecision = useCallback(
    async (id, action, payload) => {
      setActionLoadingById((prev) => ({ ...prev, [id]: true }));
      try {
        let response;
        if (action === 'approve') {
          response = await shipments.approve(id);
          enqueueSnackbar('Shipment approved', { variant: 'success' });
        } else if (action === 'reject') {
          response = await shipments.reject(id, payload?.reason);
          enqueueSnackbar('Shipment rejected', { variant: 'info' });
        } else {
          throw new Error(`Unsupported action: ${action}`);
        }

        const updatedShipment = normalizeShipment(
          response?.data?.data?.shipment || response?.data?.shipment || response?.data
        );

        if (updatedShipment) {
          setRows((prev) =>
            prev.map((shipment) =>
              shipment._id === updatedShipment._id ? updatedShipment : shipment
            )
          );
          setApprovalRows((prev) =>
            prev.map((shipment) =>
              shipment._id === updatedShipment._id ? updatedShipment : shipment
            )
          );
          setSelectedShipment((prev) =>
            prev?._id === updatedShipment._id ? updatedShipment : prev
          );
        }

        await Promise.allSettled([fetchSummary(), fetchShipments(), fetchApprovalShipments()]);

        return updatedShipment;
      } catch (error) {
        console.error(`Failed to ${action} shipment`, error);
        enqueueSnackbar(`Failed to ${action} shipment`, { variant: 'error' });
        return null;
      } finally {
        setActionLoadingById((prev) => ({ ...prev, [id]: false }));
      }
    },
    [enqueueSnackbar, fetchApprovalShipments, fetchShipments, fetchSummary]
  );

  const handleApproveShipment = useCallback((shipment) => {
    setApproveDialogShipment(shipment);
  }, []);

  const handleRejectShipment = useCallback((shipment) => {
    setRejectDialogShipment(shipment);
    setRejectReason('');
    setRejectError('');
  }, []);

  const confirmApproveShipment = useCallback(async () => {
    if (!approveDialogShipment) {
      return;
    }
    await handleShipmentDecision(approveDialogShipment._id, 'approve');
    closeApproveDialog();
  }, [approveDialogShipment, closeApproveDialog, handleShipmentDecision]);

  const confirmRejectShipment = useCallback(async () => {
    if (!rejectDialogShipment) {
      return;
    }

    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      setRejectError('Please provide a rejection reason');
      return;
    }

    const result = await handleShipmentDecision(rejectDialogShipment._id, 'reject', {
      reason: trimmedReason,
    });

    if (result) {
      closeRejectDialog();
    }
  }, [closeRejectDialog, handleShipmentDecision, rejectDialogShipment, rejectReason]);

  const overviewColumns = useMemo(
    () => [
      { field: '_id', headerName: 'Shipment ID', flex: 1.2, minWidth: 220 },
      {
        field: 'merchant',
        headerName: 'Merchant',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.merchantId?.name || '—',
      },
      {
        field: 'origin',
        headerName: 'Origin',
        flex: 0.9,
        minWidth: 150,
        valueGetter: (params) => params.row.origin?.address || '—',
      },
      {
        field: 'destination',
        headerName: 'Destination',
        flex: 0.9,
        minWidth: 150,
        valueGetter: (params) => params.row.destination?.address || '—',
      },
      {
        field: 'weight',
        headerName: 'Weight (kg)',
        flex: 0.5,
        minWidth: 120,
        valueGetter: (params) => params.row.cargoDetails?.weight ?? '—',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.7,
        minWidth: 140,
        renderCell: (params) => (
          <StatusChip status={(params.value || '').toUpperCase()} statusMap={statusMap} />
        ),
      },
      {
        field: 'approvalState',
        headerName: 'Approval',
        flex: 0.8,
        minWidth: 150,
        renderCell: (params) => (
          <StatusChip status={(params.value || '').toUpperCase()} statusMap={approvalStateMap} />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        flex: 0.7,
        minWidth: 140,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.9,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Details">
              <IconButton size="small" onClick={() => openDetails(params.row)}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Update Status">
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
    [openDetails]
  );

  const approvalColumns = useMemo(
    () => [
      { field: '_id', headerName: 'Shipment ID', flex: 1.2, minWidth: 220 },
      {
        field: 'merchant',
        headerName: 'Merchant',
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.merchantId?.name || '—',
      },
      {
        field: 'origin',
        headerName: 'Origin',
        flex: 0.9,
        minWidth: 150,
        valueGetter: (params) => params.row.origin?.address || '—',
      },
      {
        field: 'destination',
        headerName: 'Destination',
        flex: 0.9,
        minWidth: 150,
        valueGetter: (params) => params.row.destination?.address || '—',
      },
      {
        field: 'approvalState',
        headerName: 'Approval',
        flex: 0.8,
        minWidth: 150,
        renderCell: (params) => (
          <StatusChip status={(params.value || '').toUpperCase()} statusMap={approvalStateMap} />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Submitted',
        flex: 0.7,
        minWidth: 140,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => {
          const shipment = params.row;
          const isLoading = Boolean(actionLoadingById[shipment._id]);

          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Details">
                <IconButton size="small" onClick={() => openDetails(shipment)}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Approve">
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    disabled={isLoading}
                    onClick={() => handleApproveShipment(shipment)}
                  >
                    {isLoading ? (
                      <PendingIcon fontSize="small" />
                    ) : (
                      <ApproveIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reject">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={isLoading}
                    onClick={() => handleRejectShipment(shipment)}
                  >
                    {isLoading ? <PendingIcon fontSize="small" /> : <RejectIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [actionLoadingById, handleApproveShipment, handleRejectShipment, openDetails]
  );

  const stats = useMemo(() => {
    if (!summary) return null;
    const cancelledCount =
      summary.statusDistribution?.find((item) => item.status === 'CANCELLED')?.count ?? 0;

    const baseStats = [
      {
        label: 'Total shipments',
        value: summary.total ?? 0,
        caption: `${summary.inTransit ?? 0} in transit`,
      },
      { label: 'Delivered this month', value: summary.delivered ?? 0 },
      {
        label: 'Cancellation rate',
        value: summary.total ? `${Math.round((cancelledCount / summary.total) * 100)}%` : '0%',
      },
    ];

    if (activeTab === tabsConfig.approvals) {
      baseStats.unshift({ label: 'Pending approval', value: summary.pending ?? 0 });
    }

    return baseStats;
  }, [activeTab, summary]);

  return (
    <Box>
      <PageHeader
        title="Shipment Control"
        subtitle="Monitor and manage shipments throughout the delivery lifecycle."
        stats={stats}
      />

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Overview" value={tabsConfig.overview} />
        <Tab
          label={`Approvals${summary?.pending ? ` (${summary.pending})` : ''}`}
          value={tabsConfig.approvals}
        />
      </Tabs>

      {activeTab === tabsConfig.overview ? (
        <Box>
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
            columns={overviewColumns}
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
            onRefresh={fetchShipments}
            title="Shipment"
            getRowId={(row) => row._id}
            sx={{ height: 'calc(100vh - 240px)' }}
          />
        </Box>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Review shipments waiting for admin approval. Approved shipments will move into the
            active pipeline; rejected ones notify the merchant automatically.
          </Alert>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {approvalStateFilters.map((state) => (
              <Chip
                key={state}
                label={state === 'ALL' ? 'All states' : state}
                color={approvalStateFilter === state ? 'primary' : 'default'}
                variant={approvalStateFilter === state ? 'filled' : 'outlined'}
                onClick={() => {
                  setApprovalStateFilter(state);
                  setApprovalPage(0);
                }}
              />
            ))}
          </Stack>

          <EnhancedDataGrid
            rows={filteredApprovalRows}
            columns={approvalColumns}
            loading={approvalLoading}
            page={approvalPage}
            pageSize={approvalPageSize}
            onPageChange={(newPage) => setApprovalPage(newPage)}
            onPageSizeChange={(newSize) => {
              setApprovalPageSize(newSize);
              setApprovalPage(0);
            }}
            filterValue={approvalSearchTerm}
            onFilterChange={setApprovalSearchTerm}
            serverSidePagination
            rowCount={approvalRowCount}
            onRefresh={fetchApprovalShipments}
            title="Pending shipment"
            getRowId={(row) => row._id}
            sx={{ height: 'calc(100vh - 240px)' }}
          />
        </Box>
      )}

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Shipment Details
          </Typography>
          <IconButton size="small" onClick={() => setIsDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {selectedShipment ? (
          <Stack spacing={2}>
            {selectedShipment.approvalState === 'PENDING' && (
              <Alert
                severity="warning"
                action={
                  <Stack direction="row" spacing={1}>
                    <Button
                      color="success"
                      size="small"
                      onClick={() => handleApproveShipment(selectedShipment)}
                      disabled={Boolean(actionLoadingById[selectedShipment._id])}
                      startIcon={
                        actionLoadingById[selectedShipment._id] ? (
                          <PendingIcon fontSize="small" />
                        ) : (
                          <ApproveIcon fontSize="small" />
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      color="error"
                      size="small"
                      onClick={() => handleRejectShipment(selectedShipment)}
                      disabled={Boolean(actionLoadingById[selectedShipment._id])}
                      startIcon={
                        actionLoadingById[selectedShipment._id] ? (
                          <PendingIcon fontSize="small" />
                        ) : (
                          <RejectIcon fontSize="small" />
                        )
                      }
                    >
                      Reject
                    </Button>
                  </Stack>
                }
              >
                Pending admin approval
              </Alert>
            )}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Reference
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ overflowWrap: 'anywhere' }}>
                {selectedShipment._id}
              </Typography>
            </Box>
            <Divider />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Merchant
                </Typography>
                <Typography variant="body1">{selectedShipment.merchantId?.name || '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <StatusChip
                  status={(selectedShipment.status || '').toUpperCase()}
                  statusMap={statusMap}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Approval
                </Typography>
                <Stack spacing={0.5}>
                  <StatusChip
                    status={(selectedShipment.approvalState || '').toUpperCase()}
                    statusMap={approvalStateMap}
                  />
                  {selectedShipment.approval?.reviewedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Reviewed {new Date(selectedShipment.approval.reviewedAt).toLocaleString()}
                    </Typography>
                  )}
                  {selectedShipment.approval?.reviewedBy && (
                    <Typography variant="caption" color="text.secondary">
                      Reviewer: {selectedShipment.approval.reviewedBy?.name || 'Admin'}
                    </Typography>
                  )}
                  {selectedShipment.approval?.rejectionReason && (
                    <Typography variant="caption" color="error.main">
                      Reason: {selectedShipment.approval.rejectionReason}
                    </Typography>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cargo
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedShipment.cargoDetails?.description || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedShipment.cargoDetails?.weight ?? '—'} kg
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Route
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedShipment.origin?.address || '—'} →{' '}
                  {selectedShipment.destination?.address || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timing
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Pickup:{' '}
                  {selectedShipment.estimatedPickupDate
                    ? new Date(selectedShipment.estimatedPickupDate).toLocaleString()
                    : '—'}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Delivery:{' '}
                  {selectedShipment.estimatedDeliveryDate
                    ? new Date(selectedShipment.estimatedDeliveryDate).toLocaleString()
                    : '—'}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a shipment to view details.
          </Typography>
        )}
      </Drawer>

      <Dialog
        open={Boolean(approveDialogShipment)}
        onClose={closeApproveDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Approve shipment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Confirm approval for shipment {approveDialogShipment?._id}. The merchant will be
            notified.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeApproveDialog}>Cancel</Button>
          <Button
            color="success"
            onClick={confirmApproveShipment}
            startIcon={
              approveDialogShipment && actionLoadingById[approveDialogShipment._id] ? (
                <PendingIcon fontSize="small" />
              ) : (
                <ApproveIcon fontSize="small" />
              )
            }
            disabled={Boolean(
              approveDialogShipment && actionLoadingById[approveDialogShipment._id]
            )}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(rejectDialogShipment)}
        onClose={closeRejectDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject shipment</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Provide a reason for rejecting shipment {rejectDialogShipment?._id}. This message is
              sent to the merchant.
            </Typography>
            <TextField
              label="Rejection reason"
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (rejectError) {
                  setRejectError('');
                }
              }}
              error={Boolean(rejectError)}
              helperText={rejectError || 'Required'}
              multiline
              minRows={3}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button
            color="error"
            onClick={confirmRejectShipment}
            startIcon={
              rejectDialogShipment && actionLoadingById[rejectDialogShipment._id] ? (
                <PendingIcon fontSize="small" />
              ) : (
                <RejectIcon fontSize="small" />
              )
            }
            disabled={Boolean(rejectDialogShipment && actionLoadingById[rejectDialogShipment._id])}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Shipments;
