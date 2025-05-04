import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Person as UserIcon,
  LocalShipping as ShipmentIcon,
  DirectionsBus as TruckIcon,
  Description as ApplicationIcon,
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { dashboard } from '../api/api';

const StatCard = ({ title, value, icon, color, increase }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: theme.shadows[2],
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              borderRadius: '12px',
              p: 1.5,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              color: increase >= 0 ? 'success.main' : 'error.main',
              fontWeight: 'bold',
            }}
          >
            {increase >= 0 ? '+' : ''}{increase}%
          </Typography>
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            from last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    users: {
      total: 0,
      increase: 0,
    },
    shipments: {
      total: 0,
      increase: 0,
      statusDistribution: [],
      monthlyData: []
    },
    trucks: {
      total: 0,
      increase: 0,
      available: 0,
    },
    applications: {
      total: 0,
      increase: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    monthlyUserData: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboard.getStats();
        
        // Extract the data from the response structure
        // The API returns { status: 'success', data: {...} }
        if (response.data && response.data.status === 'success') {
          setStats(response.data.data);
        } else {
          // Fallback to directly using the response data if it doesn't follow the expected structure
          setStats(response.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare pie chart data from API response
  const preparePieData = () => {
    if (!stats.shipments || !stats.shipments.statusDistribution || !stats.shipments.statusDistribution.length) {
      return [
        { id: 'REQUESTED', label: 'Requested', value: 25, color: theme.palette.info.main },
        { id: 'CONFIRMED', label: 'Confirmed', value: 30, color: theme.palette.primary.main },
        { id: 'IN_TRANSIT', label: 'In Transit', value: 20, color: theme.palette.warning.main },
        { id: 'DELIVERED', label: 'Delivered', value: 15, color: theme.palette.success.main },
        { id: 'CANCELLED', label: 'Cancelled', value: 10, color: theme.palette.error.main },
      ];
    }

    // Map status colors
    const statusColors = {
      REQUESTED: theme.palette.info.main,
      CONFIRMED: theme.palette.primary.main,
      IN_TRANSIT: theme.palette.warning.main,
      DELIVERED: theme.palette.success.main,
      CANCELLED: theme.palette.error.main
    };

    return stats.shipments.statusDistribution.map(item => ({
      id: item.status,
      label: item.status.replace('_', ' ').charAt(0) + item.status.replace('_', ' ').slice(1).toLowerCase(),
      value: item.count,
      color: statusColors[item.status] || theme.palette.grey[500]
    }));
  };

  // Prepare line chart data from API response
  const prepareLineData = () => {
    if ((!stats.shipments || !stats.shipments.monthlyData) && 
        (!stats.monthlyUserData)) {
      return [
        {
          id: 'shipments',
          color: theme.palette.primary.main,
          data: [
            { x: 'Jan', y: 20 },
            { x: 'Feb', y: 30 },
            { x: 'Mar', y: 25 },
            { x: 'Apr', y: 40 },
            { x: 'May', y: 35 },
            { x: 'Jun', y: 50 },
          ],
        },
        {
          id: 'users',
          color: theme.palette.secondary.main,
          data: [
            { x: 'Jan', y: 10 },
            { x: 'Feb', y: 15 },
            { x: 'Mar', y: 20 },
            { x: 'Apr', y: 25 },
            { x: 'May', y: 30 },
            { x: 'Jun', y: 35 },
          ],
        },
      ];
    }

    const lineData = [];

    // Add shipment data if available
    if (stats.shipments && stats.shipments.monthlyData) {
      lineData.push({
        id: 'shipments',
        color: theme.palette.primary.main,
        data: stats.shipments.monthlyData.map(item => ({
          x: item.month,
          y: item.count
        }))
      });
    }

    // Add user data if available
    if (stats.monthlyUserData) {
      lineData.push({
        id: 'users',
        color: theme.palette.secondary.main,
        data: stats.monthlyUserData.map(item => ({
          x: item.month,
          y: item.count
        }))
      });
    }

    return lineData;
  };

  const pieData = preparePieData();
  const lineData = prepareLineData();

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={(stats.users && stats.users.total) || 0}
            icon={<UserIcon sx={{ color: theme.palette.primary.main }} />}
            color="primary"
            increase={(stats.users && stats.users.increase) || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Shipments"
            value={(stats.shipments && stats.shipments.total) || 0}
            icon={<ShipmentIcon sx={{ color: theme.palette.success.main }} />}
            color="success"
            increase={(stats.shipments && stats.shipments.increase) || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Trucks"
            value={(stats.trucks && stats.trucks.available) || 0}
            icon={<TruckIcon sx={{ color: theme.palette.info.main }} />}
            color="info"
            increase={(stats.trucks && stats.trucks.increase) || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Applications"
            value={(stats.applications && stats.applications.pending) || 0}
            icon={<ApplicationIcon sx={{ color: theme.palette.warning.main }} />}
            color="warning"
            increase={(stats.applications && stats.applications.increase) || 0}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Monthly Activity
            </Typography>
            <Box sx={{ height: 330 }}>
              <ResponsiveLine
                data={lineData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                }}
                curve="cardinal"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Month',
                  legendOffset: 36,
                  legendPosition: 'middle',
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Count',
                  legendOffset: -40,
                  legendPosition: 'middle',
                }}
                enableGridX={false}
                colors={{ scheme: 'category10' }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 50,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Shipment Status
            </Typography>
            <Box sx={{ height: 330 }}>
              <ResponsivePie
                data={pieData}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.2]],
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={theme.palette.text.primary}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{
                  from: 'color',
                  modifiers: [['darker', 2]],
                }}
                colors={{ datum: 'data.color' }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 30,
                    itemsSpacing: 0,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: theme.palette.text.primary,
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 12,
                    symbolShape: 'circle',
                  },
                ]}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Activity
        </Typography>
        <Box>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index, array) => (
              <React.Fragment key={activity.id}>
                <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="text.primary">
                      {activity.user}{' '}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {activity.action} a {activity.type}
                      </Typography>
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {activity.time}
                  </Typography>
                </Box>
                {index < array.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            /* Mock recent activity as fallback */
            [
              { id: 1, type: 'shipment', action: 'created', user: 'John Doe', time: '2 hours ago' },
              { id: 2, type: 'application', action: 'approved', user: 'Admin', time: '4 hours ago' },
              { id: 3, type: 'truck', action: 'updated', user: 'Jane Smith', time: '5 hours ago' },
              { id: 4, type: 'user', action: 'registered', user: 'Mike Johnson', time: '1 day ago' },
              { id: 5, type: 'shipment', action: 'delivered', user: 'System', time: '1 day ago' },
            ].map((activity, index, array) => (
              <React.Fragment key={activity.id}>
                <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="text.primary">
                      {activity.user}{' '}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {activity.action} a {activity.type}
                      </Typography>
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {activity.time}
                  </Typography>
                </Box>
                {index < array.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard; 