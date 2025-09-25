import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import DescriptionIcon from '@mui/icons-material/Description';
import { useTheme } from '@mui/material/styles';

import SummaryCard from '../components/dashboard/SummaryCard';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import StatusDonutChart from '../components/dashboard/StatusDonutChart';
import RecentShipments from '../components/dashboard/RecentShipments';
import RecentActivity from '../components/dashboard/RecentActivity';
import { dashboard } from '../api/api';

const statusChipMap = {
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
};

const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboard.getStats();
        if (response.data?.status === 'success') {
          setStats(response.data.data);
        } else {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const summaryCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: 'Total Users',
        value: stats.users?.total ?? 0,
        delta: stats.users?.increase ?? 0,
        icon: <PeopleIcon />,
        accentColor: theme.palette.primary.main,
        meta: [
          { label: 'Merchants', value: stats.users?.merchants ?? 0 },
          { label: 'Truck Owners', value: stats.users?.truckOwners ?? 0 },
          { label: 'Drivers', value: stats.users?.drivers ?? 0 },
        ],
        footer: 'Admin users excluded from totals',
      },
      {
        title: 'Active Shipments',
        value: stats.shipments?.total ?? 0,
        delta: stats.shipments?.increase ?? 0,
        icon: <LocalShippingIcon />,
        accentColor: theme.palette.warning.main,
        meta: [
          { label: 'In Transit', value: stats.shipments?.inTransit ?? 0 },
          { label: 'Delivered', value: stats.shipments?.delivered ?? 0 },
          { label: 'Pending', value: stats.shipments?.pending ?? 0 },
        ],
      },
      {
        title: 'Fleet Overview',
        value: stats.trucks?.total ?? 0,
        delta: stats.trucks?.increase ?? 0,
        icon: <DirectionsBusIcon />,
        accentColor: theme.palette.success.main,
        meta: [
          { label: 'Available', value: stats.trucks?.available ?? 0 },
          {
            label: 'Utilization',
            value: `${stats.trucks?.total ? Math.round(((stats.trucks.total - (stats.trucks.available || 0)) / stats.trucks.total) * 100) : 0}%`,
          },
        ],
      },
      {
        title: 'Applications',
        value: stats.applications?.total ?? 0,
        delta: stats.applications?.increase ?? 0,
        icon: <DescriptionIcon />,
        accentColor: theme.palette.info.main,
        meta: [
          { label: 'Pending', value: stats.applications?.pending ?? 0 },
          { label: 'Approved', value: stats.applications?.approved ?? 0 },
          { label: 'Rejected', value: stats.applications?.rejected ?? 0 },
        ],
      },
    ];
  }, [
    stats,
    theme.palette.info.main,
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
  ]);

  const trendData = useMemo(() => {
    if (!stats) return [];

    const shipmentsSeries = {
      id: 'Shipments',
      data: (stats.shipments?.monthlyData || []).map((point) => ({
        x: point.month,
        y: point.count ?? 0,
      })),
    };

    const usersSeries = {
      id: 'New Users',
      data: (stats.monthlyUserData || []).map((point) => ({
        x: point.month,
        y: point.count ?? 0,
      })),
    };

    return [shipmentsSeries, usersSeries];
  }, [stats]);

  const statusData = useMemo(() => {
    if (!stats?.shipments?.statusDistribution) return [];

    return stats.shipments.statusDistribution.map((item) => ({
      status: item.status,
      label: item.status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/(^|\s)\S/g, (s) => s.toUpperCase()),
      value: item.count,
    }));
  }, [stats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Operations Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insight into platform usage, fleet performance, and shipment health.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 1 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={600}>
                Growth Trends
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monthly shipments compared with new user registrations.
              </Typography>
              <TrendLineChart data={trendData} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
            <Stack spacing={1.5} sx={{ height: '100%' }}>
              <Typography variant="h6" fontWeight={600}>
                Shipment Status Mix
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current distribution across all active shipments.
              </Typography>
              <StatusDonutChart data={statusData} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack spacing={2} height="100%">
              <Typography variant="h6" fontWeight={600}>
                Recent Shipments
              </Typography>
              <Divider />
              <RecentShipments shipments={stats?.shipments?.recent} statusMap={statusChipMap} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack spacing={2} height="100%">
              <Typography variant="h6" fontWeight={600}>
                Activity Timeline
              </Typography>
              <Divider />
              <RecentActivity items={stats?.recentActivity} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
