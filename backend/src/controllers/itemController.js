const itemService = require('../services/itemService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/items (PUBLIC)
 * Get filtered items without internal_note.
 */
const getItems = async (req, res, next) => {
  try {
    const { search, building, category } = req.query;
    const items = await itemService.getAllItems({ search, building, category });
    return successResponse(res, 'Data barang berhasil diambil.', items);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items/admin (ADMIN)
 * Get all items with full details including internal_note.
 */
const getItemsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const items = await itemService.getAllItemsAdmin({ status });
    return successResponse(res, 'Data barang (admin) berhasil diambil.', items);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items/:id (ADMIN)
 * Get a single item by ID.
 */
const getItem = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.params.id);

    if (!item) {
      return errorResponse(res, 'Barang tidak ditemukan.', 404);
    }

    return successResponse(res, 'Detail barang berhasil diambil.', item);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/items (ADMIN)
 * Create a new item.
 */
const createItem = async (req, res, next) => {
  try {
    const item = await itemService.createItem(req.body);
    return successResponse(res, 'Barang berhasil ditambahkan.', item, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/items/:id (ADMIN)
 * Update an existing item.
 */
const updateItem = async (req, res, next) => {
  try {
    const existing = await itemService.getItemById(req.params.id);
    if (!existing) {
      return errorResponse(res, 'Barang tidak ditemukan.', 404);
    }

    const item = await itemService.updateItem(req.params.id, req.body);
    return successResponse(res, 'Barang berhasil diperbarui.', item);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/items/:id (ADMIN)
 * Soft-delete an item.
 */
const deleteItem = async (req, res, next) => {
  try {
    const existing = await itemService.getItemById(req.params.id);
    if (!existing) {
      return errorResponse(res, 'Barang tidak ditemukan.', 404);
    }

    await itemService.softDeleteItem(req.params.id);
    return successResponse(res, 'Barang berhasil dihapus.');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/items/:id/status (ADMIN)
 * Update only the status of an item.
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['AVAILABLE', 'RETURNED', 'EXPIRED'];
    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, 'Status tidak valid. Gunakan: AVAILABLE, RETURNED, atau EXPIRED.', 400);
    }

    const existing = await itemService.getItemById(req.params.id);
    if (!existing) {
      return errorResponse(res, 'Barang tidak ditemukan.', 404);
    }

    const item = await itemService.updateItemStatus(req.params.id, status);
    return successResponse(res, 'Status barang berhasil diperbarui.', item);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items/stats (ADMIN)
 * Get dashboard statistics.
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await itemService.getStats();
    return successResponse(res, 'Statistik berhasil diambil.', stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItems,
  getItemsAdmin,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  updateStatus,
  getStats,
};
