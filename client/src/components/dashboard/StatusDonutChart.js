import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

const StatusDonutChart = ({ data, emptyLabel }) => {
  const theme = useTheme();
  const palette = theme.palette;

  const colors = {
    REQUESTED: palette.info.main,
    CONFIRMED: palette.primary.main,
    ASSIGNED: palette.secondary.main,
    LOADING: palette.warning.light,
    IN_TRANSIT: palette.warning.main,
    AT_BORDER: palette.warning.dark,
    UNLOADING: palette.warning.dark,
    DELIVERED: palette.success.main,
    COMPLETED: palette.success.dark,
    DELAYED: palette.error.light,
    CANCELLED: palette.error.main,
  };

  const normalized = Array.isArray(data)
    ? data
        .filter((item) => item && typeof item.value === 'number')
        .map((item) => ({
          status: item.status,
          label: item.label,
          value: item.value,
          color: colors[item.status] || palette.grey[500],
        }))
        .filter((item) => item.value > 0)
    : [];

  const total = normalized.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return (
      <Box
        sx={{
          py: 6,
          px: 3,
          borderRadius: 3,
          border: `1px dashed ${palette.divider}`,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">{emptyLabel}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography variant="h6" fontWeight={600} color="text.primary">
          Active Shipments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({total})
        </Typography>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          height: 14,
          borderRadius: 999,
          overflow: 'hidden',
          bgcolor: alpha(palette.text.secondary, 0.08),
          display: 'flex',
        }}
      >
        {normalized.map((item) => (
          <Box
            key={item.status || item.label}
            sx={{
              flexBasis: `${(item.value / total) * 100}%`,
              bgcolor: alpha(item.color, 0.85),
            }}
          />
        ))}
      </Box>

      <Divider light sx={{ my: 1 }} />

      <Stack spacing={1.2}>
        {normalized.map((item) => (
          <Stack key={item.status || item.label} direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: item.color,
                boxShadow: `0 0 0 3px ${alpha(item.color, 0.12)}`,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                flexGrow: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.label}
            >
              {item.label}
            </Typography>
            <Typography variant="body2" color="text.primary">
              {item.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round((item.value / total) * 100)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

StatusDonutChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.string,
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  emptyLabel: PropTypes.string,
};

StatusDonutChart.defaultProps = {
  data: [],
  emptyLabel: 'No status data available yet.',
};

export default StatusDonutChart;
