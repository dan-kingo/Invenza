import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  location?: string;
  contactPhone?: string;
  language: "en" | "am" | "om";
  verificationDocs: string[];
}

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true },
    location: String,
    contactPhone: String,

    language: { type: String, enum: ["en", "am", "om"], default: "en" },

    verificationDocs: [String]
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>("Business", businessSchema);
