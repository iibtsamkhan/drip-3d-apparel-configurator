import mongoose from "mongoose";

const designSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    previewImage: {
      type: String,
      default: "",
    },
    designState: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Design = mongoose.models.Design || mongoose.model("Design", designSchema);

export default Design;
