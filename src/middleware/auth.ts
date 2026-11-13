import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { eq, sql } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { adminRoles, users } from '../db/schema.ts';

export interface AuthUserRecord {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  roleSlug: string;
  roleName: string;
  permissions: string[];
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: AuthUserRecord;
}

async function ensureDefaultRoles() {
  const existing = await db.select().from(adminRoles);
  if (existing.length > 0) return existing;

  const inserted = await db
    .insert(adminRoles)
    .values([
      {
        slug: 'super_admin',
        name: 'Super Administrator',
        description: 'Full administrative access across CMS, catalog, leads, users, and SEO.',
        permissions: ['*'],
      },
      {
        slug: 'editor',
        name: 'Content & Catalog Editor',
        description: 'Manage pages, bilingual copy, products, partners, projects, news, and SEO.',
        permissions: ['content:write', 'catalog:write', 'media:write', 'seo:write'],
      },
      {
        slug: 'sales_manager',
        name: 'Sales & RFQ Manager',
        description: 'View and manage incoming quotation requests and contact messages.',
        permissions: ['leads:read', 'leads:write'],
      },
      {
        slug: 'viewer',
        name: 'Authenticated Viewer',
        description: 'Read-only authenticated account pending administrator role assignment.',
        permissions: ['profile:read'],
      },
    ])
    .onConflictDoNothing()
    .returning();

  return inserted.length > 0 ? inserted : await db.select().from(adminRoles);
}

export async function getOrCreateDbUser(decoded: DecodedIdToken): Promise<AuthUserRecord> {
  const email = decoded.email || `${decoded.uid}@firebase.local`;
  const displayName = typeof decoded.name === 'string' ? decoded.name : email.split('@')[0];
  const photoUrl = typeof decoded.picture === 'string' ? decoded.picture : '';

  const roles = await ensureDefaultRoles();
  const superAdminRole = roles.find((r) => r.slug === 'super_admin');
  const viewerRole = roles.find((r) => r.slug === 'viewer');

  const bootstrapEmails = (process.env.ADMIN_BOOTSTRAP_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const totalUsers = countRows[0]?.count ?? 0;

  const shouldBeSuperAdmin =
    totalUsers === 0 || bootstrapEmails.includes(email.toLowerCase());

  const defaultRoleId = shouldBeSuperAdmin
    ? (superAdminRole?.id ?? null)
    : (viewerRole?.id ?? superAdminRole?.id ?? null);

  await db
    .insert(users)
    .values({
      uid: decoded.uid,
      email,
      displayName,
      photoUrl,
      roleId: defaultRoleId,
      isActive: true,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        displayName,
        photoUrl,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    });

  const rows = await db
    .select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      displayName: users.displayName,
      photoUrl: users.photoUrl,
      isActive: users.isActive,
      roleSlug: adminRoles.slug,
      roleName: adminRoles.name,
      permissions: adminRoles.permissions,
    })
    .from(users)
    .leftJoin(adminRoles, eq(users.roleId, adminRoles.id))
    .where(eq(users.uid, decoded.uid))
    .limit(1);

  const row = rows[0];
  return {
    id: row.id,
    uid: row.uid,
    email: row.email,
    displayName: row.displayName,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
    roleSlug: row.roleSlug || 'viewer',
    roleName: row.roleName || 'Authenticated Viewer',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.dbUser = await getOrCreateDbUser(decodedToken);
    if (!req.dbUser.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact a Super Administrator.' });
    }
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const dbUser = req.dbUser;
    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (dbUser.roleSlug === 'super_admin' || dbUser.permissions.includes('*')) {
      return next();
    }
    const allowed = requiredPermissions.some((perm) => dbUser.permissions.includes(perm));
    if (!allowed) {
      return res.status(403).json({
        error: 'Forbidden: Your account does not have permission for this administrative action.',
      });
    }
    return next();
  };
};
