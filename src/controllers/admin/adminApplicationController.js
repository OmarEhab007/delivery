const { Application, ApplicationStatus } = require('../../models/Application');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

/**
 * Get all applications with filtering and pagination
 * @route GET /api/admin/applications
 * @access Private (Admin only)
 */
const getAllApplications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter object from query params
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.truckOwnerId) filter.truckOwnerId = req.query.truckOwnerId;
  if (req.query.assignedTruckId) filter.assignedTruckId = req.query.assignedTruckId;

  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
  }

  const applications = await Application.find(filter)
    .populate('truckOwnerId', 'name email phone companyName')
    .populate('assignedTruckId')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Application.countDocuments(filter);

  return ApiSuccess(res, {
    applications,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

/**
 * Get application by ID
 * @route GET /api/admin/applications/:id
 * @access Private (Admin only)
 */
const getApplicationById = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('truckOwnerId', 'name email phone companyName companyAddress')
    .populate('assignedTruckId');

  if (!application) {
    return next(new ApiError('Application not found', 404));
  }

  return ApiSuccess(res, { application });
});

/**
 * Update application status
 * @route PATCH /api/admin/applications/:id/status
 * @access Private (Admin only)
 */
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, adminNotes } = req.body;

  if (!status) {
    return next(new ApiError('Status is required', 400));
  }

  const validStatuses = Object.values(ApplicationStatus);
  if (!validStatuses.includes(status)) {
    return next(new ApiError('Invalid status', 400));
  }

  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ApiError('Application not found', 404));
  }

  // Update status and admin notes
  application.status = status;
  if (adminNotes) application.adminNotes = adminNotes;

  // Add status history
  application.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy: req.user._id,
    notes: adminNotes,
  });

  await application.save();

  return ApiSuccess(res, {
    message: 'Application status updated successfully',
    application,
  });
});

/**
 * Delete application
 * @route DELETE /api/admin/applications/:id
 * @access Private (Admin only)
 */
const deleteApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ApiError('Application not found', 404));
  }

  await application.deleteOne();

  return ApiSuccess(res, { message: 'Application deleted successfully' });
});

/**
 * Get application statistics
 * @route GET /api/admin/applications/stats
 * @access Private (Admin only)
 */
const getApplicationStats = asyncHandler(async (req, res, next) => {
  // Get counts by status
  const totalApplications = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({
    status: ApplicationStatus.PENDING,
  });
  const approvedApplications = await Application.countDocuments({
    status: ApplicationStatus.ACCEPTED,
  });
  const rejectedApplications = await Application.countDocuments({
    status: ApplicationStatus.REJECTED,
  });

  // Get applications by date (last 7 days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const recentApplications = await Application.find({
    createdAt: { $gte: last7Days },
  })
    .sort({ createdAt: -1 })
    .populate('truckOwnerId', 'name email')
    .populate('assignedTruckId');

  return ApiSuccess(res, {
    counts: {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
    },
    recent: recentApplications,
  });
});

module.exports = {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
};
