import { Schema, model } from "mongoose";

// base agent schema
const IndicatorSchema = new Schema({
  type: {
    type: String,
    enum: ["PRE-DEFINED", "CUSTOM"],
    required: true,
    default: "PRE-DEFINED",
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Indicator = model("Indicator", IndicatorSchema);
