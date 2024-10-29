// Import the 'express' package
const express = require("express");
// Call the Router() function from the 'express' package
const router = express.Router();
// Import the cloudinary package
const cloudinary = require("cloudinary").v2;
// Import express file upload
const fileUpload = require("express-fileupload");
// Import the convertToBase64 function
const convertToBase64 = require("../Utilis/convertToBase64");

const User = require("../models/User-model");
const Offer = require("../models/Offer-model");

// Import the isAuthenticated middleware
const isAuthenticated = require("../middlewares/isAuthenticated");

// Middleware for file uploads
// const convertToBase64 = (file) => {
//     return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
//   };

// /* **************************
//  publish offer
//  ************************* */
router.post(
    "/offer/publish", isAuthenticated, fileUpload(),
    async (req, res) => {
        try {
            // Check if req.body is defined
            if (!req.body || !req.body.title || !req.body.description || !req.body.price || !req.body.location) {
                return res.status(400).json({
                    error: { message: 'Missing title, description, price, or location' },
                });
            }

            // Check if the arguments are correct
            if (
                req.body.title.length > 50 ||
                req.body.description.length > 1000 ||
                req.body.price > 100000
            ) {
                return res.status(400).json({ error: { message: 'Invalid data of title, descritpion or price' } });
            }

            const { title, description, price, currency, categories, subcategories, location } = req.body;

            const date = Date.now();
            const newOffer = new Offer({
                product_title: title,
                product_description: description,
                product_price: price,
                product_currency: currency,
                product_categories: categories,
                product_subcategories: subcategories,
                location: location,
                created: date,
                creator: req.user._id,
            });

            const photoToUpload = req.files.picture;

            // Check if photoToUpload is defined and if it's an array
            if (photoToUpload) {
                if (Array.isArray(photoToUpload)) {
                    // If it's an array, treat the first image as the main image
                    const result = await cloudinary.uploader.upload(
                        convertToBase64(photoToUpload[0]),
                        {
                            folder: `soukoni/offers/${newOffer._id}`, // Add the folder
                            public_id: "preview",
                        }
                    );
                    newOffer.product_image = result;

                    // Process the other images
                    newOffer.product_pictures = []; // Initialize the array for additional images
                    for (let i = 1; i < photoToUpload.length; i++) {
                        const additionalResult = await cloudinary.uploader.upload(
                            convertToBase64(photoToUpload[i])
                        );
                        newOffer.product_pictures.push(additionalResult);
                    }
                } else {
                    // If it's not an array, treat it as a single image
                    const result = await cloudinary.uploader.upload(
                        convertToBase64(photoToUpload),
                        {
                            folder: `soukoni/offers/${newOffer._id}`,
                            public_id: "preview",
                          }
                    );
                    newOffer.product_image = result;
                }
            } else {
                return res.status(400).json({ error: { message: 'No image uploaded' } });
            }
            await newOffer.save();
            // Add the offer ID to the user
            await User.findByIdAndUpdate(req.user._id, {
                $push: { createdOffers: newOffer._id }
            });

            const response = {
                product_title: title,
                product_description: description,
                product_price: price,
                product_currency: currency,
                product_categories: categories,
                product_subcategories: subcategories,
                location: newOffer.location, 
                created: date,
                creator: {
                    account: req.user.account,
                    _id: req.user._id,
                },
                product_image: newOffer.product_image,
                product_pictures: newOffer.product_pictures,
            };
            return res.status(201).json(response);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    }
);

/* ************************** 
show offers and filter 
************************* */

router.get("/offers", async (req, res) => {
    try {
        const { category, subcategory, minPrice, maxPrice, title, sortBy, page, location } = req.query;

        // Build a filter object
        const filter = {};

        if (category) {
            filter.product_categories = category;
        }

        if (subcategory) {
            filter.product_subcategories = subcategory;
        }

        if (minPrice) {
            filter.product_price = { ...filter.product_price, $gte: Number(minPrice) };
        }

        if (maxPrice) {
            filter.product_price = { ...filter.product_price, $lte: Number(maxPrice) };
        }

        if (title) {
            filter.product_title = new RegExp(title, 'i'); // Filter by title with a regular expression
        }
        if (location) { // Add the filter for 'location'
            filter.location = location;
        }

        // Pagination
        const limit = 20; // Number of offers per page
        const pageNumber = page ? Number(page) : 1; // Page number, default 1
        const skip = (pageNumber - 1) * limit; // Calculate the number of offers to skip

        // Define the sorting logic
        let sortOptions = {};
        if (sortBy) {
            switch (sortBy) {
                case 'pertinence':
                    sortOptions = { created: -1 }; // Example: sort by creation date (newest)
                    break;
                case 'recent':
                    sortOptions = { created: -1 }; // Newest
                    break;
                case 'oldest':
                    sortOptions = { created: 1 }; // Oldest
                    break;
                case 'priceAsc':
                    sortOptions = { product_price: 1 }; // Price ascending
                    break;
                case 'priceDesc':
                    sortOptions = { product_price: -1 }; // Price descending
                    break;
                default:
                    sortOptions = { created: -1 }; // Default sort (newest)
            }
        } else {
            sortOptions = { created: -1 }; // Default sort (newest)
        }

        // Retrieve offers based on filters
        const offers = await Offer.find(filter)
            .populate('creator', 'account _id')
            .sort(sortOptions) // Apply the sort options
            .limit(limit)
            .skip(skip);

        // Count the total number of offers for pagination
        const totalOffers = await Offer.countDocuments(filter);

        return res.status(200).json({
            totalOffers,
            totalPages: Math.ceil(totalOffers / limit),
            currentPage: pageNumber,
            offers,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

/* ************************** 
show offer with id 
************************* */
router.get("/offer/:id", async (req, res) => {
    try {
        const offerId = req.params.id; // Retrieve the offer ID from the request parameters

        // Find the corresponding offer and populate the creator key
        const offer = await Offer.findById(offerId)
            .populate('creator', 'account.username account.phone account.avatar'); // Select only the desired keys

        // Check if the offer exists
        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Return the offer information
        return res.status(200).json(offer);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});



/* ************************** 
show offers with user id 
************************* */

router.get("/offers/user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId; // Retrieve the user ID from the request parameters

        // Find the offers created by the user
        const offers = await Offer.find({ creator: userId })
            .populate('creator', 'account.username account.phone account.avatar'); // Populate the creator key

        // Check if the user has offers
        if (offers.length === 0) {
            return res.status(404).json({ message: "No offers found for this user" });
        }

        // Return the user's offers
        return res.status(200).json(offers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});


/* ************************** 
delete offer 
************************* */
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
    try {
        const offerId = req.params.id; // Retrieve the offer ID from the request parameters

        // Check if the offer exists
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Delete the folder on Cloudinary
        await cloudinary.api.delete_resources_by_prefix(`soukoni/offers/${offerId}`);

        // Delete the offer from the database
        await Offer.findByIdAndDelete(offerId);

        return res.status(200).json({ message: "Offer deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});

/* ************* 
 Update offer with id
 ************ */

 
 router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
    try {
        const offerId = req.params.id; // Retrieve the offer ID from the request parameters
        const { title, description, price, currency, categories, subcategories, location } = req.body;

        // Check if req.body is defined
        if (!req.body) {
            return res.status(400).json({
                error: { message: 'Request body is missing' },
            });
        }

        // Find the corresponding offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Update the offer information only if they are provided
        if (title) offer.product_title = title;
        if (description) offer.product_description = description;
        if (price) offer.product_price = price;
        if (currency) offer.product_currency = currency;
        if (categories) offer.product_categories = categories;
        if (subcategories) offer.product_subcategories = subcategories;
        if (location) offer.location = location;

        await offer.save(); // Save the changes

        return res.status(200).json({ message: "Offer updated successfully", offer });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
});



module.exports = router;
