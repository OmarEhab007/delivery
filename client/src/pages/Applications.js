import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Stack, Chip, Tooltip, IconButton, Drawer, Typography, Divider } from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  HourglassTop as PendingIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import PageHeader from '../components/layout/PageHeader';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { applications, dashboard } from '../api/api';
import { normalizeApplication } from '../utils/adminDataTransformers';

const statusMap = {
  PENDING: { label: 'Pending', color: 'warning' },
  ACCEPTED: { label: 'Accepted', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

const statusFilters = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

const Applications = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoadingById, setActionLoadingById] = useState({});

  const fetchSummary = useCallback(async () => {
    try {
      const response = await dashboard.getStats();
      if (response.data?.status === 'success') {
        setSummary(response.data.data.applications);
      }
    } catch (error) {
      console.error('Failed to load application stats', error);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await applications.getAll(params);
      const payload = response.data?.data || response.data;
      const list = payload?.applications || [];
      const normalized = list.map(normalizeApplication);
      const pagination = payload?.pagination;

      setRows(normalized);
      setRowCount(pagination?.total ?? normalized.length);
    } catch (error) {
      console.error('Error fetching applications:', error);
      enqueueSnackbar('Failed to load applications', { variant: 'error' });
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
    fetchApplications();
  }, [fetchApplications]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((application) =>
      [
        application.ownerName,
        application.ownerEmail,
        application.ownerPhone,
        application.applicationType,
        application.truckPlate,
        application.shipmentCode,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const openDrawer = (application) => {
    setSelectedApplication(application);
    setDrawerOpen(true);
  };

  const handleUpdateStatus = useCallback(
    async (id, status) => {
      setActionLoadingById((prev) => ({ ...prev, [id]: true }));
      try {
        await applications.updateStatus(id, status);
        enqueueSnackbar(`Application ${status.toLowerCase()}`, { variant: 'success' });
        await Promise.allSettled([fetchSummary(), fetchApplications()]);
      } catch (error) {
        console.error(`Failed to update application status to ${status}`, error);
        enqueueSnackbar('Failed to update application status', { variant: 'error' });
      } finally {
        setActionLoadingById((prev) => ({ ...prev, [id]: false }));
      }
    },
    [enqueueSnackbar, fetchApplications, fetchSummary]
  );

  const handleApprove = useCallback(
    async (application) => {
      await handleUpdateStatus(application._id, 'ACCEPTED');
    },
    [handleUpdateStatus]
  );

  const handleReject = useCallback(
    async (application) => {
      await handleUpdateStatus(application._id, 'REJECTED');
    },
    [handleUpdateStatus]
  );

  const columns = useMemo(
    () => [
      { field: 'ownerName', headerName: 'Applicant', flex: 1, minWidth: 180 },
      { field: 'ownerEmail', headerName: 'Email', flex: 1, minWidth: 200 },
      { field: 'ownerPhone', headerName: 'Phone', flex: 0.8, minWidth: 150 },
      {
        field: 'applicationType',
        headerName: 'Type',
        flex: 0.7,
        minWidth: 140,
      },
      {
        field: 'truckPlate',
        headerName: 'Truck',
        flex: 0.7,
        minWidth: 140,
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 130,
        renderCell: (params) => <StatusChip status={params.value} statusMap={statusMap} />,
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
        flex: 0.8,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Details">
              <IconButton size="small" onClick={() => openDrawer(params.row)}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {params.row.status === 'PENDING' && (
              <>
                <Tooltip title="Approve">
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      disabled={Boolean(actionLoadingById[params.row._id])}
                      onClick={() => handleApprove(params.row)}
                    >
                      {actionLoadingById[params.row._id] ? (
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
                      disabled={Boolean(actionLoadingById[params.row._id])}
                      onClick={() => handleReject(params.row)}
                    >
                      {actionLoadingById[params.row._id] ? (
                        <PendingIcon fontSize="small" />
                      ) : (
                        <RejectIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
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
      { label: 'Total applications', value: summary.total ?? 0 },
      { label: 'Pending review', value: summary.pending ?? 0 },
      { label: 'Approved', value: summary.approved ?? 0 },
      { label: 'Rejected', value: summary.rejected ?? 0 },
    ];
  }, [summary]);

  return (
    <Box>
      <PageHeader
        title="Applications Hub"
        subtitle="Review onboarding requests and shipment bids from logistics partners."
        stats={stats}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {statusFilters.map((status) => (
          <Chip
            key={status}
            label={status === 'ALL' ? 'All' : status}
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
        onRefresh={fetchApplications}
        title="Application"
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
            Application Details
          </Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {selectedApplication ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Applicant
              </Typography>
              <Typography variant="body1" color="text.primary">
                {selectedApplication.ownerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedApplication.ownerEmail} • {selectedApplication.ownerPhone}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Details
              </Typography>
              <Typography variant="body2" color="text.primary">
                Type: {selectedApplication.applicationType}
              </Typography>
              <StatusChip status={selectedApplication.status} statusMap={statusMap} />
              <Typography variant="body2" color="text.secondary">
                Truck: {selectedApplication.truckPlate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Driver: {selectedApplication.driverName || '—'}
              </Typography>
            </Box>
            {selectedApplication.message && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Message
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedApplication.message}
                </Typography>
              </Box>
            )}
            {selectedApplication.bidDetails &&
              selectedApplication.bidDetails.price !== undefined && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bid Details
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {selectedApplication.bidDetails.currency || 'USD'}{' '}
                    {selectedApplication.bidDetails.price.toLocaleString()}
                  </Typography>
                </Box>
              )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select an application to view details.
          </Typography>
        )}
      </Drawer>
    </Box>
  );
};

export default Applications;
