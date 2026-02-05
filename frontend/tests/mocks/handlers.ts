/**
 * MSW v2 Mock Handlers for API endpoints
 */

import { http, HttpResponse } from 'msw';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-token',
        user: {
          _id: 'user1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'Merchant',
          phone: '+1234567890',
          approvalStatus: 'APPROVED',
          active: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });
  }),

  http.get(`${API_BASE}/auth/csrf-token`, () => {
    return HttpResponse.json({
      csrfToken: 'mock-csrf',
    });
  }),

  // Shipments endpoints
  http.get(`${API_BASE}/shipments`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'ship1',
          merchantId: 'user1',
          status: 'DRAFT',
          pricingType: 'BIDDING',
          origin: {
            address: 'Riyadh, Saudi Arabia',
            city: 'Riyadh',
            country: 'Saudi Arabia',
          },
          destination: {
            address: 'Jeddah, Saudi Arabia',
            city: 'Jeddah',
            country: 'Saudi Arabia',
          },
          cargoDetails: {
            description: 'Test cargo',
            weight: 1000,
            hazardous: false,
          },
          approval: {
            state: 'PENDING',
            submittedBy: 'user1',
            submittedAt: '2024-01-01T00:00:00.000Z',
          },
          compliance: {
            status: 'PENDING',
            documents: {},
            gaftaRequested: false,
            insuranceRequired: false,
            saberStatus: 'NOT_APPLICABLE',
          },
          trackingHistory: [],
          timeline: [],
          deliveryProofs: [],
          issues: [],
          documents: [],
          active: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 1,
        limit: 10,
      },
    });
  }),

  http.get(`${API_BASE}/shipments/:id`, ({ params }: { params: Record<string, string> }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        _id: id,
        merchantId: 'user1',
        status: 'DRAFT',
        pricingType: 'BIDDING',
        origin: {
          address: 'Riyadh, Saudi Arabia',
          city: 'Riyadh',
          country: 'Saudi Arabia',
        },
        destination: {
          address: 'Jeddah, Saudi Arabia',
          city: 'Jeddah',
          country: 'Saudi Arabia',
        },
        cargoDetails: {
          description: 'Test cargo',
          weight: 1000,
          hazardous: false,
        },
        approval: {
          state: 'PENDING',
          submittedBy: 'user1',
          submittedAt: '2024-01-01T00:00:00.000Z',
        },
        compliance: {
          status: 'PENDING',
          documents: {},
          gaftaRequested: false,
          insuranceRequired: false,
          saberStatus: 'NOT_APPLICABLE',
        },
        trackingHistory: [],
        timeline: [],
        deliveryProofs: [],
        issues: [],
        documents: [],
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
  }),

  // Applications endpoints
  http.get(`${API_BASE}/applications`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'app1',
          shipmentId: 'ship1',
          ownerId: 'owner1',
          assignedTruckId: 'truck1',
          driverId: 'driver1',
          status: 'PENDING',
          bidDetails: {
            price: 5000,
            currency: 'USD',
            notes: 'Test bid',
          },
          documents: [],
          statusHistory: [
            {
              status: 'PENDING',
              timestamp: '2024-01-01T00:00:00.000Z',
            },
          ],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 1,
        limit: 10,
      },
    });
  }),

  // Trucks endpoints
  http.get(`${API_BASE}/trucks`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: 'truck1',
          ownerId: 'owner1',
          plateNumber: 'ABC-123',
          model: 'Volvo FH16',
          capacity: 25,
          year: 2022,
          available: true,
          status: 'AVAILABLE',
          currentFuelLevel: 75,
          odometer: 50000,
          maintenanceHistory: [],
          insuranceInfo: {
            verified: false,
          },
          registrationInfo: {
            verified: false,
          },
          technicalInspection: {
            status: 'PENDING',
            verified: false,
          },
          features: ['GPS', 'Refrigerated'],
          photos: [],
          documents: [],
          verificationStatus: 'PENDING',
          active: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 1,
        limit: 10,
      },
    });
  }),

  // Admin endpoints
  http.get(`${API_BASE}/admin/users`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        users: [
          {
            _id: 'user1',
            name: 'Test User',
            email: 'test@test.com',
            role: 'Merchant',
            phone: '+1234567890',
            approvalStatus: 'APPROVED',
            active: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            _id: 'user2',
            name: 'Truck Owner',
            email: 'owner@test.com',
            role: 'TruckOwner',
            phone: '+1234567891',
            approvalStatus: 'PENDING',
            active: true,
            companyName: 'Test Logistics',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          totalPages: 1,
          total: 2,
          limit: 10,
        },
      },
    });
  }),
];
