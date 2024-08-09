const express = require("express");
const path = require("path");

const authController = require(
  path.join(__dirname, "../controllers/authController")
);
const userController = require(
  path.join(__dirname, "../controllers/userController")
);

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// ! - All routes past this point require a user to be logged in - !
router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);

// Custom routes to read, modify, or delete the current logged in user
router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);

// !! - All routes past this point require admin privileges - !!
router.use(authController.restrictTo("admin"));

router.route("/")
  .get(userController.getUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
