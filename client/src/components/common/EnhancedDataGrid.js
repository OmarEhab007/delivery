import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Tooltip,
  IconButton,
  InputAdornment,
  Stack,
  Menu,
  MenuItem,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';

// Custom toolbar for the data grid
const CustomToolbar = ({ 
  onAdd, 
  onRefresh, 
  filterValue, 
  onFilterChange, 
  title,
  exportOptions = [],
  hideAddButton = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const handleExportOption = (handler) => {
    handleExportClose();
    if (handler) handler();
  };

  return (
    <GridToolbarContainer>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ width: '100%', p: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <TextField
            variant="outlined"
            size="small"
            placeholder={`Search ${title}...`}
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
            sx={{ minWidth: 220 }}
          />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Stack direction="row" spacing={1}>
          {exportOptions.length > 0 && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExportIcon />}
                onClick={handleExportClick}
                sx={{ borderRadius: 2 }}
              >
                Export
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleExportClose}
              >
                {exportOptions.map((option) => (
                  <MenuItem 
                    key={option.label} 
                    onClick={() => handleExportOption(option.handler)}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          
          {!hideAddButton && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAdd}
              sx={{ borderRadius: 2 }}
            >
              Add {title}
            </Button>
          )}
        </Stack>
      </Stack>
    </GridToolbarContainer>
  );
};

// Custom no rows overlay
const CustomNoRowsOverlay = ({ message = 'No data available' }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      padding: 2,
    }}
  >
    <FilterIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
    <Box sx={{ mt: 1, color: 'text.secondary' }}>{message}</Box>
  </Box>
);

// Status chip component for consistent status display
export const StatusChip = ({ status, statusMap }) => {
  const theme = useTheme();
  const { label, color } = statusMap[status] || { 
    label: status, 
    color: 'default' 
  };

  let chipColor;
  switch (color) {
    case 'success':
      chipColor = theme.palette.success.main;
      break;
    case 'warning':
      chipColor = theme.palette.warning.main;
      break;
    case 'error':
      chipColor = theme.palette.error.main;
      break;
    case 'info':
      chipColor = theme.palette.info.main;
      break;
    case 'primary':
      chipColor = theme.palette.primary.main;
      break;
    case 'secondary':
      chipColor = theme.palette.secondary.main;
      break;
    default:
      chipColor = theme.palette.grey[500];
  }

  return (
    <Chip 
      label={label} 
      size="small"
      sx={{ 
        backgroundColor: `${chipColor}20`,
        color: chipColor,
        fontWeight: 500,
        borderRadius: '4px',
        border: `1px solid ${chipColor}40`,
      }} 
    />
  );
};

const EnhancedDataGrid = ({
  rows = [],
  columns = [],
  loading = false,
  page = 0,
  pageSize = 10,
  rowCount = 0,
  onPageChange,
  onPageSizeChange,
  filterValue = '',
  onFilterChange,
  onRefresh,
  onAdd,
  title = 'Items',
  exportOptions = [],
  serverSidePagination = false,
  hideAddButton = false,
  noDataMessage,
  getRowId,
  ...restProps
}) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableColumnMenu
          page={page}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          rowCount={serverSidePagination ? rowCount : rows.length}
          paginationMode={serverSidePagination ? 'server' : 'client'}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          components={{
            Toolbar: CustomToolbar,
            NoRowsOverlay: () => CustomNoRowsOverlay({ message: noDataMessage }),
          }}
          componentsProps={{
            toolbar: {
              onRefresh,
              onAdd,
              filterValue,
              onFilterChange,
              title,
              exportOptions,
              hideAddButton,
            },
          }}
          getRowId={getRowId}
          sx={{
            border: 'none',
            '& .MuiDataGrid-main': { marginX: 0 },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: (theme) => `${theme.palette.primary.main}10`,
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnSeparator': {
              display: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: (theme) => `${theme.palette.primary.main}08`,
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: (theme) => `${theme.palette.primary.main}15`,
              '&:hover': {
                backgroundColor: (theme) => `${theme.palette.primary.main}20`,
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
            },
          }}
          {...restProps}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedDataGrid; 