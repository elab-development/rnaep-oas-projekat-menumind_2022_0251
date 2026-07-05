import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  isActive: z.boolean().optional(),
});

export const menuItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000).optional(),
  categoryId: z.string().uuid(),
  price: z.coerce.number().min(0),
  preparationTime: z.coerce.number().min(0).optional(),
  calories: z.coerce.number().min(0).optional(),
  dietary: z.array(z.string().max(100)).optional(),
  imageUrl: z.union([z.literal(""), z.string().url()]).optional(),
  popular: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export const restaurantUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).nullable().optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable().optional(),
});
