export const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object', additionalProperties: true },
      },
    },
  },
} as const;

export const userSchema = {
  type: 'object',
  required: ['id', 'login', 'displayName', 'email', 'avatarUrl', 'initials'],
  properties: {
    id: { type: 'string' },
    login: { type: 'string' },
    displayName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    avatarUrl: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    initials: { type: 'string' },
  },
} as const;

export const officeSchema = {
  type: 'object',
  required: ['id', 'name', 'address', 'timezone'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    address: { type: 'string' },
    timezone: { type: 'string' },
  },
} as const;

const featureSchema = {
  type: 'object',
  required: ['code', 'name'],
  properties: {
    code: { type: 'string' },
    name: { type: 'string' },
  },
} as const;

export const roomSchema = {
  type: 'object',
  required: ['id', 'officeId', 'name', 'floor', 'capacity', 'features', 'office'],
  properties: {
    id: { type: 'string' },
    officeId: { type: 'string' },
    name: { type: 'string' },
    floor: { type: 'integer' },
    capacity: { type: 'integer' },
    features: { type: 'array', items: featureSchema },
    office: officeSchema,
    available: { type: 'boolean' },
  },
} as const;

export const bookingSchema = {
  type: 'object',
  required: [
    'id',
    'roomId',
    'userId',
    'title',
    'comment',
    'startsAt',
    'endsAt',
    'createdAt',
    'room',
    'office',
    'owner',
  ],
  properties: {
    id: { type: 'string' },
    roomId: { type: 'string' },
    userId: { type: 'string' },
    title: { type: 'string' },
    comment: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    startsAt: { type: 'string', format: 'date-time' },
    endsAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    room: {
      type: 'object',
      required: ['id', 'officeId', 'name', 'floor', 'capacity', 'features'],
      properties: {
        id: { type: 'string' },
        officeId: { type: 'string' },
        name: { type: 'string' },
        floor: { type: 'integer' },
        capacity: { type: 'integer' },
        features: { type: 'array', items: featureSchema },
      },
    },
    office: officeSchema,
    owner: userSchema,
  },
} as const;

export const createBookingBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['roomId', 'title', 'startsAt', 'endsAt'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 100 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    comment: { anyOf: [{ type: 'string', maxLength: 2_000 }, { type: 'null' }] },
    startsAt: { type: 'string', format: 'date-time' },
    endsAt: { type: 'string', format: 'date-time' },
  },
} as const;

export function itemsSchema(item: object): object {
  return {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: item } },
  };
}
