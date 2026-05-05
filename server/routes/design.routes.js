import express from "express";
import mongoose from "mongoose";
import requireUserAuth from "../middleware/requireUserAuth.js";
import connectToDatabase from "../lib/connectToDatabase.js";
import Design from "../models/Design.js";

const router = express.Router();

router.get("/", requireUserAuth, async (req, res) => {
  try {
    await connectToDatabase();
    const designs = await Design.find({ userId: req.auth.userId })
      .sort({ updatedAt: -1 })
      .limit(12)
      .select("_id name previewImage updatedAt createdAt")
      .lean();

    return res.status(200).json({ designs });
  } catch (error) {
    console.error("Failed to list saved designs:", error?.message || error);
    return res.status(500).json({ message: "Failed to load saved designs." });
  }
});

router.get("/:designId", requireUserAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.designId)) {
    return res.status(404).json({ message: "Saved design not found." });
  }

  try {
    await connectToDatabase();
    const design = await Design.findOne({
      _id: req.params.designId,
      userId: req.auth.userId,
    }).lean();

    if (!design) {
      return res.status(404).json({ message: "Saved design not found." });
    }

    return res.status(200).json({ design });
  } catch (error) {
    console.error("Failed to load saved design:", error?.message || error);
    return res.status(500).json({ message: "Failed to load saved design." });
  }
});

router.post("/", requireUserAuth, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const previewImage = String(req.body?.previewImage || "");
  const designState = req.body?.designState;

  if (!name) {
    return res.status(400).json({ message: "Design name is required." });
  }

  if (!designState || typeof designState !== "object") {
    return res.status(400).json({ message: "Design state is required." });
  }

  try {
    await connectToDatabase();
    const design = await Design.create({
      userId: req.auth.userId,
      name,
      previewImage,
      designState,
    });

    return res.status(201).json({
      design: {
        _id: design._id,
        name: design.name,
        previewImage: design.previewImage,
        updatedAt: design.updatedAt,
        createdAt: design.createdAt,
        designState: design.designState,
      },
    });
  } catch (error) {
    console.error("Failed to save design:", error?.message || error);
    return res.status(500).json({ message: "Failed to save design." });
  }
});

export default router;
