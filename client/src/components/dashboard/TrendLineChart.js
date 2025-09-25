import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';

const TrendLineChart = ({ data, emptyLabel }) => {
  const hasData = Array.isArray(data) && data.some((series) => series.data.length > 0);

  if (!hasData) {
    return (
      <Box
        sx={{
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: (theme) => `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 320 }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
        xScale={{
          type: 'point',
        }}
        yScale={{ type: 'linear', min: 0, stacked: false }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 12,
        }}
        colors={{ scheme: 'category10' }}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        enableSlices="x"
        sliceTooltip={({ slice }) => (
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              px: 1.5,
              py: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {slice.points[0].data.xFormatted}
            </Typography>
            {slice.points.map((point) => (
              <Typography key={point.id} variant="body2" color="text.secondary">
                {point.serieId}: <strong>{point.data.yFormatted}</strong>
              </Typography>
            ))}
          </Box>
        )}
        useMesh
        theme={{
          tooltip: {
            container: {
              fontSize: 12,
            },
          },
          axis: {
            ticks: {
              text: {
                fill: '#6b7280',
              },
            },
          },
          legends: {
            text: {
              fill: '#4b5563',
            },
          },
        }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 50,
            itemWidth: 100,
            itemHeight: 20,
            itemTextColor: '#6b7280',
            symbolSize: 10,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#111827',
                },
              },
            ],
          },
        ]}
      />
    </Box>
  );
};

TrendLineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      data: PropTypes.arrayOf(
        PropTypes.shape({
          x: PropTypes.string.isRequired,
          y: PropTypes.number.isRequired,
        })
      ).isRequired,
    })
  ),
  emptyLabel: PropTypes.string,
};

TrendLineChart.defaultProps = {
  data: [],
  emptyLabel: 'No trend data available yet.',
};

export default TrendLineChart;
