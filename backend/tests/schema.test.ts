import { Prisma, PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type PrismaModel = (typeof Prisma.dmmf.datamodel.models)[number]
type PrismaField = PrismaModel['fields'][number]

const models = Prisma.dmmf.datamodel.models
const enums = Prisma.dmmf.datamodel.enums

const getModel = (name: string): PrismaModel => {
  const model = models.find((candidate) => candidate.name === name)

  if (!model) {
    throw new Error(`Expected Prisma model "${name}" to exist`)
  }

  return model
}

const getField = (modelName: string, fieldName: string): PrismaField => {
  const field = getModel(modelName).fields.find((candidate) => candidate.name === fieldName)

  if (!field) {
    throw new Error(`Expected Prisma field "${modelName}.${fieldName}" to exist`)
  }

  return field
}

const enumValues = (name: string) => {
  const prismaEnum = enums.find((candidate) => candidate.name === name)

  if (!prismaEnum) {
    throw new Error(`Expected Prisma enum "${name}" to exist`)
  }

  return prismaEnum.values.map((value) => value.name)
}

const expectAutoincrementId = (modelName: string) => {
  expect(getField(modelName, 'id')).toMatchObject({
    kind: 'scalar',
    type: 'Int',
    isRequired: true,
    isId: true,
    hasDefaultValue: true,
    default: { name: 'autoincrement', args: [] },
  })
}

const expectNowDefault = (modelName: string, fieldName: string) => {
  expect(getField(modelName, fieldName)).toMatchObject({
    kind: 'scalar',
    type: 'DateTime',
    isRequired: true,
    hasDefaultValue: true,
    default: { name: 'now', args: [] },
    nativeType: ['Timestamptz', ['6']],
  })
}

const expectVarChar = (
  modelName: string,
  fieldName: string,
  length: string,
  options: Partial<Pick<PrismaField, 'isRequired' | 'isUnique'>> = {}
) => {
  expect(getField(modelName, fieldName)).toMatchObject({
    kind: 'scalar',
    type: 'String',
    nativeType: ['VarChar', [length]],
    ...options,
  })
}

const expectDecimal = (
  modelName: string,
  fieldName: string,
  options: Partial<Pick<PrismaField, 'isRequired'>> = {}
) => {
  expect(getField(modelName, fieldName)).toMatchObject({
    kind: 'scalar',
    type: 'Decimal',
    nativeType: ['Decimal', ['9', '6']],
    ...options,
  })
}

const expectCascadeRelation = (
  modelName: string,
  fieldName: string,
  relatedModel: string,
  fromFields: string[],
  toFields: string[] = ['id']
) => {
  expect(getField(modelName, fieldName)).toMatchObject({
    kind: 'object',
    type: relatedModel,
    isRequired: true,
    relationFromFields: fromFields,
    relationToFields: toFields,
    relationOnDelete: 'Cascade',
    relationOnUpdate: 'NoAction',
  })
}

const expectUniqueFields = (modelName: string, fields: string[]) => {
  expect(getModel(modelName).uniqueFields).toContainEqual(fields)
}

describe('Prisma schema contract', () => {
  it('exposes the expected application models and enums', () => {
    expect(models.map((model) => model.name).sort()).toEqual([
      'awarded_badge',
      'badge',
      'badge_criteria',
      'challenge',
      'challenge_category',
      'location',
      'user_challenge',
      'user_stat',
      'users',
    ])

    expect(enumValues('challenge_status')).toEqual([
      'in_progress',
      'accepted',
      'cancelled',
      'skipped',
      'completed',
      'expired',
    ])
    expect(enumValues('user_role')).toEqual(['user', 'admin'])
  })

  it('keeps user identity fields unique and progression fields defaulted', () => {
    expectAutoincrementId('users')
    expectVarChar('users', 'auth_id', '500', { isRequired: true, isUnique: true })
    expectVarChar('users', 'username', '100', { isRequired: true, isUnique: true })
    expectVarChar('users', 'email', '250', { isRequired: true, isUnique: true })
    expect(getField('users', 'user_role')).toMatchObject({
      kind: 'enum',
      type: 'user_role',
      isRequired: true,
    })
    expectNowDefault('users', 'created_at')
    expectNowDefault('users', 'updated_at')
    expect(getField('users', 'level')).toMatchObject({ type: 'Int', isRequired: true, default: 1 })
    expect(getField('users', 'xp_earned')).toMatchObject({
      type: 'Int',
      isRequired: true,
      default: 0,
    })
    expect(getField('users', 'streak_count')).toMatchObject({
      type: 'Int',
      isRequired: true,
      default: 0,
    })
  })

  it('keeps challenge and location fields aligned with the app data model', () => {
    expectAutoincrementId('location')
    expectVarChar('location', 'name', '500', { isRequired: true })
    expectVarChar('location', 'category', '250', { isRequired: false })
    expectDecimal('location', 'latitude', { isRequired: true })
    expectDecimal('location', 'longitude', { isRequired: true })

    expectAutoincrementId('challenge')
    expectVarChar('challenge', 'name', '500', { isRequired: true })
    expectVarChar('challenge', 'description', '1000', { isRequired: false })
    expect(getField('challenge', 'xp_worth')).toMatchObject({
      type: 'Int',
      isRequired: true,
      default: 0,
    })
    expect(getField('challenge', 'is_active')).toMatchObject({
      type: 'Boolean',
      isRequired: true,
      default: true,
    })
    expectNowDefault('challenge', 'created_at')
    expectCascadeRelation('challenge', 'location', 'location', ['location_id'])
    expectCascadeRelation('challenge', 'challenge_category', 'challenge_category', ['category_id'])
  })

  it('keeps user challenge lifecycle fields and uniqueness constraints intact', () => {
    expectAutoincrementId('user_challenge')
    expectUniqueFields('user_challenge', ['user_id', 'challenge_id', 'assigned_at'])
    expect(getField('user_challenge', 'status')).toMatchObject({
      kind: 'enum',
      type: 'challenge_status',
      isRequired: true,
    })
    expect(getField('user_challenge', 'xp_worth')).toMatchObject({
      type: 'Int',
      isRequired: true,
      hasDefaultValue: false,
    })
    expectNowDefault('user_challenge', 'assigned_at')

    for (const fieldName of [
      'accepted_at',
      'completed_at',
      'cancelled_at',
      'expired_at',
      'skipped_at',
    ]) {
      expect(getField('user_challenge', fieldName)).toMatchObject({
        kind: 'scalar',
        type: 'DateTime',
        isRequired: false,
        nativeType: ['Timestamptz', ['6']],
      })
    }

    expectDecimal('user_challenge', 'accepted_from_lat', { isRequired: false })
    expectDecimal('user_challenge', 'accepted_from_lng', { isRequired: false })
    expectCascadeRelation('user_challenge', 'users', 'users', ['user_id'])
    expectCascadeRelation('user_challenge', 'challenge', 'challenge', ['challenge_id'])
  })

  it('keeps badge, criteria, and stat constraints required by badge awarding', () => {
    expectAutoincrementId('badge')
    expectVarChar('badge', 'name', '100', { isRequired: true, isUnique: true })
    expectVarChar('badge', 'description', '100', { isRequired: false })
    expectVarChar('badge', 'active_url', '500', { isRequired: false })
    expectVarChar('badge', 'inactive_url', '500', { isRequired: false })

    expect(getModel('awarded_badge').primaryKey?.fields).toEqual(['user_id', 'badge_id'])
    expectNowDefault('awarded_badge', 'earned_at')
    expectCascadeRelation('awarded_badge', 'users', 'users', ['user_id'])
    expectCascadeRelation('awarded_badge', 'badge', 'badge', ['badge_id'])

    expectAutoincrementId('badge_criteria')
    expectUniqueFields('badge_criteria', ['badge_id', 'category_id', 'stat_name'])
    expectVarChar('badge_criteria', 'stat_name', '100', { isRequired: true })
    expect(getField('badge_criteria', 'category_id')).toMatchObject({
      type: 'Int',
      isRequired: true,
      default: 0,
    })
    expect(getField('badge_criteria', 'target_value')).toMatchObject({
      type: 'Int',
      isRequired: true,
      hasDefaultValue: false,
    })
    expectCascadeRelation('badge_criteria', 'badge', 'badge', ['badge_id'])
    expectCascadeRelation('badge_criteria', 'challenge_category', 'challenge_category', [
      'category_id',
    ])

    expectAutoincrementId('user_stat')
    expectUniqueFields('user_stat', ['user_id', 'name', 'category_id'])
    expectVarChar('user_stat', 'name', '100', { isRequired: true })
    expect(getField('user_stat', 'current_value')).toMatchObject({
      type: 'Int',
      isRequired: true,
      default: 0,
    })
    expectNowDefault('user_stat', 'updated_at')
    expectCascadeRelation('user_stat', 'users', 'users', ['user_id'])
    expectCascadeRelation('user_stat', 'challenge_category', 'challenge_category', ['category_id'])
  })
})

const describeIntegration = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const expectPrismaCode = async (promise: Promise<unknown>, code: string) => {
  await expect(promise).rejects.toMatchObject({ code })
}

describeIntegration('database schema constraints', () => {
  let prisma: PrismaClient

  beforeAll(() => {
    prisma = new PrismaClient()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  const createUser = (suffix = uniqueSuffix()) =>
    prisma.users.create({
      data: {
        username: `schema-user-${suffix}`,
        email: `schema-user-${suffix}@example.com`,
        user_role: 'user',
        auth_id: `schema-auth-${suffix}`,
      },
    })

  const createCategory = (suffix = uniqueSuffix()) =>
    prisma.challenge_category.create({
      data: {
        name: `Schema Category ${suffix}`,
      },
    })

  const createLocation = (suffix = uniqueSuffix()) =>
    prisma.location.create({
      data: {
        name: `Schema Location ${suffix}`,
        category: 'park',
        latitude: -36.8485,
        longitude: 174.7633,
      },
    })

  const createChallenge = async (suffix = uniqueSuffix()) => {
    const [category, location] = await Promise.all([createCategory(suffix), createLocation(suffix)])

    const challenge = await prisma.challenge.create({
      data: {
        name: `Schema Challenge ${suffix}`,
        location_id: location.id,
        category_id: category.id,
        xp_worth: 25,
      },
    })

    return { category, challenge, location }
  }

  it('applies required user defaults and unique identity constraints', async () => {
    const suffix = uniqueSuffix()
    const user = await createUser(suffix)

    expect(user.id).toEqual(expect.any(Number))
    expect(user.level).toBe(1)
    expect(user.xp_earned).toBe(0)
    expect(user.streak_count).toBe(0)
    expect(user.created_at).toBeInstanceOf(Date)
    expect(user.updated_at).toBeInstanceOf(Date)

    await expectPrismaCode(
      prisma.users.create({
        data: {
          username: user.username,
          email: `schema-duplicate-${suffix}@example.com`,
          user_role: 'user',
          auth_id: `schema-duplicate-auth-${suffix}`,
        },
      }),
      'P2002'
    )
  })

  it('enforces challenge foreign keys and cascades user challenge rows', async () => {
    const suffix = uniqueSuffix()
    const user = await createUser(suffix)
    const { category, challenge } = await createChallenge(suffix)

    await expectPrismaCode(
      prisma.challenge.create({
        data: {
          name: `Missing location ${suffix}`,
          location_id: 2147483647,
          category_id: category.id,
        },
      }),
      'P2003'
    )

    await prisma.user_challenge.create({
      data: {
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'accepted',
        xp_worth: challenge.xp_worth,
      },
    })

    await prisma.users.delete({ where: { id: user.id } })

    await expect(
      prisma.user_challenge.count({
        where: {
          user_id: user.id,
          challenge_id: challenge.id,
        },
      })
    ).resolves.toBe(0)
  })

  it('enforces challenge assignment status enum and composite uniqueness rules', async () => {
    const suffix = uniqueSuffix()
    const user = await createUser(suffix)
    const { challenge } = await createChallenge(suffix)
    const assignedAt = new Date('2026-01-01T00:00:00.000Z')

    await prisma.user_challenge.create({
      data: {
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'in_progress',
        xp_worth: challenge.xp_worth,
        assigned_at: assignedAt,
      },
    })

    await expectPrismaCode(
      prisma.user_challenge.create({
        data: {
          user_id: user.id,
          challenge_id: challenge.id,
          status: 'in_progress',
          xp_worth: challenge.xp_worth,
          assigned_at: assignedAt,
        },
      }),
      'P2002'
    )

    await expect(
      prisma.$executeRaw`
        INSERT INTO user_challenge (user_id, challenge_id, status, xp_worth)
        VALUES (${user.id}, ${challenge.id}, ${'not_a_status'}::challenge_status, ${challenge.xp_worth})
      `
    ).rejects.toThrow()
  })

  it('enforces badge criteria uniqueness and category/stat check constraints', async () => {
    const suffix = uniqueSuffix()
    const category = await createCategory(suffix)
    const badge = await prisma.badge.create({
      data: {
        name: `Schema Badge ${suffix}`,
        description: 'Schema constraint test badge',
      },
    })

    await prisma.badge_criteria.create({
      data: {
        badge_id: badge.id,
        category_id: category.id,
        stat_name: 'category_challenges_completed',
        target_value: 1,
      },
    })

    await expectPrismaCode(
      prisma.badge_criteria.create({
        data: {
          badge_id: badge.id,
          category_id: category.id,
          stat_name: 'category_challenges_completed',
          target_value: 2,
        },
      }),
      'P2002'
    )

    await expect(
      prisma.badge_criteria.create({
        data: {
          badge_id: badge.id,
          category_id: category.id,
          stat_name: 'challenges_completed',
          target_value: 1,
        },
      })
    ).rejects.toThrow()
  })
})
