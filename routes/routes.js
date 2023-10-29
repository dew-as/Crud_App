const express = require("express")
const router = express.Router()
const User = require("../models/users")
const multer = require("multer")
const fs = require("fs")


//image upload

var storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,"./uploads")
    },
    filename: (req,file,cb) => {
        cb(null,file.fieldname + "_" + Date.now() + "_" +file.originalname)
    }
})

var upload = multer({
    storage: storage,
}).single("image")

//Insert an user into database route
router.post('/add',upload,(req,res)=>{
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    })
   
user.save()
.then(() => {
    // User saved successfully
    req.session.message = {
        type: 'success',
        message: 'User added successfully!'
    };
    res.redirect('/')
})
.catch((err) => {
    // Handle the error
    res.json({ message: err.message, type: 'danger' })
})
})

//get all users route

router.get("/", (req, res) => {
    User.find()
        .exec()
        .then((users) => {
            res.render("index", {
                title: "Home Page",
                users: users,
            });
        })
        .catch((err) => {
            res.json({ message: err.message })
        });
});


router.get("/add",(req,res) => {
    res.render("add_users", { title: "Add Users"})
})

//edit an user route

router.get('/edit/:id', (req, res) => {
    const id = req.params.id;

    User.findById(id)
        .exec()
        .then((user) => {
            if (user === null) {
                res.redirect('/');
            } else {
                res.render("edit_users", {
                    title: "Edit Users",
                    user: user,
                });
            }
        })
        .catch((err) => {
            res.redirect('/');
        });
});

// update user router

router.post('/update/:id', upload, (req, res) => {
    let id = req.params.id
    let new_image = ''

    if (req.file) {
        new_image = req.file.filename
        const fileToDelete = './uploads/' + req.body.old_image

        fs.promises.unlink(fileToDelete) // Use fs.promises.unlink
            .then(() => {
                updateUser()
            })
            .catch((err) => {
                console.error(err)
                res.json({ message: err.message, type: 'danger' })
            })
    } else {
        new_image = req.body.old_image
        updateUser()
    }

    function updateUser() {
        User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        })
            .then((result) => {
                req.session.message = {
                    type: 'success',
                    message: 'User updated successfully',
                }
                res.redirect('/')
            })
            .catch((err) => {
                res.json({ message: err.message, type: 'danger' });
            })
    }
})

// delete user route

router.get("/delete/:id", (req, res) => {
    const id = req.params.id
    let imageToDelete

    User.findByIdAndRemove(id)
        .then((result) => {
            if (result && result.image) {
                imageToDelete = result.image
                return fs.promises.unlink("./uploads/" + imageToDelete)
            }
        })
        .then(() => {
            req.session.message = {
                type: "info",
                message: "User deleted successfully!"
            }
            res.redirect("/")
        })
        .catch((err) => {
            res.json({ message: err.message })
        })
})

module.exports = router