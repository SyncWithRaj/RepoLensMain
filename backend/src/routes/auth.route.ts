import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// 👉 Redirect to GitHub
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

// 👉 GitHub Callback
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Set cookie on backend domain (for direct API calls)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Also pass token via URL so frontend can set its own cookie
    // This is the reliable fix for cross-origin cookie issues
    res.redirect(`https://repolens-workspace.vercel.app/auth/callback?token=${token}`);
  }
);

// 👉 Get current user
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// 👉 Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;