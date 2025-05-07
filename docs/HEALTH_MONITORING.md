# Health Monitoring System

The Delivery App includes a comprehensive health monitoring system to track the status of various system components, including the database, file storage, system resources, and external APIs.

## Health Check Endpoints

The following endpoints are available for monitoring system health:

### Basic Health Check
- **URL**: `/health`
- **Method**: GET
- **Authentication**: None
- **Description**: Simple health check that returns basic system status. This is suitable for kubernetes liveness/readiness probes, load balancers, and other infrastructure monitoring tools.
- **Response Example**:
  ```json
  {
    "status": "ok",
    "message": "Server is running",
    "timestamp": "2023-07-13T12:34:56.789Z",
    "version": "1.0.0"
  }
  ```

### System Resources Health Check
- **URL**: `/health/system`
- **Method**: GET
- **Authentication**: Admin only
- **Description**: Detailed check of system resources including CPU, memory, and process information.
- **Response Example**:
  ```json
  {
    "status": "healthy",
    "system": {
      "platform": "linux",
      "arch": "x64",
      "release": "5.15.0-1031-aws",
      "uptime": "2 hours, 45 minutes"
    },
    "cpu": {
      "model": "Intel(R) Xeon(R) CPU E5-2676 v3 @ 2.40GHz",
      "cores": 2,
      "loadAverage": [0.25, 0.3, 0.15],
      "loadPercent": "12%",
      "critical": false,
      "criticalThreshold": "90%"
    },
    "memory": {
      "total": "8.0 GB",
      "free": "4.5 GB",
      "used": "3.5 GB",
      "usagePercent": "43%",
      "critical": false,
      "criticalThreshold": "90%"
    },
    "process": {
      "pid": 12345,
      "memoryUsage": {
        "rss": "75 MB",
        "heapTotal": "50 MB",
        "heapUsed": "42 MB",
        "external": "10 MB"
      },
      "uptime": "2 hours, 43 minutes"
    }
  }
  ```

### Storage Health Check
- **URL**: `/health/storage`
- **Method**: GET
- **Authentication**: Admin only
- **Description**: Check of file system status including disk space and directory information.
- **Response Example**:
  ```json
  {
    "status": "healthy",
    "diskSpace": {
      "filesystem": "/dev/xvda1",
      "size": "50G",
      "used": "10G",
      "avail": "40G",
      "use%": "20%",
      "mounted": "/"
    },
    "directories": {
      "uploads": {
        "exists": true,
        "size": "250.45 MB"
      },
      "logs": {
        "exists": true,
        "size": "15.20 MB"
      }
    }
  }
  ```

### Database Health Check
- **URL**: `/health/database`
- **Method**: GET
- **Authentication**: Admin only
- **Description**: Check of database connection status and performance metrics.
- **Response Example**:
  ```json
  {
    "status": "healthy",
    "connection": {
      "host": "mongodb://localhost:27017",
      "name": "delivery-app",
      "readyState": 1,
      "connectionState": "connected"
    },
    "statistics": {
      "collections": 12,
      "documents": 3542,
      "dataSize": "25.73 MB",
      "storageSize": "38.42 MB",
      "indexes": 28,
      "indexSize": "12.84 MB"
    },
    "performance": {
      "slowQueries": 0,
      "connections": {
        "current": 5,
        "available": 195,
        "totalCreated": 10
      }
    },
    "indexStatus": {
      "users": {
        "indexCount": 3,
        "indexes": ["_id_", "email_1", "role_1_createdAt_-1"]
      },
      "shipments": {
        "indexCount": 5,
        "indexes": ["_id_", "status_1", "merchantId_1", "origin.country_1", "destination.country_1"]
      }
    }
  }
  ```

### Comprehensive Health Check
- **URL**: `/health/comprehensive`
- **Method**: GET
- **Authentication**: Admin only
- **Description**: Complete system status check that includes all components. This provides the most complete view of system health.
- **Response Example**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2023-07-13T12:34:56.789Z",
    "version": "1.0.0",
    "checks": {
      "system": { /* System check results */ },
      "storage": { /* Storage check results */ },
      "database": { /* Database check results */ },
      "externalApis": {
        "status": "healthy",
        "endpoints": {
          "Google Maps API": {
            "url": "https://maps.googleapis.com/maps/api/geocode/json?...",
            "status": "healthy",
            "responseCode": 200,
            "responseTime": "125ms"
          }
        }
      }
    }
  }
  ```

## Health Status Levels

The health check system uses the following status levels:

- **healthy**: All systems are operating normally.
- **degraded**: The system is operational but with some services or components impaired.
- **critical**: The system is at risk and requires immediate attention (e.g., disk space nearly full).
- **error**: The system is in an error state and may not be functioning properly.

## Configuration

Health checks can be configured using environment variables:

### Critical Thresholds
```
# Critical thresholds for health checks
HEALTH_CHECK_CRITICAL_DISK_PERCENT=95  # Disk usage percentage to consider critical
HEALTH_CHECK_CRITICAL_CPU_PERCENT=90   # CPU usage percentage to consider critical
HEALTH_CHECK_CRITICAL_MEMORY_PERCENT=90 # Memory usage percentage to consider critical
```

### External API Monitoring
```
# Format: JSON array of objects with name, url, timeout (ms), and maxResponseTime (ms) properties
EXTERNAL_API_ENDPOINTS=[{"name":"Google Maps API","url":"https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY","timeout":5000,"maxResponseTime":2000}]
```

## Integration with Monitoring Tools

The health check endpoints can be integrated with various monitoring tools:

### Kubernetes
Use the `/health` endpoint for liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Prometheus & Grafana
The health checks can be used to create custom Prometheus exporters and Grafana dashboards for monitoring system health metrics over time.

### Alert Systems
The `/health/comprehensive` endpoint can be periodically polled to check for status levels other than "healthy" and trigger alerts when issues are detected.

## Best Practices

1. **Regular Monitoring**: Set up regular polling of the health endpoints.
2. **Alerting Thresholds**: Configure alerts based on critical system metrics.
3. **Response Time Tracking**: Monitor the response time of health check endpoints as an indicator of system performance.
4. **Trend Analysis**: Collect health data over time to identify trends and potential issues before they become critical.
5. **Documentation**: Keep this documentation updated as new health check features are added. 