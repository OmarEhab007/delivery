import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';

import PageHeader from '../components/layout/PageHeader';
import EnhancedDataGrid, { StatusChip } from '../components/common/EnhancedDataGrid';
import { shipments } from '../api/api';

const complianceStatusMap = {
  READY: { label: 'Ready', color: 'success' },
  PENDING: { label: 'Pending', color: 'warning' },
};

const statusMap = {
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'warning' },
  REQUESTED: { label: 'Requested', color: 'info' },
  ASSIGNED: { label: 'Assigned', color: 'primary' },
  IN_TRANSIT: { label: 'In Transit', color: 'warning' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

const complianceDocumentOptions = [
  { value: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice' },
  { value: 'PACKING_LIST', label: 'Packing List' },
  { value: 'BILL_OF_LADING', label: 'Bill of Lading' },
  { value: 'WAYBILL', label: 'Waybill' },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin' },
  { value: 'ACID_PROOF', label: 'ACID Proof' },
  { value: 'INSURANCE_CERTIFICATE', label: 'Insurance Certificate' },
];

const MerchantShipments = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);

  const [createForm, setCreateForm] = useState({
    originAddress: '',
    destinationAddress: '',
    cargoDescription: '',
    cargoWeight: '',
  });

  const [complianceForm, setComplianceForm] = useState({
    acidNumber: '',
    incoterm: '',
    gaftaRequested: false,
  });

  const [uploadForm, setUploadForm] = useState({
    documentType: 'COMMERCIAL_INVOICE',
    file: null,
  });

  const [paymentForm, setPaymentForm] = useState({
    file: null,
    amount: '',
    currency: 'USD',
  });

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await shipments.getMerchantShipments({ page: page + 1, limit: pageSize });
      const payload = response.data?.data || response.data;
      const list = payload?.shipments || [];
      const pagination = payload?.pagination;

      const mapped = list.map((shipment) => ({
        ...shipment,
        id: shipment._id,
      }));

      setRows(mapped);
      setRowCount(pagination?.total ?? mapped.length);
    } catch (error) {
      console.error('Failed to load shipments', error);
      enqueueSnackbar('Failed to load shipments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, page, pageSize]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      [row._id, row.origin?.address, row.destination?.address]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const handleCreateShipment = async () => {
    // Client-side validation
    if (!createForm.originAddress.trim()) {
      enqueueSnackbar('Origin address is required', { variant: 'warning' });
      return;
    }
    if (!createForm.destinationAddress.trim()) {
      enqueueSnackbar('Destination address is required', { variant: 'warning' });
      return;
    }
    if (!createForm.cargoDescription.trim()) {
      enqueueSnackbar('Cargo description is required', { variant: 'warning' });
      return;
    }
    const weight = Number(createForm.cargoWeight);
    if (!createForm.cargoWeight || Number.isNaN(weight) || weight <= 0) {
      enqueueSnackbar('Cargo weight must be a positive number', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        origin: { address: createForm.originAddress.trim() },
        destination: { address: createForm.destinationAddress.trim() },
        cargoDetails: {
          description: createForm.cargoDescription.trim(),
          weight,
        },
        pricingType: 'BIDDING',
      };

      await shipments.safeCreateShipment(payload);
      enqueueSnackbar('Shipment request created', { variant: 'success' });
      setCreateOpen(false);
      setCreateForm({
        originAddress: '',
        destinationAddress: '',
        cargoDescription: '',
        cargoWeight: '',
      });
      fetchShipments();
    } catch (error) {
      console.error('Failed to create shipment', error);
      enqueueSnackbar('Failed to create shipment', { variant: 'error' });
    }
  };

  const handleSaveCompliance = async () => {
    if (!selectedShipment) return;
    try {
      await shipments.updateComplianceDetails(selectedShipment._id, complianceForm);
      enqueueSnackbar('Compliance details updated', { variant: 'success' });
      setComplianceOpen(false);
      fetchShipments();
    } catch (error) {
      console.error('Failed to update compliance', error);
      enqueueSnackbar('Failed to update compliance', { variant: 'error' });
    }
  };

  const handleUploadComplianceDoc = async () => {
    if (!selectedShipment || !uploadForm.file) return;
    try {
      await shipments.uploadComplianceDocument(selectedShipment._id, uploadForm);
      enqueueSnackbar('Compliance document uploaded', { variant: 'success' });
      setUploadOpen(false);
      setUploadForm({ documentType: 'COMMERCIAL_INVOICE', file: null });
      fetchShipments();
    } catch (error) {
      console.error('Failed to upload document', error);
      enqueueSnackbar('Failed to upload document', { variant: 'error' });
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!selectedShipment || !paymentForm.file) return;
    try {
      await shipments.uploadPaymentProof(selectedShipment._id, paymentForm);
      enqueueSnackbar('Payment proof uploaded', { variant: 'success' });
      setPaymentOpen(false);
      setPaymentForm({ file: null, amount: '', currency: 'USD' });
      fetchShipments();
    } catch (error) {
      console.error('Failed to upload payment proof', error);
      enqueueSnackbar('Failed to upload payment proof', { variant: 'error' });
    }
  };

  const handleOpenTracking = async (shipment) => {
    try {
      setSelectedShipment(shipment);
      const response = await shipments.getTracking(shipment._id);
      setTrackingInfo(response.data?.data || null);
      setTrackingOpen(true);
    } catch (error) {
      console.error('Failed to load tracking', error);
      enqueueSnackbar('Failed to load tracking', { variant: 'error' });
    }
  };

  const columns = [
    {
      field: 'origin',
      headerName: 'Origin',
      flex: 1,
      valueGetter: (params) => params.row.origin?.address || '—',
    },
    {
      field: 'destination',
      headerName: 'Destination',
      flex: 1,
      valueGetter: (params) => params.row.destination?.address || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => <StatusChip status={params.value} statusMap={statusMap} />,
    },
    {
      field: 'compliance',
      headerName: 'Compliance',
      width: 160,
      valueGetter: (params) => params.row.compliance?.status || 'PENDING',
      renderCell: (params) => <StatusChip status={params.value} statusMap={complianceStatusMap} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 360,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedShipment(params.row);
              setComplianceForm({
                acidNumber: params.row.compliance?.acidNumber || '',
                incoterm: params.row.incoterm || '',
                gaftaRequested: Boolean(params.row.compliance?.gaftaRequested),
              });
              setComplianceOpen(true);
            }}
          >
            Compliance
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedShipment(params.row);
              setUploadOpen(true);
            }}
          >
            Upload Doc
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedShipment(params.row);
              setPaymentOpen(true);
            }}
          >
            Payment Proof
          </Button>
          <Button size="small" variant="outlined" onClick={() => handleOpenTracking(params.row)}>
            Tracking
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="My Shipments" subtitle="Manage shipment requests and compliance" />
      <EnhancedDataGrid
        title="Shipments"
        rows={filteredRows}
        columns={columns}
        loading={loading}
        page={page}
        pageSize={pageSize}
        rowCount={rowCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filterValue={searchTerm}
        onFilterChange={setSearchTerm}
        onRefresh={fetchShipments}
        onAdd={() => setCreateOpen(true)}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Shipment Request</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Origin Address"
              value={createForm.originAddress}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, originAddress: e.target.value }))
              }
            />
            <TextField
              label="Destination Address"
              value={createForm.destinationAddress}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, destinationAddress: e.target.value }))
              }
            />
            <TextField
              label="Cargo Description"
              value={createForm.cargoDescription}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, cargoDescription: e.target.value }))
              }
            />
            <TextField
              label="Cargo Weight (tons)"
              type="number"
              value={createForm.cargoWeight}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, cargoWeight: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateShipment}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={complianceOpen}
        onClose={() => setComplianceOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Compliance Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="ACID Number"
              value={complianceForm.acidNumber}
              onChange={(e) =>
                setComplianceForm((prev) => ({ ...prev, acidNumber: e.target.value }))
              }
            />
            <TextField
              label="Incoterm"
              value={complianceForm.incoterm}
              onChange={(e) => setComplianceForm((prev) => ({ ...prev, incoterm: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="gafta-label">GAFTA Requested</InputLabel>
              <Select
                labelId="gafta-label"
                label="GAFTA Requested"
                value={complianceForm.gaftaRequested ? 'yes' : 'no'}
                onChange={(e) =>
                  setComplianceForm((prev) => ({
                    ...prev,
                    gaftaRequested: e.target.value === 'yes',
                  }))
                }
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComplianceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCompliance}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Compliance Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="document-type-label">Document Type</InputLabel>
              <Select
                labelId="document-type-label"
                label="Document Type"
                value={uploadForm.documentType}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, documentType: e.target.value }))
                }
              >
                {complianceDocumentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" component="label">
              Select File
              <input
                type="file"
                hidden
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))
                }
              />
            </Button>
            {uploadForm.file && (
              <Typography variant="body2">Selected: {uploadForm.file.name}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadComplianceDoc}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Payment Proof</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button variant="outlined" component="label">
              Select File
              <input
                type="file"
                hidden
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))
                }
              />
            </Button>
            {paymentForm.file && (
              <Typography variant="body2">Selected: {paymentForm.file.name}</Typography>
            )}
            <TextField
              label="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
            <TextField
              label="Currency"
              value={paymentForm.currency}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, currency: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadPaymentProof}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={trackingOpen} onClose={() => setTrackingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tracking</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {trackingInfo ? (
              <>
                <Typography variant="body2">
                  Status: {trackingInfo.status || selectedShipment?.status}
                </Typography>
                <Typography variant="body2">
                  Last Update: {trackingInfo.lastUpdate || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  ETA: {trackingInfo.eta ? new Date(trackingInfo.eta).toLocaleString() : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Location: {trackingInfo.currentLocation?.address || 'N/A'}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">No tracking data available.</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MerchantShipments;
