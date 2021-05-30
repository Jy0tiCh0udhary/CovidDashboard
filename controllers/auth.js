const  mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('express');
const nodemailer = require('nodemailer');
// const session = require('express-session')
const  db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
  });
 
exports.register = (req,res)=>{
    const {name, email, password , cpassword} = req.body;

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
   await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "your@gmail.com", // generated ethereal user
      pass: "password", // generated ethereal password
    },
  });

  // send mail with defined transport object
    await transporter.sendMail({
    from: '"Team Infinity" <covid19static@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "Successfully Registered.", // Subject line
    text: "Thank you for reaching us you are successfully registered.", // plain text body
    html: "<b>Thank you for reaching us! You are successfully registered.</b>", // html body
  });
}
    db.query("SELECT * FROM users WHERE email = ?",[email] ,async (error,result)=>{
        if(error) throw error;
        if(result.length > 0){
            return res.render('register.hbs' ,{
                message:'That email is already in use'
            });
        }else if(password !== cpassword){
            return res.render('register.hbs' , {
                message:'Password does not match!'
            });
        }

        let hashedPassword = await bcrypt.hash(password , 8);
        console.log(hashedPassword);
        console.log('request ==>'+req.files);

        if (!req.files)
				return res.status(400).send('No files were uploaded.');

        var file = req.files.uploaded_image;
        var img_name=file.name;
        console.log('image name==>'+img_name);

        if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                                 
            file.mv('public/images/upload_images/'+file.name, function(err) {
                           
                if (err)
                return res.status(500).send(err);
                        
                db.query("INSERT INTO users SET ? " , {name:name , email:email , password : hashedPassword ,image : img_name} , (errr,result)=>{
                    if(errr){
                        console.log(errr);
                    }else{
                        console.log(result);
                        // req.session.userId = req.body.email
                        req.session.userId = req.body.email;
                        main().catch(console.error);
                        return res.redirect('/home/'+result.insertId);  //appended id of logged in user 
                    }
                })
            });
        } else {
          message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
          res.render('home.hbs',{message: message});
        }


       
    })
}

exports.login = async (req,res) =>{
    try{
        const {email , password} = req.body;
        if(!email || !password){
            return res.status(400).render('login.hbs' , {
                message:'Please provide an email and password!'
            })
        }
            db.query("SELECT * FROM users WHERE email = ?" , [email],async (err,result)=>{
                if(result.length === 0){
                    return res.status(404).render('login.hbs' , {
                        message:'User not found'
                    })
                }
                if(!result || !(await bcrypt.compare(password , result[0].password))){
                    return res.status(401).render('login.hbs' , {
                        message:'Email or Password incorrect'
                    });
                }
                else{
                    const id = result[0].email ;
                    console.log(id);
                    req.session.userId = id;
                    console.log(req.session.userId);
                    // user.session.user = id;
                    // console.log(user.session.user);
                    // const token = jwt.sign({id} , process.env.JWT_SECRET , {
                    //     expiresIn:process.env.JWT_EXPIRES_IN
                    // })

                    // const cookieOptions = {
                    //     expires:new Date(
                    //         Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    //     ),
                    //     httpOnly:true
                    // }

                    // res.cookie('jwt' , token , cookieOptions);
                    if(req.session.userId){
                        res.status(200).redirect('/home/'+result[0].id)
                    }else{
                        res.redirect('/login')
                    }
                }
            })
        
    }catch(err){
        console.log(err);
    }
  
}

// app.get('/logout', (req, res) => {
//     res.clearCookie('token');
//     return res.redirect('/');
//   });
exports.profile = function(req, res){
	var message = '';
	var id = req.params.id; // getting id from url
    console.log('param id++'+id);
    var sql="SELECT * FROM `users` WHERE `id`='"+id+"'"; //sql query to fetch data based on id
    db.query(sql, function(err, result){
	  if(result.length <= 0)
	  message = "Profile not found!";
	  console.log('result++'+JSON.stringify(result));
      res.render('home.hbs',{data:result, message: message}); // rendering home.hbs with the fetched data
   });
};

