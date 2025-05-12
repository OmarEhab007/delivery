import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Paper, Typography, FormControl, 
  Select, MenuItem, InputLabel, Box, CircularProgress,
  Card, CardContent, CardHeader, Divider
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A05195', '#D45087', '#665191', '#2F4B7C'];

const ReportsDashboard = () => {
  // State for report data
  const [statusTrends, setStatusTrends] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  
  // State for filters
  const [timeframe, setTimeframe] = useState('monthly');
  const [entityType, setEntityType] = useState('driver');
  const [performanceTimeframe, setPerformanceTimeframe] = useState('allTime');
  const [customerSortBy, setCustomerSortBy] = useState('shipmentCount');
  const [geoAnalysisType, setGeoAnalysisType] = useState('originDestination');
  
  // Loading states
  const [loading, setLoading] = useState({
    statusTrends: false,
    revenue: false,
    performance: false,
    customers: false,
    efficiency: false,
    geo: false
  });

  // Error states
  const [errors, setErrors] = useState({
    statusTrends: null,
    revenue: null,
    performance: null,
    customers: null,
    efficiency: null,
    geo: null
  });

  // Fetch status trends data
  const fetchStatusTrends = async () => {
    setLoading(prev => ({ ...prev, statusTrends: true }));
    setErrors(prev => ({ ...prev, statusTrends: null }));
    
    try {
      const response = await axios.get(`/api/reports/shipments/status-trends?timeframe=${timeframe}`);
      setStatusTrends(response.data.data);
    } catch (error) {
      console.error("Error fetching status trends:", error);
      setErrors(prev => ({ 
        ...prev, 
        statusTrends: error.response?.data?.error || 'Failed to fetch status trend data' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, statusTrends: false }));
    }
  };

  // Fetch revenue data
  const fetchRevenueData = async () => {
    setLoading(prev => ({ ...prev, revenue: true }));
    setErrors(prev => ({ ...prev, revenue: null }));
    
    try {
      const response = await axios.get(`/api/reports/revenue?timeframe=${timeframe}`);
      setRevenueData(response.data.data);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setErrors(prev => ({ 
        ...prev, 
        revenue: error.response?.data?.error || 'Failed to fetch revenue data' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  };

  // Fetch performance data
  const fetchPerformanceData = async () => {
    setLoading(prev => ({ ...prev, performance: true }));
    setErrors(prev => ({ ...prev, performance: null }));
    
    try {
      const response = await axios.get(
        `/api/reports/performance?entityType=${entityType}&timeframe=${performanceTimeframe}`
      );
      setPerformanceData(response.data.data);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setErrors(prev => ({ 
        ...prev, 
        performance: error.response?.data?.error || 'Failed to fetch performance data' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, performance: false }));
    }
  };

  // Fetch customer data
  const fetchCustomerData = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    setErrors(prev => ({ ...prev, customers: null }));
    
    try {
      const response = await axios.get(`/api/reports/customers?sortBy=${customerSortBy}`);
      setCustomerData(response.data.data);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setErrors(prev => ({ 
        ...prev, 
        customers: error.response?.data?.error || 'Failed to fetch customer data' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  // Fetch efficiency data
  const fetchEfficiencyData = async () => {
    setLoading(prev => ({ ...prev, efficiency: true }));
    setErrors(prev => ({ ...prev, efficiency: null }));
    
    try {
      const response = await axios.get(`/api/reports/efficiency?timeframe=${timeframe}`);
      setEfficiencyData(response.data.data);
    } catch (error) {
      console.error("Error fetching efficiency data:", error);
      setErrors(prev => ({ 
        ...prev, 
        efficiency: error.response?.data?.error || 'Failed to fetch efficiency data' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, efficiency: false }));
    }
  };

  // Fetch geospatial data
  const fetchGeoData = async () => {
    setLoading(prev => ({ ...prev, geo: true }));
    setErrors(prev => ({ ...prev, geo: null }));
    
    try {
      const response = await axios.get(`/api/reports/geo?analysisType=${geoAnalysisType}`);
      setGeoData(response.data.data);
    } catch (error) {
      console.error("Error fetching geo data:", error);
      setErrors(prev => ({ 
        ...prev, 
        geo: error.response?.data?.error || 'Failed to fetch geospatial data' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, geo: false }));
    }
  };

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchStatusTrends();
    fetchRevenueData();
    fetchPerformanceData();
    fetchCustomerData();
    fetchEfficiencyData();
    fetchGeoData();
  }, []);

  // Effects to refetch data when filters change
  useEffect(() => {
    fetchStatusTrends();
    fetchRevenueData();
    fetchEfficiencyData();
  }, [timeframe]);

  useEffect(() => {
    fetchPerformanceData();
  }, [entityType, performanceTimeframe]);

  useEffect(() => {
    fetchCustomerData();
  }, [customerSortBy]);

  useEffect(() => {
    fetchGeoData();
  }, [geoAnalysisType]);

  // Helper function to transform status trends data for charts
  const prepareStatusTrendsData = () => {
    // Status trends data is already in the right format from the API
    return statusTrends;
  };

  // Helper to prepare data for performance chart
  const preparePerformanceData = () => {
    if (entityType === 'driver') {
      return performanceData.map(driver => ({
        name: driver.driverName,
        shipments: driver.totalShipments,
        distance: driver.totalDistance,
        rating: driver.averageRating * 20, // Scale to make it visible on chart
        onTimeRate: driver.onTimeDeliveryRate * 100
      }));
    } else {
      return performanceData.map(truck => ({
        name: truck.truckRegistration,
        shipments: truck.totalShipments,
        distance: truck.totalDistance,
        breakdownRate: truck.breakdownRate * 100
      }));
    }
  };

  // Prepare data for customer insights chart
  const prepareCustomerData = () => {
    return customerData.map(customer => ({
      name: customer.merchantName,
      shipments: customer.totalShipments,
      revenue: customer.totalRevenue,
      avgValue: customer.avgOrderValue
    }));
  };

  // Render loading spinner
  const renderLoading = () => (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      <CircularProgress />
    </Box>
  );

  // Render error message
  const renderError = (errorMsg) => (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      <Typography color="error">{errorMsg}</Typography>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Business Intelligence Dashboard
      </Typography>
      
      {/* Time period filter for trends charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              label="Time Period"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Revenue Analysis */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom component="div">
              Revenue Analysis
            </Typography>
            {loading.revenue ? (
              renderLoading()
            ) : errors.revenue ? (
              renderError(errors.revenue)
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Total Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="shipmentCount"
                    stroke="#82ca9d"
                    name="Shipment Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Shipment Status Trends */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom component="div">
              Shipment Status Trends
            </Typography>
            {loading.statusTrends ? (
              renderLoading()
            ) : errors.statusTrends ? (
              renderError(errors.statusTrends)
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareStatusTrendsData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {statusTrends.length > 0 && 
                    Object.keys(statusTrends[0]?.statuses || {}).map((status, index) => (
                      <Bar 
                        key={status}
                        dataKey={`statuses.${status}`} 
                        name={status} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))
                  }
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Performance Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              label="Entity Type"
            >
              <MenuItem value="driver">Drivers</MenuItem>
              <MenuItem value="truck">Trucks</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={performanceTimeframe}
              onChange={(e) => setPerformanceTimeframe(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="lastQuarter">Last Quarter</MenuItem>
              <MenuItem value="allTime">All Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom component="div">
              {entityType === 'driver' ? 'Driver Performance Metrics' : 'Truck Performance Metrics'}
            </Typography>
            {loading.performance ? (
              renderLoading()
            ) : errors.performance ? (
              renderError(errors.performance)
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={preparePerformanceData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="shipments" fill="#8884d8" name="Total Shipments" />
                  <Bar dataKey="distance" fill="#82ca9d" name="Distance (km)" />
                  {entityType === 'driver' ? (
                    <>
                      <Bar dataKey="rating" fill="#ffc658" name="Rating (scaled)" />
                      <Bar dataKey="onTimeRate" fill="#ff8042" name="On-Time Rate (%)" />
                    </>
                  ) : (
                    <Bar dataKey="breakdownRate" fill="#ff8042" name="Breakdown Rate (%)" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Customer Insights */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={customerSortBy}
              onChange={(e) => setCustomerSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="shipmentCount">Shipment Count</MenuItem>
              <MenuItem value="revenue">Total Revenue</MenuItem>
              <MenuItem value="avgValue">Average Order Value</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom component="div">
              Top Customer Insights
            </Typography>
            {loading.customers ? (
              renderLoading()
            ) : errors.customers ? (
              renderError(errors.customers)
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareCustomerData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="shipments" fill="#8884d8" name="Shipments" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Operational Efficiency */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom component="div">
              Operational Efficiency
            </Typography>
            {loading.efficiency ? (
              renderLoading()
            ) : errors.efficiency ? (
              renderError(errors.efficiency)
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={efficiencyData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completionRate" stroke="#82ca9d" name="Completion Rate" />
                  <Line type="monotone" dataKey="cancellationRate" stroke="#ff8042" name="Cancellation Rate" />
                  <Line type="monotone" dataKey="delayRate" stroke="#ffc658" name="Delay Rate" />
                  <Line type="monotone" dataKey="avgDeliveryTime" stroke="#8884d8" name="Avg Delivery Time (days)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Geospatial Analytics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Analysis Type</InputLabel>
            <Select
              value={geoAnalysisType}
              onChange={(e) => setGeoAnalysisType(e.target.value)}
              label="Analysis Type"
            >
              <MenuItem value="originDestination">Origin-Destination Pairs</MenuItem>
              <MenuItem value="hotspots">Shipping Hotspots</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 400,
            }}
          >
            <Typography variant="h6" gutterBottom component="div">
              Geospatial Analytics
            </Typography>
            {loading.geo ? (
              renderLoading()
            ) : errors.geo ? (
              renderError(errors.geo)
            ) : (
              <Box>
                {geoAnalysisType === 'originDestination' ? (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Top Origin-Destination Pairs
                    </Typography>
                    <Grid container spacing={2}>
                      {geoData.slice(0, 10).map((pair, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Card>
                            <CardHeader 
                              title={`${pair.origin} to ${pair.destination}`}
                              subheader={`${pair.shipmentCount} shipments`}
                            />
                            <Divider />
                            <CardContent>
                              <Typography variant="body2" color="text.secondary">
                                Total Revenue: ${pair.totalRevenue?.toFixed(2) || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Avg Travel Time: {pair.averageTravelTime?.toFixed(1) || 'N/A'} days
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" align="center" gutterBottom>
                        Top Origin Hotspots
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={geoData[0]?.originHotspots || []}
                            dataKey="count"
                            nameKey="_id"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => entry._id}
                          >
                            {(geoData[0]?.originHotspots || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" align="center" gutterBottom>
                        Top Destination Hotspots
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={geoData[0]?.destinationHotspots || []}
                            dataKey="count"
                            nameKey="_id"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => entry._id}
                          >
                            {(geoData[0]?.destinationHotspots || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportsDashboard; 