/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID (auto-generated)
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (hashed)
 *         phone:
 *           type: string
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [Admin, Merchant, TruckOwner, Driver]
 *           description: User's role in the system
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *         companyName:
 *           type: string
 *           description: Company name (for TruckOwner)
 *         companyAddress:
 *           type: string
 *           description: Company address (for TruckOwner)
 *         licenseNumber:
 *           type: string
 *           description: Driver's license number (for Driver)
 *         ownerId:
 *           type: string
 *           description: Reference to the TruckOwner (for Driver)
 *         driverLicense:
 *           type: object
 *           properties:
 *             documentId:
 *               type: string
 *             issueDate:
 *               type: string
 *               format: date-time
 *             expiryDate:
 *               type: string
 *               format: date-time
 *             issuedBy:
 *               type: string
 *             verified:
 *               type: boolean
 *         isAvailable:
 *           type: boolean
 *           description: Whether the driver is available for assignments
 *         driverStatus:
 *           type: string
 *           enum: [ACTIVE, OFF_DUTY, ON_BREAK, INACTIVE]
 *           description: Current driver status
 *         currentLocation:
 *           type: object
 *           properties:
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               description: [longitude, latitude]
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               documentId:
 *                 type: string
 *               name:
 *                 type: string
 *               documentType:
 *                 type: string
 *               verified:
 *                 type: boolean
 *         verificationStatus:
 *           type: string
 *           enum: [UNVERIFIED, PENDING, VERIFIED, REJECTED]
 *           description: User verification status
 *         active:
 *           type: boolean
 *           default: true
 *           description: Whether the user's account is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when user was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c85
 *         name: John Doe
 *         email: john@example.com
 *         phone: "1234567890"
 *         role: Merchant
 *         isVerified: true
 *         isActive: true
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     Truck:
 *       type: object
 *       required:
 *         - ownerId
 *         - plateNumber
 *         - model
 *         - capacity
 *         - year
 *       properties:
 *         _id:
 *           type: string
 *           description: Truck ID (auto-generated)
 *         ownerId:
 *           type: string
 *           description: Reference to the truck owner User ID
 *         driverId:
 *           type: string
 *           description: Reference to the current driver User ID
 *         plateNumber:
 *           type: string
 *           description: Truck license plate number
 *         model:
 *           type: string
 *           description: Truck model
 *         capacity:
 *           type: number
 *           description: Truck's capacity in tons
 *         year:
 *           type: number
 *           description: Manufacturing year
 *         available:
 *           type: boolean
 *           description: Whether the truck is available for assignments
 *         status:
 *           type: string
 *           enum: [AVAILABLE, IN_SERVICE, IN_MAINTENANCE, OUT_OF_SERVICE]
 *           default: AVAILABLE
 *           description: Current truck status
 *         currentFuelLevel:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Current fuel level percentage
 *         odometer:
 *           type: number
 *           description: Current odometer reading
 *         lastMaintenanceDate:
 *           type: string
 *           format: date-time
 *           description: Date of last maintenance
 *         nextMaintenanceDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date for next maintenance
 *         maintenanceHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [REGULAR, REPAIR, EMERGENCY]
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *               odometer:
 *                 type: number
 *         insuranceInfo:
 *           type: object
 *           properties:
 *             provider:
 *               type: string
 *             policyNumber:
 *               type: string
 *             expiryDate:
 *               type: string
 *               format: date-time
 *             verified:
 *               type: boolean
 *         registrationInfo:
 *           type: object
 *           properties:
 *             issuedBy:
 *               type: string
 *             registrationNumber:
 *               type: string
 *             expiryDate:
 *               type: string
 *               format: date-time
 *             verified:
 *               type: boolean
 *         dimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to truck photos
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               documentId:
 *                 type: string
 *               name:
 *                 type: string
 *               documentType:
 *                 type: string
 *               verified:
 *                 type: boolean
 *         verificationStatus:
 *           type: string
 *           enum: [UNVERIFIED, PENDING, VERIFIED, REJECTED]
 *           description: Truck verification status
 *         active:
 *           type: boolean
 *           default: true
 *           description: Whether the truck is active in the system
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when truck was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when truck was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c86
 *         ownerId: "60d21b4667d0d8992e610c85"
 *         plateNumber: "TR12345"
 *         model: "Volvo FH16"
 *         capacity: 20
 *         year: 2020
 *         status: "AVAILABLE"
 *         odometer: 50000
 *         currentFuelLevel: 75
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     Shipment:
 *       type: object
 *       required:
 *         - merchantId
 *         - origin
 *         - destination
 *         - cargoDetails
 *       properties:
 *         _id:
 *           type: string
 *           description: Shipment ID (auto-generated)
 *         merchantId:
 *           type: string
 *           description: Merchant user ID
 *         origin:
 *           type: object
 *           required:
 *             - address
 *           properties:
 *             address:
 *               type: string
 *               description: Origin address
 *             coordinates:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *             country:
 *               type: string
 *         destination:
 *           type: object
 *           required:
 *             - address
 *           properties:
 *             address:
 *               type: string
 *               description: Destination address
 *             coordinates:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *             country:
 *               type: string
 *         cargoDetails:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *             weight:
 *               type: number
 *             volume:
 *               type: number
 *             category:
 *               type: string
 *             hazardous:
 *               type: boolean
 *             specialInstructions:
 *               type: string
 *         status:
 *           type: string
 *           enum: [REQUESTED, CONFIRMED, ASSIGNED, LOADING, IN_TRANSIT, UNLOADING, AT_BORDER, DELIVERED, COMPLETED, CANCELLED, DELAYED]
 *           default: REQUESTED
 *           description: Current shipment status
 *         selectedApplicationId:
 *           type: string
 *           description: ID of the selected application for this shipment
 *         assignedTruckId:
 *           type: string
 *           description: Assigned truck ID
 *         assignedDriverId:
 *           type: string
 *           description: Assigned driver ID
 *         timeline:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                   address:
 *                     type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *         currentLocation:
 *           type: object
 *           properties:
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *             timestamp:
 *               type: string
 *               format: date-time
 *             address:
 *               type: string
 *         paymentDetails:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *             paymentReceiptUrl:
 *               type: string
 *             paymentVerified:
 *               type: boolean
 *             paymentDate:
 *               type: string
 *               format: date-time
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               documentId:
 *                 type: string
 *               name:
 *                 type: string
 *               documentType:
 *                 type: string
 *               verified:
 *                 type: boolean
 *         startOdometer:
 *           type: number
 *           description: Odometer reading at the start of delivery
 *         endOdometer:
 *           type: number
 *           description: Odometer reading at the end of delivery
 *         distanceTraveled:
 *           type: number
 *           description: Total distance traveled for this shipment
 *         recipient:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             signature:
 *               type: string
 *               description: Base64 encoded signature
 *         deliveryProofs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PHOTO, SIGNATURE, DOCUMENT, OTHER]
 *               filePath:
 *                 type: string
 *               fileName:
 *                 type: string
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *         issues:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               reportedAt:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when shipment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when shipment was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c87
 *         merchantId: "60d21b4667d0d8992e610c85"
 *         origin:
 *           address: "123 Main St, New York, NY"
 *           coordinates:
 *             lat: 40.7484
 *             lng: -73.9857
 *           country: "USA"
 *         destination:
 *           address: "456 Park Ave, Boston, MA"
 *           coordinates:
 *             lat: 42.3601
 *             lng: -71.0589
 *           country: "USA"
 *         cargoDetails:
 *           description: "Electronics"
 *           weight: 15
 *           volume: 10
 *           hazardous: false
 *         status: "REQUESTED"
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *
 *     Application:
 *       type: object
 *       required:
 *         - shipmentId
 *         - ownerId
 *         - assignedTruckId
 *         - driverId
 *         - bidDetails
 *       properties:
 *         _id:
 *           type: string
 *           description: Application ID (auto-generated)
 *         shipmentId:
 *           type: string
 *           description: Reference to the shipment
 *         ownerId:
 *           type: string
 *           description: Reference to the truck owner
 *         assignedTruckId:
 *           type: string
 *           description: Reference to the assigned truck
 *         driverId:
 *           type: string
 *           description: Reference to the assigned driver
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED]
 *           default: PENDING
 *           description: Current application status
 *         bidDetails:
 *           type: object
 *           required:
 *             - price
 *           properties:
 *             price:
 *               type: number
 *               description: Bid price
 *             currency:
 *               type: string
 *               default: USD
 *             notes:
 *               type: string
 *             validUntil:
 *               type: string
 *               format: date-time
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               documentId:
 *                 type: string
 *               name:
 *                 type: string
 *               documentType:
 *                 type: string
 *               verified:
 *                 type: boolean
 *         statusHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *               changedBy:
 *                 type: string
 *         rejectionReason:
 *           type: string
 *           description: Reason for rejection if rejected
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when application was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when application was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c88
 *         shipmentId: "60d21b4667d0d8992e610c87"
 *         ownerId: "60d21b4667d0d8992e610c89"
 *         assignedTruckId: "60d21b4667d0d8992e610c90"
 *         driverId: "60d21b4667d0d8992e610c91"
 *         status: "PENDING"
 *         bidDetails:
 *           price: 2500
 *           currency: "USD"
 *           notes: "Delivery within 3 days"
 *         createdAt: 2023-01-05T00:00:00.000Z
 *         updatedAt: 2023-01-05T00:00:00.000Z
 *
 *     Document:
 *       type: object
 *       required:
 *         - name
 *         - filePath
 *         - documentType
 *         - uploadedBy
 *         - entityType
 *         - entityId
 *       properties:
 *         _id:
 *           type: string
 *           description: Document ID (auto-generated)
 *         name:
 *           type: string
 *           description: Document name
 *         description:
 *           type: string
 *           description: Document description
 *         filePath:
 *           type: string
 *           description: Path to the stored file
 *         fileSize:
 *           type: number
 *           description: Size of the file in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         fileExtension:
 *           type: string
 *           description: File extension
 *         originalName:
 *           type: string
 *           description: Original file name
 *         documentType:
 *           type: string
 *           enum: [SHIPPING_INVOICE, BILL_OF_LADING, CUSTOMS_DECLARATION, PROOF_OF_DELIVERY, DRIVER_LICENSE, VEHICLE_REGISTRATION, INSURANCE_CERTIFICATE, HAZARDOUS_MATERIALS_CERT, PAYMENT_RECEIPT, REGISTRATION, OTHER]
 *           description: Type of document
 *         uploadedBy:
 *           type: string
 *           description: Reference to the user who uploaded the document
 *         entityType:
 *           type: string
 *           enum: [Shipment, Application, Truck, User]
 *           description: Type of entity this document belongs to
 *         entityId:
 *           type: string
 *           description: ID of the entity this document belongs to
 *         isVerified:
 *           type: boolean
 *           default: false
 *           description: Whether the document has been verified
 *         verifiedBy:
 *           type: string
 *           description: Reference to the user who verified the document
 *         verificationDate:
 *           type: string
 *           format: date-time
 *           description: Date when document was verified
 *         verificationNotes:
 *           type: string
 *           description: Notes added during verification
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Expiry date of the document if applicable
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the document is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when document was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when document was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c92
 *         name: "Driver License"
 *         filePath: "/uploads/users/driver_license_1234.pdf"
 *         fileSize: 1024000
 *         mimeType: "application/pdf"
 *         documentType: "DRIVER_LICENSE"
 *         uploadedBy: "60d21b4667d0d8992e610c91"
 *         entityType: "User"
 *         entityId: "60d21b4667d0d8992e610c91"
 *         isVerified: true
 *         verificationDate: 2023-01-10T00:00:00.000Z
 *         createdAt: 2023-01-05T00:00:00.000Z
 *         updatedAt: 2023-01-10T00:00:00.000Z
 *
 *   responses:
 *     Error:
 *       description: Error response
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 default: false
 *               message:
 *                 type: string
 *                 description: Error message
 *               error:
 *                 type: object
 *                 description: Detailed error information
 *
 *     ValidationError:
 *       description: Validation error response
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 default: false
 *               message:
 *                 type: string
 *                 description: Validation error message
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 *
 *     Unauthorized:
 *       description: Authentication error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 default: false
 *               message:
 *                 type: string
 *                 default: "Not authorized to access this resource"
 *
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 default: false
 *               message:
 *                 type: string
 *                 default: "Resource not found"
 */
