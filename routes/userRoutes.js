const express = require('express');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/forgotPassword', AuthController.forgotPassword);
router.patch('/resetPassword/:token', AuthController.resetPassword);
router.patch('/verify-email/:token', AuthController.verifyEmail);

//----------PROTECTED ROUTES-------------//
router.use(AuthController.protected);

//User Routes

router.route('/updateMe').patch(UserController.updateMe);
router.route('/me').get(UserController.getMe, UserController.getUser);
router.route('/updatePassword').patch(AuthController.updatePassword);
router.route('/deleteMe').delete(UserController.deleteMe);

// Future create admin Routes

module.exports = router;
