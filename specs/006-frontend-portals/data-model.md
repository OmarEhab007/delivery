# Data Model: Frontend Portals

This document captures the UI-facing data shapes used by the Next.js frontend. These map to backend DTOs but are simplified to what the UI needs.

## Session

- `accessToken`: string
- `refreshToken`: string
- `expiresIn`: string
- `refreshExpiresIn`: string
- `user`: UserProfile

## UserProfile

- `id`: string
- `name`: string
- `email`: string
- `phone`: string
- `role`: "Admin" | "Merchant" | "TruckOwner" | "Driver"
- `active`: boolean
- `companyName?`: string (TruckOwner)
- `companyAddress?`: string (TruckOwner)
- `ownerId?`: string (Driver)
- `licenseNumber?`: string (Driver)
- `adminPermissions?`: string[] (Admin)

## Shipment

- `id`: string
- `reference`: string
- `status`: string
- `origin`: { city: string; country: string }
- `destination`: { city: string; country: string }
- `pickupDate`: string
- `deliveryDate?`: string
- `price?`: { amount: number; currency: string }
- `assignedTruck?`: string
- `assignedDriver?`: string
- `documents`: Document[]
- `timeline`: TimelineEvent[]

## Application (Bid)

- `id`: string
- `shipmentId`: string
- `truckId`: string
- `driverId`: string
- `price`: { amount: number; currency: string }
- `status`: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED"
- `notes?`: string
- `validUntil?`: string

## Truck

- `id`: string
- `plateNumber`: string
- `type`: string
- `capacity`: string
- `availability`: "AVAILABLE" | "IN_TRANSIT" | "MAINTENANCE"
- `documents`: Document[]

## Driver

- `id`: string
- `name`: string
- `phone`: string
- `availability`: "AVAILABLE" | "ASSIGNED" | "OFFLINE"
- `currentLocation?`: TrackingUpdate

## Document

- `id`: string
- `filename`: string
- `type`: string
- `status`: "PENDING" | "VERIFIED" | "REJECTED"
- `uploadedAt`: string
- `entityType`: "Shipment" | "Truck" | "User" | "Application"
- `entityId`: string

## TrackingUpdate

- `lat`: number
- `lng`: number
- `timestamp`: string
- `eta?`: string
- `notes?`: string

## TimelineEvent

- `status`: string
- `timestamp`: string
- `notes?`: string
- `location?`: { lat: number; lng: number }
