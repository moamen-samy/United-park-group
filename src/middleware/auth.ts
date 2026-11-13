import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
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

const ENTERPRISE_DEFAULT_ROLES = [
  {
    slug: 'super_admin',
    name: 'Super Administrator',
    description: 'Full administrative access across CMS, pricing, users, backups, and security logs.',
    permissions: ['*'],
  },
  {
    slug: 'admin',
    name: 'Administrator',
    description: 'Full operational management across pages, catalog, sectors, leads, SEO, and settings.',
    permissions: [
      'content:read',
      'content:write',
      'catalog:read',
      'catalog:write',
      'pricing:write',
      'media:write',
      'seo:write',
      'leads:read',
      'leads:write',
      'logs:read',
      'settings:manage',
    ],
  },
  {
    slug: 'content_editor',
    name: 'Content Editor',
    description: 'Manage pages, sections, sectors, news articles, banners, media, and navigation.',
    permissions: ['content:read', 'content:write', 'media:write'],
  },
  {
    slug: 'product_manager',
    name: 'Product & Pricing Manager',
    description: 'Manage products, categories, technical specs, SAR/multi-currency pricing, and partners.',
    permissions: ['catalog:read', 'catalog:write', 'pricing:write', 'media:write'],
  },
  {
    slug: 'marketing_manager',
    name: 'Marketing & SEO Manager',
    description: 'Manage SEO metadata, sitemaps, redirects, banners, news articles, and customer leads.',
    permissions: ['content:read', 'seo:write', 'leads:read', 'leads:write', 'media:write'],
  },
  {
    slug: 'viewer',
    name: 'Viewer',
    description: 'Read-only access awaiting administrator role assignment.',
    permissions: ['profile:read', 'content:read', 'catalog:read', 'leads:read'],
  },
];

let rolesSynced = false;

export async function ensureDefaultRoles() {
  if (!rolesSynced) {
    await db
      .insert(adminRoles)
      .values(ENTERPRISE_DEFAULT_ROLES)
      .onConflictDoNothing();
    rolesSynced = true;
  }
  return await db.select().from(adminRoles);
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
    roleName: row.roleName || 'Viewer',
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

export function userHasAnyPermission(dbUser: AuthUserRecord, requiredPermissions: string[]): boolean {
  if (dbUser.roleSlug === 'super_admin' || dbUser.permissions.includes('*')) {
    return true;
  }
  return requiredPermissions.some((perm) => dbUser.permissions.includes(perm));
}

export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const dbUser = req.dbUser;
    if (!dbUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!userHasAnyPermission(dbUser, requiredPermissions)) {
      return res.status(403).json({
        error: 'Forbidden: Your account does not have permission for this administrative action.',
      });
    }
    return next();
  };
};
