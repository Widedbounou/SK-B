// import dendencies
const mongoose = require("mongoose");

// create user model
const User = mongoose.model("User", {
  email: {
    // so when we populate, we don't pass the email, only account
    type: String,
    unique: true,
    minLength: 1,
    maxLength: 50,
    trim: true,
    required: true,
    validate: {
      validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    maxLength: 128,
    required: true,
  },
  verificationToken: {
    type: String
  },
  salt: {
    type: String,
    maxLength: 128,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  account: {
    username: {
      type: String,
      minLength: 1,
      maxLength: 50,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: false
    },
    lastName: {
      type: String,
      required: false
    },
    location : {
      type: String,
      required: false
    },
    avatar: Object,
    phone: {
      type: String,
      required: [true, 'Mandatory phone number'], // Message d'erreur personnalisé
      // unique: true, 
      // default: "+255 000 000 000",
      validate: {
          validator: function(v) {
              return /^\+\d{3} \d{3} \d{3} \d{3}$/.test(v); // Vérifie le format +XXX XXX XXX XXX
          },
          message: props => `${props.value} is not a valid telephone number! Enter your country code +255 followed by the local number. Example: +255 XXX XXX XXX` // Message d'erreur personnalisé
      }
    },
    newsletter: { type: Boolean, default: false }, 

  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
},
userType: {
  type: String,
  enum: ['particulier', 'professionnel'], // Options possibles
  required: true, // Champ requis
  default: 'particulier' // Valeur par défaut
},

createdOffers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
}],
purchasedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
}],
});

module.exports = User;
