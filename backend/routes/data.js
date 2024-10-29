const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load the data.json file
const dataPath = path.join(__dirname, '../data.json'); 
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Route to get all data
router.get('/data', (req, res) => {
    // console.log(data); // Logs the entire data object to the console
    res.json(data); // Returns the entire data object
});

router.get('/categories', (req, res) => {
    // Map categories to only return the 'name' field
    const categoryNames = data.categories.map(category => category.name);
    // console.log(categoryNames);
    res.json(categoryNames);
  });

// Route to get all subcategory names 
router.get('/subcategories', (req, res) => {
    // Check if categories exist
    if (!data.categories || data.categories.length === 0) {
        return res.status(404).send('No category found');
    }

    // Flatten subcategories and only return the 'name' field
    const subCategoryNames = data.categories.flatMap(category => 
        category.subcategories ? category.subcategories.map(subcategory => subcategory.name) : [] // Verification added here
    );

    if (subCategoryNames.length === 0) {
        return res.status(404).send('No subcategory found');
    }

    console.log(subCategoryNames); // Logs subcategory names to the console
    res.json(subCategoryNames); // Returns subcategory names
});


// Route to get subcategories of a specific category
router.get('/categories/:catId', (req, res) => {
  const category = data.categories.find(cat => cat.catId === req.params.catId);
  if (category) {
    res.json(category.subcategories);
  } else {
    res.status(404).send('Category not found');
  }
});



// Route to read features data
router.get('/features', (req, res) => {
  const filePath = path.join(__dirname, '../data.json'); // Path to your JSON file

  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: 'File read error' });
      }

      try {
          const jsonData = JSON.parse(data);
          res.json(jsonData.features); // Returns features data
      } catch (parseError) {
          res.status(500).json({ error: 'JSON parsing error' });
      }
  });
});


// Route to read form data
// Route to read form data
router.get('/form', (req, res) => {
  const formPath = path.join(__dirname, '../form.json'); // Chemin vers votre fichier form.json

  fs.readFile(formPath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: 'Erreur de lecture du fichier' });
      }

      try {
          const jsonData = JSON.parse(data);
          res.json(jsonData); // Retourne les données du formulaire
      } catch (parseError) {
          res.status(500).json({ error: 'Erreur de parsing JSON' });
      }
  });
});

// Export the router
module.exports = router;
