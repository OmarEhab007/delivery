/**
 * Unit tests for Zod validation schemas
 */

import {
  loginSchema,
  registerSchema,
  createShipmentSchema,
  brokerFormSchema,
  automationRuleFormSchema,
  webhookFormSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongP@ss123!',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should fail when email is missing', () => {
      const invalidData = {
        password: 'StrongP@ss123!',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should fail when email is invalid', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'StrongP@ss123!',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
        expect(result.error.issues[0].message).toContain('بريد إلكتروني صحيح');
      }
    });

    it('should fail when password is too short', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Short1!',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
        expect(result.error.issues[0].message).toContain('12 حرفاً');
      }
    });

    it('should fail when password is missing', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongP@ss123!',
        phone: '12345678',
        role: 'Merchant' as const,
        companyName: 'Test Company',
        companyAddress: '123 Test St',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should fail when name is too short', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'StrongP@ss123!',
        phone: '12345678',
        role: 'Merchant',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail when role is invalid', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongP@ss123!',
        phone: '12345678',
        role: 'InvalidRole',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role');
      }
    });

    it('should fail when phone is too short', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongP@ss123!',
        phone: '123',
        role: 'Merchant',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('phone');
      }
    });

    it('should allow optional fields', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongP@ss123!',
        phone: '12345678',
        role: 'Merchant' as const,
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('createShipmentSchema', () => {
    it('should validate valid shipment data', () => {
      const validData = {
        pricingType: 'BIDDING' as const,
        origin: {
          address: '123 Main St, City',
        },
        destination: {
          address: '456 Oak Ave, Town',
        },
        cargoDetails: {
          description: 'Test cargo',
          weight: 1000,
          hazardous: false,
        },
      };

      const result = createShipmentSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pricingType).toBe('BIDDING');
      }
    });

    it('should fail when origin address is too short', () => {
      const invalidData = {
        pricingType: 'BIDDING',
        origin: {
          address: '123',
        },
        destination: {
          address: '456 Oak Ave, Town',
        },
        cargoDetails: {
          description: 'Test cargo',
          weight: 1000,
          hazardous: false,
        },
      };

      const result = createShipmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('origin');
      }
    });

    it('should fail when cargo weight is not positive', () => {
      const invalidData = {
        pricingType: 'BIDDING',
        origin: {
          address: '123 Main St, City',
        },
        destination: {
          address: '456 Oak Ave, Town',
        },
        cargoDetails: {
          description: 'Test cargo',
          weight: -100,
          hazardous: false,
        },
      };

      const result = createShipmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('weight');
      }
    });

    it('should fail when cargo description is too short', () => {
      const invalidData = {
        pricingType: 'BIDDING',
        origin: {
          address: '123 Main St, City',
        },
        destination: {
          address: '456 Oak Ave, Town',
        },
        cargoDetails: {
          description: 'Ab',
          weight: 1000,
          hazardous: false,
        },
      };

      const result = createShipmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should validate FIXED_PRICE with fixedPriceDetails', () => {
      const validData = {
        pricingType: 'FIXED_PRICE' as const,
        fixedPriceDetails: {
          amount: 5000,
          currency: 'USD',
          autoAssign: false,
        },
        origin: {
          address: '123 Main St, City',
        },
        destination: {
          address: '456 Oak Ave, Town',
        },
        cargoDetails: {
          description: 'Test cargo',
          weight: 1000,
          hazardous: false,
        },
      };

      const result = createShipmentSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('brokerFormSchema', () => {
    it('should validate valid broker data', () => {
      const validData = {
        name: 'Test Broker',
        licenseNumber: 'LIC-12345',
        countriesServed: ['USA', 'Canada'],
        contacts: {
          email: 'broker@example.com',
          phone: '+1234567890',
        },
        notes: 'Test notes',
      };

      const result = brokerFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should fail when name is missing', () => {
      const invalidData = {
        licenseNumber: 'LIC-12345',
      };

      const result = brokerFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail when license number is too short', () => {
      const invalidData = {
        name: 'Test Broker',
        licenseNumber: 'L',
      };

      const result = brokerFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('licenseNumber');
      }
    });

    it('should fail when email is invalid', () => {
      const invalidData = {
        name: 'Test Broker',
        licenseNumber: 'LIC-12345',
        contacts: {
          email: 'not-an-email',
        },
      };

      const result = brokerFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should allow empty email string', () => {
      const validData = {
        name: 'Test Broker',
        licenseNumber: 'LIC-12345',
        contacts: {
          email: '',
          phone: '',
        },
      };

      const result = brokerFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should set default values for optional fields', () => {
      const validData = {
        name: 'Test Broker',
        licenseNumber: 'LIC-12345',
      };

      const result = brokerFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.countriesServed).toEqual([]);
        expect(result.data.contacts).toEqual({ email: '', phone: '' });
      }
    });
  });

  describe('automationRuleFormSchema', () => {
    it('should validate valid automation rule data', () => {
      const validData = {
        name: 'Delay Alert',
        triggerType: 'delay' as const,
        threshold: 24,
        thresholdUnit: 'hours' as const,
        action: 'notify' as const,
      };

      const result = automationRuleFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should fail when name is too short', () => {
      const invalidData = {
        name: 'A',
        triggerType: 'delay',
        threshold: 24,
        thresholdUnit: 'hours',
        action: 'notify',
      };

      const result = automationRuleFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should fail when triggerType is invalid', () => {
      const invalidData = {
        name: 'Test Rule',
        triggerType: 'invalid-trigger',
        threshold: 24,
        thresholdUnit: 'hours',
        action: 'notify',
      };

      const result = automationRuleFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('triggerType');
      }
    });

    it('should fail when threshold is not positive', () => {
      const invalidData = {
        name: 'Test Rule',
        triggerType: 'delay',
        threshold: -5,
        thresholdUnit: 'hours',
        action: 'notify',
      };

      const result = automationRuleFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('threshold');
      }
    });

    it('should fail when action is invalid', () => {
      const invalidData = {
        name: 'Test Rule',
        triggerType: 'delay',
        threshold: 24,
        thresholdUnit: 'hours',
        action: 'invalid-action',
      };

      const result = automationRuleFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('action');
      }
    });

    it('should validate missing-update trigger type', () => {
      const validData = {
        name: 'Missing Update Alert',
        triggerType: 'missing-update' as const,
        threshold: 48,
        thresholdUnit: 'hours' as const,
        action: 'escalate' as const,
      };

      const result = automationRuleFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('webhookFormSchema', () => {
    it('should validate valid webhook data', () => {
      const validData = {
        endpointUrl: 'https://example.com/webhook',
        eventTypes: ['shipment.created', 'shipment.delivered'],
      };

      const result = webhookFormSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should fail when endpointUrl is not a valid URL', () => {
      const invalidData = {
        endpointUrl: 'not-a-url',
        eventTypes: ['shipment.created'],
      };

      const result = webhookFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('endpointUrl');
        expect(result.error.issues[0].message).toContain('valid URL');
      }
    });

    it('should fail when eventTypes is empty', () => {
      const invalidData = {
        endpointUrl: 'https://example.com/webhook',
        eventTypes: [],
      };

      const result = webhookFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('eventTypes');
        expect(result.error.issues[0].message).toContain('at least one');
      }
    });

    it('should fail when eventTypes is missing', () => {
      const invalidData = {
        endpointUrl: 'https://example.com/webhook',
      };

      const result = webhookFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('eventTypes');
      }
    });

    it('should fail when endpointUrl is missing', () => {
      const invalidData = {
        eventTypes: ['shipment.created'],
      };

      const result = webhookFormSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('endpointUrl');
      }
    });
  });

  describe('Password Schema Validation (Hardened)', () => {
    it('should reject passwords shorter than 12 characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Aa1!short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ');
        expect(messages).toContain('12 حرفاً');
      }
    });

    it('should reject passwords missing uppercase letters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'nouppercase1!@#',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ');
        expect(messages).toContain('حرف كبير');
      }
    });

    it('should reject passwords missing lowercase letters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'NOLOWERCASE1!@#',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ');
        expect(messages).toContain('حرف صغير');
      }
    });

    it('should reject passwords missing digits', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'NoDigitsHere!@#',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ');
        expect(messages).toContain('رقم واحد');
      }
    });

    it('should reject passwords missing special characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'NoSpecialChar12',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ');
        expect(messages).toContain('رمز خاص');
      }
    });

    it('should accept fully compliant passwords', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongP@ss123!',
      });

      expect(result.success).toBe(true);
    });

    it('should enforce same rules on registerSchema', () => {
      const weakResult = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        phone: '12345678',
        role: 'Merchant',
      });
      expect(weakResult.success).toBe(false);

      const strongResult = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongP@ss123!',
        phone: '12345678',
        role: 'Merchant',
      });
      expect(strongResult.success).toBe(true);
    });
  });
});
