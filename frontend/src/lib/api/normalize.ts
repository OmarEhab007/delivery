/**
 * API normalization helpers for populated MongoDB refs.
 */

import type { Application, Shipment, Truck, User } from '@/types/entities';

type PopulatedRef<T> = T & { _id: string };

const isPopulated = <T extends { _id?: string }>(value: unknown): value is PopulatedRef<T> => {
  return typeof value === 'object' && value !== null && '_id' in value;
};

export const normalizeShipment = (shipment: Shipment): Shipment => {
  const normalized: Shipment = { ...shipment };

  const assignedTruckValue = shipment.assignedTruckId as unknown;
  if (isPopulated<Truck>(assignedTruckValue)) {
    normalized.assignedTruck = assignedTruckValue as Truck;
    normalized.assignedTruckId = (assignedTruckValue as Truck)._id;
  }

  const assignedDriverValue = shipment.assignedDriverId as unknown;
  if (isPopulated<User>(assignedDriverValue)) {
    normalized.assignedDriver = assignedDriverValue as User;
    normalized.assignedDriverId = (assignedDriverValue as User)._id;
  }

  const merchantValue = shipment.merchantId as unknown;
  if (isPopulated<User>(merchantValue)) {
    normalized.merchant = merchantValue as User;
    normalized.merchantId = (merchantValue as User)._id;
  }

  const selectedApplicationValue = shipment.selectedApplicationId as unknown;
  if (isPopulated<Application>(selectedApplicationValue)) {
    normalized.selectedApplicationId = (selectedApplicationValue as Application)._id;
  }

  return normalized;
};

export const normalizeShipments = (shipments: Shipment[]): Shipment[] => {
  return shipments.map(normalizeShipment);
};

export const normalizeApplication = (application: Application): Application => {
  const normalized: Application = { ...application };

  const assignedTruckValue = application.assignedTruckId as unknown;
  if (isPopulated<Truck>(assignedTruckValue)) {
    normalized.assignedTruck = assignedTruckValue as Truck;
    normalized.assignedTruckId = (assignedTruckValue as Truck)._id;
  }

  const driverValue = application.driverId as unknown;
  if (isPopulated<User>(driverValue)) {
    normalized.driver = driverValue as User;
    normalized.driverId = (driverValue as User)._id;
  }

  const ownerValue = application.ownerId as unknown;
  if (isPopulated<User>(ownerValue)) {
    normalized.owner = ownerValue as User;
    normalized.ownerId = (ownerValue as User)._id;
  }

  const shipmentValue = application.shipmentId as unknown;
  if (isPopulated<Shipment>(shipmentValue)) {
    normalized.shipment = shipmentValue as Shipment;
    normalized.shipmentId = (shipmentValue as Shipment)._id;
  }

  return normalized;
};

export const normalizeApplications = (applications: Application[]): Application[] => {
  return applications.map(normalizeApplication);
};

export const normalizeTruck = (truck: Truck): Truck => {
  const normalized: Truck = { ...truck };

  const ownerValue = truck.ownerId as unknown;
  if (isPopulated<User>(ownerValue)) {
    normalized.owner = ownerValue as User;
    normalized.ownerId = (ownerValue as User)._id;
  }

  const driverValue = truck.driverId as unknown;
  if (isPopulated<User>(driverValue)) {
    normalized.driver = driverValue as User;
    normalized.driverId = (driverValue as User)._id;
  }

  return normalized;
};

export const normalizeTrucks = (trucks: Truck[]): Truck[] => {
  return trucks.map(normalizeTruck);
};

