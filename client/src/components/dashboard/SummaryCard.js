import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography, Avatar, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const SummaryCard = ({ title, value, delta, icon, accentColor, meta, footer }) => {
  const numberFormatter = new Intl.NumberFormat();
  const deltaIsPositive = delta >= 0;
  const DeltaIcon = deltaIsPositive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.common.black, 0.06)}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 52,
              height: 52,
              bgcolor: (theme) => alpha(accentColor || theme.palette.primary.main, 0.12),
              color: accentColor,
            }}
          >
            {icon}
          </Avatar>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              {numberFormatter.format(value ?? 0)}
            </Typography>
          </Stack>
        </Stack>

        {delta !== null && delta !== undefined && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: footer || meta ? 2 : 0 }}
          >
            <Chip
              size="small"
              icon={<DeltaIcon fontSize="inherit" />}
              label={`${deltaIsPositive ? '+' : ''}${delta}%`}
              sx={{
                fontWeight: 600,
                color: deltaIsPositive ? 'success.dark' : 'error.dark',
                bgcolor: (theme) =>
                  alpha(
                    deltaIsPositive ? theme.palette.success.main : theme.palette.error.main,
                    0.12
                  ),
              }}
            />
            <Typography variant="caption" color="text.secondary">
              vs previous month
            </Typography>
          </Stack>
        )}

        {meta && (
          <Stack spacing={0.5} sx={{ mb: footer ? 2 : 0 }}>
            {meta.map((item) => (
              <Stack direction="row" justifyContent="space-between" key={item.label}>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="caption" fontWeight={600} color="text.primary">
                  {item.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {footer && (
          <Typography variant="caption" color="text.secondary">
            {footer}
          </Typography>
        )}
      </CardContent>

      <CardContent
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: 0.35,
          bgcolor: (theme) => alpha(accentColor || theme.palette.primary.main, 0.04),
        }}
      />
    </Card>
  );
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number,
  delta: PropTypes.number,
  icon: PropTypes.node.isRequired,
  accentColor: PropTypes.string,
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  footer: PropTypes.string,
};

SummaryCard.defaultProps = {
  value: 0,
  delta: null,
  accentColor: undefined,
  meta: undefined,
  footer: undefined,
};

export default SummaryCard;
