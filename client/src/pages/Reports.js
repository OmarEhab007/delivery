import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupsIcon from '@mui/icons-material/Groups';

import PageHeader from '../components/layout/PageHeader';
import SummaryCard from '../components/dashboard/SummaryCard';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import { reports } from '../api/api';

const periodLabel = (period) => {
  if (!period) return '';
  if (period.includes('W')) {
    const [year, week] = period.split('-W');
    return `W${week} ${year}`;
  }
  return period;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const Reports = () => {
  const [trendTimeframe, setTrendTimeframe] = useState('monthly');
  const [revenueTimeframe, setRevenueTimeframe] = useState('monthly');
  const [performanceEntity, setPerformanceEntity] = useState('driver');
  const [performanceTimeframe, setPerformanceTimeframe] = useState('lastQuarter');
  const [customerSortBy, setCustomerSortBy] = useState('shipmentCount');

  const [statusTrends, setStatusTrends] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [efficiencySeries, setEfficiencySeries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendRes, revenueRes, perfRes, customerRes, efficiencyRes] = await Promise.all([
        reports.getStatusTrends({ timeframe: trendTimeframe, limit: 8 }),
        reports.getRevenue({ timeframe: revenueTimeframe, limit: 8 }),
        reports.getPerformance({
          entityType: performanceEntity,
          timeframe: performanceTimeframe,
          limit: 6,
        }),
        reports.getCustomers({ sortBy: customerSortBy, limit: 6 }),
        reports.getEfficiency({ timeframe: trendTimeframe, limit: 8 }),
      ]);

      setStatusTrends(trendRes.data?.data || []);
      setRevenueBreakdown(revenueRes.data?.data || []);
      setPerformanceData(perfRes.data?.data || []);
      setCustomerInsights(customerRes.data?.data || []);
      setEfficiencySeries(efficiencyRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setError('Failed to load reports data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [trendTimeframe, revenueTimeframe, performanceEntity, performanceTimeframe, customerSortBy]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const trendSeries = useMemo(() => {
    if (!statusTrends.length) return [];
    const statusKeys = new Set();
    statusTrends.forEach((period) => {
      Object.keys(period.statuses || {}).forEach((status) => statusKeys.add(status));
    });

    return Array.from(statusKeys).map((status) => ({
      id: status.replace(/_/g, ' '),
      data: statusTrends.map((period) => ({
        x: periodLabel(period.period),
        y: period.statuses?.[status] ?? 0,
      })),
    }));
  }, [statusTrends]);

  const latestEfficiency = efficiencySeries.length
    ? efficiencySeries[efficiencySeries.length - 1]
    : null;
  const latestRevenue = revenueBreakdown.length
    ? revenueBreakdown[revenueBreakdown.length - 1]
    : null;
  const topCustomer = customerInsights.length ? customerInsights[0] : null;

  const summaryCards = [
    {
      title: 'Revenue (latest period)',
      value: latestRevenue?.totalRevenue ?? 0,
      icon: <AttachMoneyIcon />,
      accentColor: '#2563eb',
      meta: [
        { label: 'Shipments', value: latestRevenue?.shipmentCount ?? 0 },
        {
          label: 'Avg per shipment',
          value: latestRevenue?.averageRevenuePerShipment
            ? formatCurrency(latestRevenue.averageRevenuePerShipment)
            : '—',
        },
      ],
    },
    {
      title: 'Completion rate',
      value: latestEfficiency?.completionRate
        ? Math.round(latestEfficiency.completionRate * 100)
        : 0,
      icon: <SpeedIcon />,
      accentColor: '#16a34a',
      meta: [
        {
          label: 'Delays',
          value: latestEfficiency?.delayRate
            ? `${Math.round(latestEfficiency.delayRate * 100)}%`
            : '—',
        },
        {
          label: 'Cancellations',
          value: latestEfficiency?.cancellationRate
            ? `${Math.round(latestEfficiency.cancellationRate * 100)}%`
            : '—',
        },
      ],
      footer: latestEfficiency?.avgDeliveryTime
        ? `Avg delivery time: ${latestEfficiency.avgDeliveryTime.toFixed(1)} days`
        : undefined,
    },
    {
      title: performanceEntity === 'driver' ? 'Top driver shipments' : 'Top truck shipments',
      value: performanceData[0]?.totalShipments ?? 0,
      icon: <TimelineIcon />,
      accentColor: '#7c3aed',
      meta: [
        {
          label: performanceEntity === 'driver' ? 'Driver' : 'Truck',
          value:
            performanceEntity === 'driver'
              ? performanceData[0]?.driverName || '—'
              : performanceData[0]?.truckRegistration || '—',
        },
        {
          label: 'Distance',
          value: performanceData[0]?.totalDistance
            ? `${Math.round(performanceData[0].totalDistance)} km`
            : '—',
        },
      ],
    },
    {
      title: 'Best customer',
      value: topCustomer?.totalShipments ?? 0,
      icon: <GroupsIcon />,
      accentColor: '#f97316',
      meta: [
        {
          label: topCustomer?.merchantName || '—',
          value: formatCurrency(topCustomer?.totalRevenue ?? 0),
        },
        {
          label: 'Avg order value',
          value: topCustomer?.avgOrderValue ? formatCurrency(topCustomer.avgOrderValue) : '—',
        },
      ],
    },
  ];

  const performanceColumns = useMemo(() => {
    if (performanceEntity === 'driver') {
      return [
        { label: 'Driver', value: (row) => row.driverName },
        { label: 'Shipments', value: (row) => row.totalShipments },
        {
          label: 'On-time rate',
          value: (row) =>
            row.onTimeDeliveryRate !== undefined
              ? `${Math.round(row.onTimeDeliveryRate * 100)}%`
              : '—',
        },
        {
          label: 'Rating',
          value: (row) => (row.averageRating !== undefined ? row.averageRating.toFixed(1) : '—'),
        },
      ];
    }
    return [
      { label: 'Truck', value: (row) => row.truckRegistration || row.truckModel || '—' },
      { label: 'Shipments', value: (row) => row.totalShipments },
      {
        label: 'Distance',
        value: (row) =>
          row.totalDistance !== undefined ? `${Math.round(row.totalDistance)} km` : '—',
      },
      {
        label: 'Breakdown rate',
        value: (row) =>
          row.breakdownRate !== undefined ? `${Math.round(row.breakdownRate * 100)}%` : '—',
      },
    ];
  }, [performanceEntity]);

  const renderPerformanceValue = (column, row) => {
    const value = column.value(row);
    return value ?? '—';
  };

  return (
    <Box>
      <PageHeader
        title="Intelligence Reports"
        subtitle="Analyze platform performance across shipments, revenue, partners, and fleet activity."
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            {summaryCards.map((card) => (
              <Grid item xs={12} sm={6} lg={3} key={card.title}>
                <SummaryCard {...card} />
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Shipment status trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Distribution of shipment statuses over the selected timeframe.
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  value={trendTimeframe}
                  exclusive
                  size="small"
                  onChange={(_, value) => value && setTrendTimeframe(value)}
                >
                  <ToggleButton value="daily">Daily</ToggleButton>
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <TrendLineChart
                data={trendSeries}
                emptyLabel="No shipment history for this period."
              />
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Stack spacing={2} height="100%">
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Revenue breakdown
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total revenue and shipment counts per period.
                      </Typography>
                    </Box>
                    <ToggleButtonGroup
                      value={revenueTimeframe}
                      exclusive
                      size="small"
                      onChange={(_, value) => value && setRevenueTimeframe(value)}
                    >
                      <ToggleButton value="daily">Daily</ToggleButton>
                      <ToggleButton value="weekly">Weekly</ToggleButton>
                      <ToggleButton value="monthly">Monthly</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Shipments</TableCell>
                        <TableCell align="right">Avg / shipment</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenueBreakdown.map((row) => (
                        <TableRow key={row.period}>
                          <TableCell>{periodLabel(row.period)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.totalRevenue)}</TableCell>
                          <TableCell align="right">{row.shipmentCount ?? '—'}</TableCell>
                          <TableCell align="right">
                            {row.averageRevenuePerShipment
                              ? formatCurrency(row.averageRevenuePerShipment)
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={600}>
                    Operational efficiency
                  </Typography>
                  {efficiencySeries.length ? (
                    <Stack spacing={1.5}>
                      {efficiencySeries.map((item) => (
                        <Stack key={item.period} direction="row" spacing={2} alignItems="center">
                          <Box sx={{ minWidth: 80 }}>
                            <Typography variant="caption" color="text.secondary">
                              {periodLabel(item.period)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                            <Chip
                              size="small"
                              color="success"
                              label={`Completion ${Math.round((item.completionRate || 0) * 100)}%`}
                            />
                            <Chip
                              size="small"
                              color="warning"
                              label={`Delays ${Math.round((item.delayRate || 0) * 100)}%`}
                            />
                            <Chip
                              size="small"
                              color="error"
                              label={`Cancellation ${Math.round((item.cancellationRate || 0) * 100)}%`}
                            />
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Efficiency metrics will appear once there is completed shipment history for
                      the selected timeframe.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                      {performanceEntity === 'driver' ? 'Driver performance' : 'Truck performance'}
                    </Typography>
                    <ToggleButtonGroup
                      value={performanceEntity}
                      exclusive
                      size="small"
                      onChange={(_, value) => value && setPerformanceEntity(value)}
                    >
                      <ToggleButton value="driver">Drivers</ToggleButton>
                      <ToggleButton value="truck">Trucks</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                  <ToggleButtonGroup
                    value={performanceTimeframe}
                    exclusive
                    size="small"
                    onChange={(_, value) => value && setPerformanceTimeframe(value)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    <ToggleButton value="lastWeek">Last week</ToggleButton>
                    <ToggleButton value="lastMonth">Last month</ToggleButton>
                    <ToggleButton value="lastQuarter">Last quarter</ToggleButton>
                    <ToggleButton value="allTime">All time</ToggleButton>
                  </ToggleButtonGroup>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {performanceColumns.map((col) => (
                          <TableCell key={col.label}>{col.label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.map((row) => (
                        <TableRow key={row._id || row.driverName || row.truckRegistration}>
                          {performanceColumns.map((col) => (
                            <TableCell key={col.label}>
                              {renderPerformanceValue(col, row)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                      Top customers
                    </Typography>
                    <ToggleButtonGroup
                      value={customerSortBy}
                      exclusive
                      size="small"
                      onChange={(_, value) => value && setCustomerSortBy(value)}
                    >
                      <ToggleButton value="shipmentCount">Shipments</ToggleButton>
                      <ToggleButton value="revenue">Revenue</ToggleButton>
                      <ToggleButton value="avgValue">Avg value</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Shipments</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Avg order</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerInsights.map((row) => (
                        <TableRow key={row._id || row.merchantName}>
                          <TableCell>
                            <Typography variant="body2" color="text.primary">
                              {row.merchantName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.merchantEmail}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{row.totalShipments}</TableCell>
                          <TableCell align="right">{formatCurrency(row.totalRevenue)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.avgOrderValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
};

export default Reports;
