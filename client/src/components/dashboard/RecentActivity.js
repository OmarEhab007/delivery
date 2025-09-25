import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';

const iconMap = {
  user: PersonIcon,
  shipment: LocalShippingIcon,
};

const RecentActivity = ({ items, emptyLabel }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {items.map((activity, index) => {
        const IconComponent = iconMap[activity.type] || NotificationsIcon;

        return (
          <React.Fragment key={activity.id || index}>
            <ListItem sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <IconComponent fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" color="text.primary">
                    {activity.user}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {activity.time}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < items.length - 1 && <Divider component="li" sx={{ mx: 0 }} />}
          </React.Fragment>
        );
      })}
    </List>
  );
};

RecentActivity.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      action: PropTypes.string,
      user: PropTypes.string,
      time: PropTypes.string,
    })
  ),
  emptyLabel: PropTypes.string,
};

RecentActivity.defaultProps = {
  items: [],
  emptyLabel: 'No recent activity recorded.',
};

export default RecentActivity;
