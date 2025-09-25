import React from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, Paper, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

const PageHeader = ({ title, subtitle, actions, stats }) => {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Stack>

      {Array.isArray(stats) && stats.length > 0 && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {stats.map((stat) => (
            <Paper
              key={stat.label}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 3,
                boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.common.black, 0.05)}`,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {stat.label}
              </Typography>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {stat.value}
              </Typography>
              {stat.caption && (
                <Typography variant="caption" color="text.secondary">
                  {stat.caption}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      caption: PropTypes.string,
    })
  ),
};

PageHeader.defaultProps = {
  subtitle: null,
  actions: null,
  stats: null,
};

export default PageHeader;
