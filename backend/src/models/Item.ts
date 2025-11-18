import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: "pcs" | "kg" | "ltr";
  category?: string;
  location?: string;
  tags: string[];
  minThreshold?: number;
  image?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    description: { type: String },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, enum: ["pcs", "kg", "ltr"], required: true, default: "pcs" },
    category: { type: String },
    location: { type: String },
    tags: [{ type: String }],
    minThreshold: { type: Number, default: 0 },
    image: { type: String },
    expiryDate: { type: Date }
  },
  { timestamps: true, optimisticConcurrency: true }
);

itemSchema.index({ businessId: 1, name: 1 });
itemSchema.index({ businessId: 1, tags: 1 });
itemSchema.index({ businessId: 1, category: 1 });
itemSchema.index({ businessId: 1, quantity: 1, minThreshold: 1 });

export const Item = mongoose.model<IItem>("Item", itemSchema);
