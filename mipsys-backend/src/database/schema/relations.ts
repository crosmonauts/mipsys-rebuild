import { relations } from 'drizzle-orm';
import {
  serviceRequests,
  customers,
  products,
  staff,
} from './service-request.schema';
import { orderParts, spareParts } from './spare-part.schema';
import { purchaseOrders } from './purchase-order.schema';
import { stockMovements } from './stock-movement.schema';

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [serviceRequests.customerId],
      references: [customers.id],
    }),
    product: one(products, {
      fields: [serviceRequests.productId],
      references: [products.id],
    }),
    admin: one(staff, {
      fields: [serviceRequests.adminId],
      references: [staff.id],
      relationName: 'admin',
    }),
    technicianCheck: one(staff, {
      fields: [serviceRequests.technicianCheckId],
      references: [staff.id],
      relationName: 'technician',
    }),
    orderParts: many(orderParts),
  })
);

export const orderPartsRelations = relations(orderParts, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [orderParts.serviceRequestId],
    references: [serviceRequests.id],
  }),
  sparePart: one(spareParts, {
    fields: [orderParts.sparePartId],
    references: [spareParts.id],
  }),
}));

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one }) => ({
    sparePart: one(spareParts, {
      fields: [purchaseOrders.sparePartId],
      references: [spareParts.id],
    }),
  })
);

export const sparePartsRelations = relations(spareParts, ({ many }) => ({
  orderParts: many(orderParts),
  purchaseOrders: many(purchaseOrders),
  stockMovements: many(stockMovements),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  sparePart: one(spareParts, {
    fields: [stockMovements.sparePartId],
    references: [spareParts.id],
  }),
  performedByStaff: one(staff, {
    fields: [stockMovements.performedBy],
    references: [staff.id],
  }),
}));
