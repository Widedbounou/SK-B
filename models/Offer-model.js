// import dendencies
const mongoose = require("mongoose");
const data = require('../backend/data.json'); // Charger le fichier JSON


// Extraire toutes les données de la section "features"
const features = data.features;


// Exemple d'extraction des données
const accessoriesBrand = features.accessories_brand.values.simpleData.map(item => item.label);
const accessoriesMaterial = features.accessories_material.values.simpleData.map(item => item.label);
const accessoriesType = features.accessories_type.values.simpleData.map(item => item.label);
const accessoriesUnivers = features.accessories_univers.values.simpleData.map(item => item.label);
const accommodationType = features.accommodation_type.values.simpleData.map(item => item.label);
const animalAccessoriesAnimalKind = features.animal_accessories_animal_kind.values.simpleData.map(item => item.label);
const animalOfferNature = features.animal_offer_nature_1.values.simpleData.map(item => item.label);
const animalType = features.animal_type.values.simpleData.map(item => item.label);
const animalsServicesType = features.animals_services_type.values.simpleData.map(item => item.label);
const babyAge = features.baby_age.values.simpleData.map(item => item.label);
const babyClothingBrandA = features.baby_clothing_brand_a.values.simpleData.map(item => item.label);
const clothingColorA = features.clothing_color_a.values.simpleData.map(item => item.label);
const clothingConditionA = features.clothing_condition_a.values.simpleData.map(item => item.label);
const clothingSizes = features.clothing_st_2.values.simpleData.map(item => item.label);
const clothingType = features.clothing_type.values.simpleData.map(item => item.label);

// create offer model
const Offer = mongoose.model("Offer", {
  product_title: {
    type: String,
    minLength: 1,
    maxLength: 200,
    required: true,
  },
  product_description: {
    type: String,
    minLength: 10,
    maxLength: 4000,
    default: "",
    required: true,
  },
  product_price: {
    type: Number,
    min: 0,
    default: 0,
    required: true,
  },

  product_currency: {
    type: String,
    default: "TZN", // Devise par défaut
    required: true,
  },

  location: { 
    type: String, 
    required: true },

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  created: {
    type: Date,
    default: Date.now,
  },

  product_categories: {
    type: [String], // Un tableau de chaînes pour les catégories
    required: true,
  },

  product_subcategories: {
    type: [String], // Un tableau de chaînes pour les sous-catégories
    required: true,
  },

  ad_types: {
    type: [String], // Un tableau de chaînes pour les types d offres "sell or buy"
    required: true,
  },

  product_image: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  product_pictures: Array,

  accessories_brand: {
    type: [String],
    enum: accessoriesBrand, // Limiter les valeurs aux marques extraites
  },

  accessories_material: {
    type: [String],
    enum: accessoriesMaterial, // Limiter les valeurs aux matériaux extraits
  },

  accessories_type: {
    type: [String],
    enum: accessoriesType, // Limiter les valeurs aux types extraits
  },

  accessories_univers: {
    type: [String],
    enum: accessoriesUnivers, // Limiter les valeurs aux univers extraits
  },

  accommodation_type: {
    type: [String],
    enum: accommodationType, // Limiter les valeurs aux types de logement extraits
  },

  animal_accessories_animal_kind: {
    type: [String],
    enum: animalAccessoriesAnimalKind, // Limiter les valeurs aux types d'animaux extraits
  },

  animal_offer_nature: {
    type: [String],
    enum: animalOfferNature, // Limiter les valeurs aux natures d'offre extraites
  },

  animal_type: {
    type: [String],
    enum: animalType, // Limiter les valeurs aux types d'animaux extraits
  },

  animals_services_type: {
    type: [String],
    enum: animalsServicesType, // Limiter les valeurs aux types de services extraits
  },

  baby_age: {
    type: [String],
    enum: babyAge, // Limiter les valeurs aux âges extraits
  },

  baby_clothing_brand_a: {
    type: [String],
    enum: babyClothingBrandA, // Limiter les valeurs aux marques de vêtements pour bébés extraites
  },
  clothing_color_a: {
    type: [String],
    enum: clothingColorA, // Limiter les valeurs aux couleurs extraites
  },
  clothing_condition_a: {
    type: [String],
    enum: clothingConditionA, // Limiter les valeurs aux conditions extraites
  },
  clothing_sizes: {
    type: [String],
    enum: clothingSizes, // Limiter les valeurs aux tailles extraites
  },
  clothing_type: {
    type: [String],
    enum: clothingType, // Limiter les valeurs aux types de vêtements extraits
  },







});

module.exports = Offer;
