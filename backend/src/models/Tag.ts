import mongoose, { Schema, Document } from "mongoose";

export interface ITag extends Document {
  tagId: string;
  type: "item" | "box";
  businessId: mongoose.Types.ObjectId;
  attachedItemId?: mongoose.Types.ObjectId;
  meta?: Record<string, any>;
  createdAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    tagId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["item", "box"], required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    attachedItemId: { type: Schema.Types.ObjectId, ref: "Item" },
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

tagSchema.index({ businessId: 1, tagId: 1 });
tagSchema.index({ attachedItemId: 1 });

export const Tag = mongoose.model<ITag>("Tag", tagSchema);
