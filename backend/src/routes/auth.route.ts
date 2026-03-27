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

    // ✅ PRODUCTION COOKIE FIX
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,          // ❗ MUST for HTTPS
      sameSite: "None",      // ❗ MUST for cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // redirect to frontend
    res.redirect("https://repolens-workspace.vercel.app/dashboard");
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
    sameSite: "None",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;