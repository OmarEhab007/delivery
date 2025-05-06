# Document Management System User Guide

This guide explains how to use the document management system for the Delivery App.

## Table of Contents
1. [Overview](#overview)
2. [Document Types](#document-types)
3. [Entity Types](#entity-types)
4. [Uploading Documents](#uploading-documents)
5. [Retrieving Documents](#retrieving-documents)
6. [Document Verification](#document-verification)
7. [API Endpoints](#api-endpoints)
8. [Examples](#examples)

## Overview

The Document Management System allows you to:
- Upload and store documents securely on your own servers
- Link documents to different entities (Shipments, Applications, Trucks, Users)
- Verify documents for regulatory compliance
- Manage document metadata and track expirations
- Set required documents for specific entities
- Download and view previously uploaded documents

## Document Types

The system supports the following document types:

| Document Type | Description | Typical Entity |
|---------------|-------------|----------------|
| SHIPPING_INVOICE | Invoice for a shipment | Shipment |
| BILL_OF_LADING | Transport document for cargo | Shipment |
| CUSTOMS_DECLARATION | Customs forms for international shipping | Shipment |
| PROOF_OF_DELIVERY | Signed delivery confirmation | Shipment |
| DRIVER_LICENSE | Driver's license document | User (Driver) |
| VEHICLE_REGISTRATION | Vehicle registration certificate | Truck |
| INSURANCE_CERTIFICATE | Insurance policy document | Truck/User |
| HAZARDOUS_MATERIALS_CERT | Hazardous materials handling certification | User/Shipment |
| PAYMENT_RECEIPT | Payment confirmation | Shipment/Application |
| OTHER | Any other document type | Any |

## Entity Types

Documents can be linked to the following entity types:

- **Shipment**: Shipping documents, invoices, customs forms, etc.
- **Application**: Bid-related documents, qualifications, etc.
- **Truck**: Vehicle registration, inspection certificates, insurance, etc.
- **User**: Personal documents, licenses, certifications, etc.

## Uploading Documents

### Single Document Upload

To upload a single document:

1. Use the `POST /api/documents/upload` endpoint
2. Include the document file in the request (multipart/form-data)
3. Specify the following parameters:
   - `document`: The file to upload
   - `entityType`: The type of entity (Shipment, Application, Truck, User)
   - `entityId`: The MongoDB ID of the specific entity
   - `documentType`: The type of document (from the supported types)
   - `name`: A descriptive name for the document
   - `description`: (Optional) Additional details about the document
   - `expiryDate`: (Optional) When the document expires (YYYY-MM-DD format)
   - `metadata`: (Optional) JSON string with additional metadata

### Multiple Document Upload

To upload multiple documents to the same entity:

1. Use the `POST /api/documents/upload-multiple` endpoint
2. Include multiple files using the same form field name 'documents'
3. Specify the entity information (entityType and entityId)
4. For each file, include a metadata field in the format `fileData_FILENAME` 
   where FILENAME matches the exact name of the uploaded file

## Retrieving Documents

### Get Documents for an Entity

To retrieve all documents for a specific entity:

```
GET /api/documents/entity/{entityType}/{entityId}
```

For example:
```
GET /api/documents/entity/Shipment/60d5ec9af682d43b4cd4a111
```

### Get Document by ID

To retrieve a specific document's metadata:

```
GET /api/documents/{documentId}
```

### Download Document File

To download the actual document file:

```
GET /api/documents/{documentId}/download
```

## Document Verification

Documents can be verified by admin or manager users:

1. Use the `PATCH /api/documents/{documentId}/verify` endpoint
2. Include optional verification notes in the request body

When a document is verified:
- The document's `isVerified` flag is set to true
- The verification date and verifier are recorded
- The referring entity's document entry is also updated as verified
- For certain document types (like driver licenses), the verification updates specific entity fields

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload a single document |
| `/api/documents/upload-multiple` | POST | Upload multiple documents |
| `/api/documents/{id}` | GET | Get document metadata |
| `/api/documents/{id}/download` | GET | Download document file |
| `/api/documents/entity/{entityType}/{entityId}` | GET | Get all documents for an entity |
| `/api/documents/{id}` | DELETE | Delete a document |
| `/api/documents/{id}/verify` | PATCH | Verify a document |
| `/api/documents/{id}` | PATCH | Update document metadata |

## Examples

### Example 1: Upload Driver License

```
POST /api/documents/upload
Content-Type: multipart/form-data

document: [file]
entityType: User
entityId: 60d5ec9af682d43b4cd4a222
documentType: DRIVER_LICENSE
name: Driver License
expiryDate: 2025-06-30
metadata: {"licenseNumber":"DL12345678","issueDate":"2020-06-30"}
```

### Example 2: Upload Multiple Shipment Documents

```
POST /api/documents/upload-multiple
Content-Type: multipart/form-data

documents: [file1]
documents: [file2]
entityType: Shipment
entityId: 60d5ec9af682d43b4cd4a111
fileData_invoice.pdf: {"name":"Shipping Invoice","documentType":"SHIPPING_INVOICE"}
fileData_customs.pdf: {"name":"Customs Declaration","documentType":"CUSTOMS_DECLARATION"}
```

### Example 3: Get All Documents for a Truck

```
GET /api/documents/entity/Truck/60d5ec9af682d43b4cd4a333
```

### Example 4: Verify a Document

```
PATCH /api/documents/60d5ec9af682d43b4cd4a444/verify
Content-Type: application/json

{
  "notes": "Document verified and meets all requirements."
}
```

## Required Documents

Some entities may have required documents. The system tracks which required documents have been provided. You can check the `requiredDocuments` field on entities to see which documents are missing.

When you upload a document that matches a required document type, the system automatically marks it as provided in the entity's `requiredDocuments` array.

## Document Storage

All documents are stored securely on your own servers in the following structure:

```
uploads/
  ├── shipments/
  │   └── {shipmentId}/
  │       ├── {filename1}
  │       └── {filename2}
  ├── applications/
  │   └── {applicationId}/
  │       └── {filename}
  ├── trucks/
  │   └── {truckId}/
  │       └── {filename}
  └── users/
      └── {userId}/
          └── {filename}
```

The system generates secure filenames to prevent conflicts and ensure security. 