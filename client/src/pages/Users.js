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
  Grid,
  useTheme,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { users } from '../api/api';

// Define user roles status map for consistent styling
const roleStatusMap = {
  'Admin': { label: 'Admin', color: 'error' },
  'Merchant': { label: 'Merchant', color: 'primary' },
  'TruckOwner': { label: 'Truck Owner', color: 'success' },
  'Driver': { label: 'Driver', color: 'info' },
};

// Form validation schema
const userValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  role: Yup.string().required('Role is required').oneOf(
    Object.keys(roleStatusMap),
    'Invalid role'
  ),
  password: Yup.string().when('isEditing', {
    is: false,
    then: () => Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    otherwise: () => Yup.string().min(6, 'Password must be at least 6 characters').notRequired(),
  }),
});

const UserDialog = ({ open, onClose, user, onSubmit, isEditing }) => {
  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'Merchant',
      password: '',
      isEditing,
    },
    validationSchema: userValidationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      // Filter out password if empty in edit mode
      const userData = {...values};
      if (isEditing && !userData.password) {
        delete userData.password;
      }
      delete userData.isEditing;
      
      onSubmit(userData);
    },
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
        {isEditing ? 'Edit User' : 'Add New User'}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={isEditing} // Email should not be editable in edit mode
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                id="role"
                name="role"
                label="Role"
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.role && Boolean(formik.errors.role)}
                helperText={formik.touched.role && formik.errors.role}
              >
                {Object.entries(roleStatusMap).map(([role, { label }]) => (
                  <MenuItem key={role} value={role}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label={isEditing ? "New Password (leave blank to keep current)" : "Password"}
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

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            disabled={formik.isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const DeleteUserDialog = ({ open, onClose, onConfirm, userName }) => (
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
        Are you sure you want to delete the user <strong>{userName}</strong>?
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

const Users = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await users.getAll();
      
      // Extract users array from response.data structure
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.users) {
        setUsersData(response.data.data.users);
      } else if (response.data && response.data.users) {
        // Alternative structure
        setUsersData(response.data.users);
      } else {
        // Fallback if no recognized structure
        setUsersData(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Failed to load users', { variant: 'error' });
      setUsersData([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter the users data
  const filteredUsers = Array.isArray(usersData) 
    ? usersData.filter((user) =>
        Object.values(user).some(
          (value) =>
            value &&
            typeof value === 'string' &&
            value.toLowerCase().includes(filterValue.toLowerCase())
        )
      )
    : [];

  // Add user handler
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setUserDialogOpen(true);
  };

  // Edit user handler
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setUserDialogOpen(true);
  };

  // Delete user handler
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Submit user form handler
  const handleUserSubmit = async (userData) => {
    try {
      let response;
      
      if (isEditing) {
        response = await users.update(selectedUser._id, userData);
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      } else {
        response = await users.create(userData);
        enqueueSnackbar('User created successfully', { variant: 'success' });
      }
      
      setUserDialogOpen(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          `Failed to ${isEditing ? 'update' : 'create'} user`;
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  // Confirm delete handler
  const handleDeleteConfirm = async () => {
    try {
      await users.delete(selectedUser._id);
      setDeleteDialogOpen(false);
      fetchUsers(); // Refresh the user list
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to delete user';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  // Define columns for the data grid
  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 140 },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 1, 
      minWidth: 130,
      renderCell: (params) => (
        <StatusChip status={params.value} statusMap={roleStatusMap} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => new Date(params.row.createdAt),
      valueFormatter: (params) => params.value.toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit User">
            <IconButton 
              size="small" 
              onClick={() => handleEditUser(params.row)}
              sx={{ color: theme.palette.primary.main }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton 
              size="small" 
              onClick={() => handleDeleteClick(params.row)}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Users Management
      </Typography>

      <EnhancedDataGrid
        rows={filteredUsers}
        columns={columns}
        loading={loading}
        page={page}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        onRefresh={fetchUsers}
        onAdd={handleAddUser}
        title="User"
        exportOptions={[
          { label: 'Export as CSV', handler: () => {} },
          { label: 'Export as Excel', handler: () => {} },
        ]}
        getRowId={(row) => row._id}
        noDataMessage="No users found"
        sx={{ height: 'calc(100vh - 180px)' }}
      />

      {/* Add/Edit User Dialog */}
      <UserDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        user={selectedUser}
        onSubmit={handleUserSubmit}
        isEditing={isEditing}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        userName={selectedUser?.name || ''}
      />
    </Box>
  );
};

export default Users; 