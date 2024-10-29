// Import the 'express' package
const express = require("express");
// Call the Router() function from the 'express' package
const router = express.Router();

// uid2 and crypto-js are packages that will help us encrypt the password
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Middleware to receive formData
const fileUpload = require("express-fileupload");
// Function to convert a Buffer to Base64
const convertToBase64 = require("../Utilis/convertToBase64");
// Import the cloudinary package
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");



// Import the User and Offer models
// to avoid errors (especially due to potential references between collections)
// we recommend importing all your models in all your routes
//
// we need User to perform a search in the DB
// to know:
// - if a user with the same email already exists or not (signup route)
// - which user wants to log in (login route)
const User = require("../models/User-model");
const Offer = require("../models/Offer-model");


// *********************************
// SIGNIN 
// *********************************

// declaration of the signup route, using fileUpload to receive formData
router.post("/user/signup", fileUpload(), async (req, res) => {
    try {
      // Search in the DB. Does a user have this email?
      const user = await User.findOne({ email: req.body.email });
  
      // If yes, we return a message and do not proceed to the registration
      if (user) {
        res.status(409).json({ message: "This email already has an account" });

      // otherwise, we move on...
    } else {
        // has the user properly sent the required information?
        if (req.body.email && req.body.password && req.body.username) {
          // If yes, we can create this new user
  
          // Step 1: encrypt the password
          // Generate the token and encrypt the password
          const token = uid2(64);
          const salt = uid2(64);
          const hash = SHA256(req.body.password + salt).toString(encBase64);

        // Step 2: create the new user
        const newUser = new User({
            email: req.body.email,
            token: token,
            hash: hash,
            salt: salt,
            account: {
              username: req.body.username,
              phone: req.body.phone,
            },
            newsletter: req.body.newsletter // Make sure the value is correctly assigned
          });
          // just before creating the new user
// console.log("Newsletter value:", req.body.newsletter);

                  // If I receive an image, I upload it to cloudinary and record the result in the avatar key of my new user's account
        if (req.files?.avatar) {
            const result = await cloudinary.uploader.upload(
              convertToBase64(req.files.avatar),
              {
                folder: `Soukoni/users/${newUser._id}`,
                public_id: "avatar",
              }
            );
            newUser.account.avatar = result;
          }
    // Step 3: save this new user to the DB
        await newUser.save();
        res.status(201).json({
            _id: newUser._id,
            email: newUser.email,
            account: {
                username: newUser.account.username,
                phone: newUser.account.phone,
                avatar: newUser.account.avatar, 
                newsletter: newUser.newsletter,
                firstName: newUser.firstname, 
                lastName: newUser.lastname, 
            },
        });
      } else {
        // the user did not send the required information?
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

// *********************************
// LOGIN 
// *********************************
router.post("/user/login", async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
  
      if (user) {
        // Did they enter the correct password?
        // req.body.password
        // user.hash
        // user.salt
        if (
          SHA256(req.body.password + user.salt).toString(encBase64) === user.hash
        ) {
    return res.json({
      username: user.account.username,
    //   token: user.token,
      message: `Welcome back ${user.account.username} !`,
    });
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
/* ************************** 
 get user with id
 ************************** */
 router.get("/user/:id", async (req, res) => {
    try {
        console.log("User ID:", req.params.id); // Add this line for debugging
        const user = await User.findOne({ _id: req.params.id });
        if (!user) {
            return res.status(404).json({ error: { message: "unknown user" } });
        }
        // Return only the desired fields
        return res.json({
            username: user.account.username, // Make sure the path is correct
            userType: user.userType, // Make sure this field exists
            location: user.location, // Make sure this field exists
            createdAt: user.createdAt, // Make sure this field exists
            createdOffers: user.createdOffers, // Make sure this field exists
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});



/* ************************** 
 delete user with id
 ************************** */
 router.delete("/user/delete/:id", isAuthenticated, async (req, res) => {
  try {
      const userId = req.params.id;

      // Supprimer l'utilisateur de la base de données
      const deletedUser = await User.findByIdAndDelete(userId);
      if (!deletedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      try {
          // Supprimer toutes les images du dossier de l'utilisateur sur Cloudinary
          await cloudinary.api.delete_resources_by_prefix(`Soukoni/users/${userId}`, {
              resource_type: 'image'
          });

          // Supprimer le dossier vide de l'utilisateur sur Cloudinary
          await cloudinary.api.delete_folder(`Soukoni/users/${userId}`);
      } catch (error) {
          console.log("Error deleting Cloudinary folder:", error.message);
          // Vous pouvez choisir de renvoyer une réponse différente ici si nécessaire
      }

      res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
      console.log("Error:", error.message);
      res.status(500).json({ message: error.message });
  }
});



/* ************************** 
 Update user with id
 ************************** */

 router.put("/user/update/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mettre à jour les informations de l'utilisateur
    if (updates.email) user.email = updates.email;
if (updates.isVerified !== undefined) user.isVerified = updates.isVerified;
if (updates.account) {
  if (updates.account.username) user.account.username = updates.account.username;
  if (updates.account.firstName) user.account.firstName = updates.account.firstName;
  if (updates.account.lastName) user.account.lastName = updates.account.lastName;
  if (updates.account.location) user.account.location = updates.account.location;
  if (updates.account.avatar) user.account.avatar = updates.account.avatar;
  if (updates.account.phone) user.account.phone = updates.account.phone;
  if (updates.account.newsletter !== undefined) user.account.newsletter = updates.account.newsletter;
}
if (updates.role) user.role = updates.role;
if (updates.userType) user.userType = updates.userType;

if (updates.createdOffers) user.createdOffers = updates.createdOffers;
if (updates.purchasedItems) user.purchasedItems = updates.purchasedItems;

if (updates.password) {
  user.salt = uid2(64);
  user.hash = SHA256(updates.password + user.salt).toString(encBase64);
  user.token = uid2(64);
}

    // Mettre à jour le champ updatedAt avec la date actuelle
    user.updatedAt = Date.now();

    // Incrémenter la valeur de __v
    user.__v++;
    
    // Sauvegarder les modifications
    const updatedUser = await user.save();

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//  router.put("/user/update/:id", isAuthenticated, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const updates = req.body;

//     // Vérifier si l'utilisateur existe
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Mettre à jour les informations de l'utilisateur
//     if (updates.email) user.email = updates.email;
//     if (updates.account) {
//       if (updates.account.username) user.account.username = updates.account.username;
//       if (updates.account.phone) user.account.phone = updates.account.phone;
//       // Mettez à jour les autres champs de l'objet account si nécessaire
//     }
//     // Mettez à jour les autres champs de premier niveau si nécessaire

//     // Mettre à jour le champ updatedAt avec la date actuelle
//     user.updatedAt = Date.now();

//     // Sauvegarder les modifications
//     const updatedUser = await user.save();

//     res.status(200).json({ message: "User updated successfully", user: updatedUser });
//   } catch (error) {
//     console.log("Error:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });


//  router.put("/user/update/:id", isAuthenticated, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const updates = req.body;

//     // Vérifier si l'utilisateur existe
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Mettre à jour les informations de l'utilisateur
//     Object.assign(user, updates);

//     // Mettre à jour le champ updatedAt avec la date actuelle
//     user.updatedAt = Date.now();

//     // Sauvegarder les modifications
//     const updatedUser = await user.save();

//     res.status(200).json({ message: "User updated successfully", user: updatedUser });
//   } catch (error) {
//     console.log("Error:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });



//  router.put("/user/update/:id", isAuthenticated, async (req, res) => {
//   try {
//       const userId = req.params.id;
//       const updates = req.body;

//       // Vérifier si l'utilisateur existe et mettre à jour ses informations
//       const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
//       if (!updatedUser) {
//           return res.status(404).json({ message: "User not found" });
//       }

//       res.status(200).json({ message: "User updated successfully", user: updatedUser });
//   } catch (error) {
//       console.log("Error:", error.message);
//       res.status(500).json({ message: error.message });
//   }
// });


//  router.put("/user/update/:id", isAuthenticated, async (req, res) => {
//   try {
//       const userId = req.params.id;
//       const updates = req.body;

//       // Check if the user exists
//       const user = await User.findOne({ _id: userId });
//       if (!user) {
//           return res.status(404).json({ message: "User not found" });
//       }

//       // Update the user's information
//       Object.assign(user.account, updates.account); // Update the account information

//       // Check if a new password has been provided
//       if (updates.password) {
//           const salt = uid2(64); // Generate a new salt
//           const hash = SHA256(updates.password + salt).toString(encBase64); // Create a new hash
//           user.hash = hash; // Update the hash
//           user.salt = salt; // Update the salt
//           user.token = uid2(64); // Generate a new token
//       }

//       await user.save(); // Save the changes

//       res.status(200).json({ message: "User updated successfully", user });
//   } catch (error) {
//       console.log("Error:", error.message);
//       res.status(500).json({ message: error.message });
//   }
// });




/* ************* 
 ADMIN user creation 
 ************ */

/* ************* 
 ADMIN user creation 
 TO RECHECK 
 ************ */
 router.post("/user/admin/create", async (req, res) => {
  try {
      // Vérifier si les informations requises sont présentes
      if (!req.body.email || !req.body.password || !req.body.username || !req.body.phone) { // Ajout de la vérification du téléphone
          return res.status(400).json({ message: "Missing parameters" });
      }

      // Vérifier si l'email existe déjà
      const existingAdmin = await User.findOne({ email: req.body.email });
      if (existingAdmin) {
          return res.status(409).json({ message: "This email is already in use" });
      }

      // Étape 1: générer le token et chiffrer le mot de passe
      const token = uid2(64);
      const salt = uid2(64);
      const hash = SHA256(req.body.password + salt).toString(encBase64);

      // Étape 2: créer le nouvel utilisateur admin
      const newAdmin = new User({
          email: req.body.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
              username: req.body.username,
              phone: req.body.phone, // Ajout du numéro de téléphone
              userType: "admin", // Définir le type d'utilisateur comme admin
          },
      });

      // Étape 3: sauvegarder le nouvel admin dans la base de données
      await newAdmin.save();
      res.status(201).json({
          _id: newAdmin._id,
          email: newAdmin.email,
          account: {
              username: newAdmin.account.username,
              phone: newAdmin.account.phone, // Ajout du numéro de téléphone dans la réponse
              userType: newAdmin.account.userType,
          },
      });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
  }
});




/* ************* 
 Update user with id
 ************ */
//  router.put("/user/update/:id", isAuthenticated, async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const updates = req.body;

//         // Check if the user exists
//         const user = await User.findOne({ _id: userId });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // List of fields to update
//         const fieldsToUpdate = [
//             'email',
//             'username',
//             'firstName',
//             'lastName',
//             'avatar',
//             'phone',
//             'newsletter',
//             'location' // Corresponds to the postal address
//         ];

//         // Update the fields if present in the request
//         fieldsToUpdate.forEach(field => {
//             if (updates[field] !== undefined) {
//                 if (field === 'location') {
//                     user.account.location = updates[field]; // Update the location in the account
//                 } else {
//                     user.account[field] = updates[field]; // Update the other fields in the account
//                 }
//             }
//         });

//         // Update the password if provided
//         if (updates.password) {
//             const salt = uid2(64);
//             const hash = SHA256(updates.password + salt).toString(encBase64);
//             user.hash = hash;
//             user.salt = salt;
//         }

//         // Update the updatedAt field
//         user.account.updatedAt = Date.now();

//         await user.save();

//         res.status(200).json({ message: "User updated successfully", user });
//     } catch (error) {
//         console.log("Error:", error.message);
//         res.status(500).json({ message: error.message });
//     }
// });

//  router.put("/user/update/:id", isAuthenticated, async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const updates = req.body;

//         // Check if the user exists
//         const user = await User.findOne({ _id: userId });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Update the user's information
//         Object.assign(user.account, updates.account); // Update the account information
//         await user.save();

//         res.status(200).json({ message: "User updated successfully", user });
//     } catch (error) {
//         console.log("Error:", error.message);
//         res.status(500).json({ message: error.message });
//     }
// });


module.exports = router;
