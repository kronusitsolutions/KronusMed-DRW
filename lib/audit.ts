import { prisma } from "./prisma"

export interface AuditLogData {
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: 'MEDICAL_NOTE' | 'PATIENT' | 'INVOICE' | 'APPOINTMENT'
  entityId: string
  oldData?: any
  newData?: any
  description: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldData: data.oldData ? JSON.stringify(data.oldData) : null,
        newData: data.newData ? JSON.stringify(data.newData) : null,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // No lanzar error para no interrumpir la operación principal
  }
}

export async function getAuditLogs(filters?: {
  entityType?: string
  entityId?: string
  userId?: string
  action?: string
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (filters?.entityType) where.entityType = filters.entityType
  if (filters?.entityId) where.entityId = filters.entityId
  if (filters?.userId) where.userId = filters.userId
  if (filters?.action) where.action = filters.action
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters?.startDate) where.createdAt.gte = filters.startDate
    if (filters?.endDate) where.createdAt.lte = filters.endDate
  }

  return await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}
