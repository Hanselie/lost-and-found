const prisma = require('../config/database');

/**
 * Get all non-deleted AVAILABLE items with optional filters.
 * Returns items WITHOUT internal_note (public view).
 * Only items with status AVAILABLE are shown to public users.
 */
const getAllItems = async (filters = {}) => {
  const { search, building, category } = filters;

  const where = {
    deleted_at: null,
    status: 'AVAILABLE',
  };

  if (search && search.trim().length > 0) {
    where.title = { contains: search.trim() };
  }

  if (building && building.trim().length > 0) {
    where.building = building.trim();
  }

  if (category && category.trim().length > 0) {
    where.category = category.trim();
  }

  const items = await prisma.item.findMany({
    where,
    select: {
      id: true,
      title: true,
      category: true,
      building: true,
      location_detail: true,
      date_found: true,
      status: true,
      created_at: true,
    },
    orderBy: { date_found: 'desc' },
  });

  return items;
};

/**
 * Get all non-deleted items with ALL fields (admin view).
 * Supports optional status filter for admin filtering.
 */
const getAllItemsAdmin = async (filters = {}) => {
  const { status } = filters;

  const where = { deleted_at: null };

  if (status && ['AVAILABLE', 'RETURNED', 'EXPIRED'].includes(status)) {
    where.status = status;
  }

  const items = await prisma.item.findMany({
    where,
    orderBy: { date_found: 'desc' },
  });

  return items;
};

/**
 * Get a single non-deleted item by ID.
 */
const getItemById = async (id) => {
  const item = await prisma.item.findFirst({
    where: {
      id: parseInt(id, 10),
      deleted_at: null,
    },
  });

  return item;
};

/**
 * Returns expiry duration in days based on item category.
 * Makanan (food) expires in 1 day; all other categories expire in 30 days.
 */
const getExpiryDays = (category) => {
  return category === 'Makanan' ? 1 : 30;
};

/**
 * Create a new item. Automatically sets expires_at based on category:
 * - Makanan: date_found + 1 day
 * - Others:  date_found + 30 days
 */
const createItem = async (data) => {
  const dateFound = new Date(data.date_found);
  const expiresAt = new Date(dateFound);
  expiresAt.setDate(expiresAt.getDate() + getExpiryDays(data.category));

  const item = await prisma.item.create({
    data: {
      title: data.title,
      category: data.category,
      building: data.building,
      location_detail: data.location_detail,
      date_found: dateFound,
      status: data.status || 'AVAILABLE',
      internal_note: data.internal_note || null,
      expires_at: expiresAt,
    },
  });

  return item;
};

/**
 * Update an existing item by ID.
 */
const updateItem = async (id, data) => {
  // Always recalculate expires_at — date_found and category are required fields
  const dateFound = new Date(data.date_found);
  const expiresAt = new Date(dateFound);
  expiresAt.setDate(expiresAt.getDate() + getExpiryDays(data.category));

  const updateData = {
    title: data.title,
    category: data.category,
    building: data.building,
    location_detail: data.location_detail,
    date_found: dateFound,
    expires_at: expiresAt,
    internal_note: data.internal_note !== undefined ? data.internal_note : undefined,
  };

  // Remove undefined keys
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const item = await prisma.item.update({
    where: { id: parseInt(id, 10) },
    data: updateData,
  });

  return item;
};

/**
 * Soft-delete an item by setting deleted_at to the current timestamp.
 */
const softDeleteItem = async (id) => {
  const item = await prisma.item.update({
    where: { id: parseInt(id, 10) },
    data: { deleted_at: new Date() },
  });

  return item;
};

/**
 * Update only the status field of an item.
 */
const updateItemStatus = async (id, status) => {
  const item = await prisma.item.update({
    where: { id: parseInt(id, 10) },
    data: { status },
  });

  return item;
};

/**
 * Get dashboard statistics (non-deleted items only).
 */
const getStats = async () => {
  const [total, available, returned, expired] = await Promise.all([
    prisma.item.count({ where: { deleted_at: null } }),
    prisma.item.count({ where: { deleted_at: null, status: 'AVAILABLE' } }),
    prisma.item.count({ where: { deleted_at: null, status: 'RETURNED' } }),
    prisma.item.count({ where: { deleted_at: null, status: 'EXPIRED' } }),
  ]);

  return { total, available, returned, expired };
};

/**
 * Find all AVAILABLE items whose expires_at has passed and mark them EXPIRED.
 * Returns the count of updated items.
 */
const expireItems = async () => {
  const result = await prisma.item.updateMany({
    where: {
      status: 'AVAILABLE',
      deleted_at: null,
      expires_at: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });

  return result.count;
};

module.exports = {
  getAllItems,
  getAllItemsAdmin,
  getItemById,
  createItem,
  updateItem,
  softDeleteItem,
  updateItemStatus,
  getStats,
  expireItems,
};
