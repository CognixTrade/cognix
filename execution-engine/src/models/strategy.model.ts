import { Schema, model } from "mongoose";

const StrategySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String },
  risk: { type: String, enum: ["High", "Medium", "Low"], required: true },
  agentConfigs: [{ type: Schema.Types.ObjectId, ref: "UserAgentConfig" }],
  indicators: [{ type: Schema.Types.ObjectId, ref: "Indicator" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Strategy = model("Strategy", StrategySchema);
