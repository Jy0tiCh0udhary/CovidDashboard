const express = require('express');
const authControler = require('../controllers/auth')
const router = express.Router();
// const pathDirecoty = path.join(__dirname , './public')
router.post('/register' , authControler.register)
router.post('/login' ,authControler.login)
//router.get('/home/:id' ,authControler.profile)

module.exports = router;