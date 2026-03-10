import { StatusCodes } from 'http-status-codes';
import getModels from '../db/modelFactory.js';

/**
 * Resolves tenant-scoped Mongoose models and attaches them to req.models.
 * Must run after an auth middleware that sets req.tenantId.
 *
 * Backwards-compatibility: if the JWT was issued before multi-tenancy was
 * introduced (and therefore carries no tenantId), the DEFAULT_TENANT_ID
 * environment variable is used as a fallback so existing clients keep working.
 */
const tenantContext = (req, res, next) => {
    const tenantId = req.tenantId ?? process.env.DEFAULT_TENANT_ID;

    if (!tenantId) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ success: false, msg: 'Tenant context could not be resolved' });
    }

    req.tenantId = tenantId;
    req.models = getModels(tenantId);
    next();
};

export default tenantContext;
