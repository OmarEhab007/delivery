import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  HourglassTop as PendingIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import PageHeader from '../components/layout/PageHeader';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { dashboard, users, registrationRequests } from '../api/api';
import { normalizeRegistrationRequest } from '../utils/adminDataTransformers';

const roleStatusMap = {
  Admin: { label: 'Admin', color: 'error' },
  Merchant: { label: 'Merchant', color: 'primary' },
  TruckOwner: { label: 'Truck Owner', color: 'success' },
  Driver: { label: 'Driver', color: 'info' },
};

const userValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  role: Yup.string().oneOf(Object.keys(roleStatusMap)).required('Role is required'),
  password: Yup.string().when('isEditing', {
    is: false,
    then: () =>
      Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    otherwise: () => Yup.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const roleFilters = ['ALL', 'Admin', 'Merchant', 'TruckOwner', 'Driver'];

const requestStatusMap = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
};

const Users = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState('users');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [requests, setRequests] = useState([]);
  const [requestsRowCount, setRequestsRowCount] = useState(0);
  const [requestsPage, setRequestsPage] = useState(0);
  const [requestsPageSize, setRequestsPageSize] = useState(10);
  const [requestStateFilter, setRequestStateFilter] = useState('PENDING');
  const [requestRoleFilter, setRequestRoleFilter] = useState('ALL');
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionLoadingById, setRequestActionLoadingById] = useState({});

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await dashboard.getStats();
      if (response.data?.status === 'success') {
        setSummary(response.data.data.users);
      }
    } catch (error) {
      console.error('Failed to load summary stats', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: pageSize,
      };
      if (roleFilter !== 'ALL') {
        params.role = roleFilter;
      }

      const response = await users.getAll(params);
      const payload = response.data?.data || response.data;
      const list = payload?.users || [];
      const pagination = payload?.pagination;

      setRows(list);
      setRowCount(pagination?.total ?? list.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Failed to load users', { variant: 'error' });
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, page, pageSize, roleFilter]);

  const fetchRegistrationRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = {
        page: requestsPage + 1,
        limit: requestsPageSize,
      };

      if (requestStateFilter !== 'ALL') {
        params.state = requestStateFilter;
      }

      if (requestRoleFilter !== 'ALL') {
        params.role = requestRoleFilter;
      }

      const response = await registrationRequests.getAll(params);
      const payload = response.data?.data || response.data;
      const list = payload?.requests?.map(normalizeRegistrationRequest) || [];
      const pagination = payload?.pagination;

      setRequests(list);
      setRequestsRowCount(pagination?.total ?? list.length);
    } catch (error) {
      console.error('Error fetching registration requests:', error);
      enqueueSnackbar('Failed to load registration requests', { variant: 'error' });
      setRequests([]);
      setRequestsRowCount(0);
    } finally {
      setRequestsLoading(false);
    }
  }, [enqueueSnackbar, requestRoleFilter, requestStateFilter, requestsPage, requestsPageSize]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRegistrationRequests();
    }
  }, [activeTab, fetchRegistrationRequests]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((user) =>
      [user.name, user.email, user.phone, user.role]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const filteredRequests = useMemo(() => {
    if (!requestsSearchTerm) return requests;
    const term = requestsSearchTerm.toLowerCase();
    return requests.filter((request) =>
      [
        request.submittedByName,
        request.submittedByEmail,
        request.roleLabel,
        request.payload?.companyName,
        request.payload?.name,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [requests, requestsSearchTerm]);

  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteUser = useCallback(
    async (user) => {
      try {
        await users.delete(user._id);
        enqueueSnackbar('User deleted successfully', { variant: 'success' });
        fetchUsers();
        fetchSummary();
      } catch (error) {
        console.error('Error deleting user:', error);
        enqueueSnackbar('Failed to delete user', { variant: 'error' });
      }
    },
    [enqueueSnackbar, fetchUsers, fetchSummary]
  );

  const formik = useFormik({
    initialValues: {
      name: selectedUser?.name || '',
      email: selectedUser?.email || '',
      phone: selectedUser?.phone || '',
      role: selectedUser?.role || 'Merchant',
      password: '',
      isEditing,
    },
    enableReinitialize: true,
    validationSchema: userValidationSchema,
    onSubmit: async (values, helpers) => {
      try {
        if (isEditing) {
          const payload = { ...values };
          if (!payload.password) delete payload.password;
          delete payload.isEditing;
          await users.update(selectedUser._id, payload);
          enqueueSnackbar('User updated successfully', { variant: 'success' });
        } else {
          const payload = { ...values };
          delete payload.isEditing;
          await users.create(payload);
          enqueueSnackbar('User created successfully', { variant: 'success' });
        }
        setIsDialogOpen(false);
        helpers.resetForm();
        fetchUsers();
        fetchSummary();
      } catch (error) {
        console.error('Error saving user:', error);
        enqueueSnackbar(error.response?.data?.message || 'Failed to save user', {
          variant: 'error',
        });
      }
    },
  });

  const handleRegistrationAction = useCallback(
    async (id, action, reason) => {
      setRequestActionLoadingById((prev) => ({ ...prev, [id]: true }));
      try {
        if (action === 'approve') {
          await registrationRequests.approve(id);
          enqueueSnackbar('Registration request approved', { variant: 'success' });
        } else if (action === 'reject') {
          await registrationRequests.reject(id, reason);
          enqueueSnackbar('Registration request rejected', { variant: 'info' });
        }
        await Promise.allSettled([fetchSummary(), fetchRegistrationRequests()]);
      } catch (error) {
        console.error(`Failed to ${action} registration request`, error);
        enqueueSnackbar(`Failed to ${action} registration request`, { variant: 'error' });
      } finally {
        setRequestActionLoadingById((prev) => ({ ...prev, [id]: false }));
      }
    },
    [enqueueSnackbar, fetchRegistrationRequests, fetchSummary]
  );

  const userColumns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
      { field: 'phone', headerName: 'Phone', flex: 0.8, minWidth: 140 },
      {
        field: 'role',
        headerName: 'Role',
        flex: 0.6,
        minWidth: 130,
        renderCell: (params) => <StatusChip status={params.value} statusMap={roleStatusMap} />,
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        flex: 0.7,
        minWidth: 140,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.7,
        minWidth: 150,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEditUser(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => handleDeleteUser(params.row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [handleDeleteUser, handleEditUser]
  );

  const requestColumns = useMemo(
    () => [
      {
        field: 'submittedByName',
        headerName: 'Submitted By',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => (
          <Stack>
            <Typography variant="body2" fontWeight={600}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.submittedByEmail}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'roleLabel',
        headerName: 'Requested Role',
        flex: 0.7,
        minWidth: 140,
        renderCell: (params) => <StatusChip status={params.value} statusMap={roleStatusMap} />,
      },
      {
        field: 'state',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 130,
        renderCell: (params) => <StatusChip status={params.value} statusMap={requestStatusMap} />,
      },
      {
        field: 'submittedAt',
        headerName: 'Submitted',
        flex: 0.7,
        minWidth: 140,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : '—'),
      },
      {
        field: 'payload.name',
        headerName: 'Applicant',
        flex: 1,
        minWidth: 180,
        valueGetter: (params) => params.row.payload?.name || '—',
      },
      {
        field: 'payload.companyName',
        headerName: 'Company',
        flex: 1,
        minWidth: 180,
        valueGetter: (params) => params.row.payload?.companyName || '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.8,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => {
          const request = params.row;
          const isPending = request.state === 'PENDING';
          const loading = Boolean(requestActionLoadingById[request._id]);

          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Details">
                <IconButton size="small" onClick={() => setSelectedRequest(request)}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {isPending && (
                <>
                  <Tooltip title="Approve">
                    <span>
                      <IconButton
                        size="small"
                        color="success"
                        disabled={loading}
                        onClick={() => handleRegistrationAction(request._id, 'approve')}
                      >
                        {loading ? (
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
                        disabled={loading}
                        onClick={() => handleRegistrationAction(request._id, 'reject')}
                      >
                        {loading ? (
                          <PendingIcon fontSize="small" />
                        ) : (
                          <RejectIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Stack>
          );
        },
      },
    ],
    [handleRegistrationAction, requestActionLoadingById]
  );

  const stats = useMemo(() => {
    if (!summary) return null;
    const baseStats = [
      { label: 'Total users', value: summary.total ?? 0 },
      { label: 'Merchants', value: summary.merchants ?? 0 },
      { label: 'Truck owners', value: summary.truckOwners ?? 0 },
      { label: 'Drivers', value: summary.drivers ?? 0 },
    ];

    if (activeTab === 'requests' && typeof summary.pendingRegistrationRequests === 'number') {
      baseStats.push({ label: 'Pending approvals', value: summary.pendingRegistrationRequests });
    }

    return baseStats;
  }, [activeTab, summary]);

  return (
    <Box>
      <PageHeader
        title="User Operations"
        subtitle="Approve new registrations and manage existing platform members."
        stats={stats}
        actions={
          activeTab === 'users' ? (
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleAddUser}>
              New User
            </Button>
          ) : null
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Users" value="users" />
        <Tab
          label={`Registration Requests${summary?.pendingRegistrationRequests ? ` (${summary.pendingRegistrationRequests})` : ''}`}
          value="requests"
        />
      </Tabs>

      {activeTab === 'users' ? (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {roleFilters.map((role) => (
              <Chip
                key={role}
                label={role === 'ALL' ? 'All' : role}
                color={roleFilter === role ? 'primary' : 'default'}
                variant={roleFilter === role ? 'filled' : 'outlined'}
                onClick={() => {
                  setRoleFilter(role);
                  setPage(0);
                }}
              />
            ))}
          </Stack>

          <EnhancedDataGrid
            rows={filteredRows}
            columns={userColumns}
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
            onRefresh={fetchUsers}
            onAdd={handleAddUser}
            title="User"
            getRowId={(row) => row._id}
            sx={{ height: 'calc(100vh - 280px)' }}
          />
        </Box>
      ) : (
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((state) => (
              <Chip
                key={state}
                label={state === 'ALL' ? 'All' : state}
                color={requestStateFilter === state ? 'primary' : 'default'}
                variant={requestStateFilter === state ? 'filled' : 'outlined'}
                onClick={() => {
                  setRequestStateFilter(state);
                  setRequestsPage(0);
                }}
              />
            ))}
            <Divider flexItem orientation="vertical" />
            {['ALL', 'Merchant', 'TruckOwner', 'Driver'].map((role) => (
              <Chip
                key={role}
                label={role === 'ALL' ? 'All roles' : role}
                color={requestRoleFilter === role ? 'primary' : 'default'}
                variant={requestRoleFilter === role ? 'filled' : 'outlined'}
                onClick={() => {
                  setRequestRoleFilter(role);
                  setRequestsPage(0);
                }}
              />
            ))}
          </Stack>

          <EnhancedDataGrid
            rows={filteredRequests}
            columns={requestColumns}
            loading={requestsLoading}
            page={requestsPage}
            pageSize={requestsPageSize}
            onPageChange={(newPage) => setRequestsPage(newPage)}
            onPageSizeChange={(newSize) => {
              setRequestsPageSize(newSize);
              setRequestsPage(0);
            }}
            filterValue={requestsSearchTerm}
            onFilterChange={setRequestsSearchTerm}
            serverSidePagination
            rowCount={requestsRowCount}
            onRefresh={fetchRegistrationRequests}
            title="Registration request"
            hideAddButton
            getRowId={(row) => row._id}
            sx={{ height: 'calc(100vh - 280px)' }}
          />
        </Box>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" fontWeight={600}>
            {isEditing ? 'Edit User' : 'Add New User'}
          </Typography>
          <IconButton size="small" onClick={() => setIsDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  disabled={isEditing}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Role"
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.role && Boolean(formik.errors.role)}
                  helperText={formik.touched.role && formik.errors.role}
                  SelectProps={{ MenuProps: { disablePortal: true } }}
                >
                  {Object.keys(roleStatusMap).map((role) => (
                    <MenuItem key={role} value={role}>
                      {roleStatusMap[role].label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={isEditing ? 'New Password (optional)' : 'Password'}
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<PersonAddIcon />}>
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" fontWeight={600}>
            Registration Details
          </Typography>
          <IconButton size="small" onClick={() => setSelectedRequest(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest ? (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Submitted By
              </Typography>
              <Typography variant="body1" color="text.primary">
                {selectedRequest.submittedByName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRequest.submittedByEmail}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Applicant Details
              </Typography>
              <Typography variant="body1" color="text.primary">
                {selectedRequest.payload?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRequest.payload?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role requested: {selectedRequest.roleLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Company: {selectedRequest.payload?.companyName || '—'}
              </Typography>
              {selectedRequest.payload?.licenseNumber && (
                <Typography variant="body2" color="text.secondary">
                  License #: {selectedRequest.payload.licenseNumber}
                </Typography>
              )}

              {selectedRequest.rejectionReason && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Rejection Reason
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {selectedRequest.rejectionReason}
                  </Typography>
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRequest(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
