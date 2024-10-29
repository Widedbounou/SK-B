const convertToBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
  };
  
  module.exports = convertToBase64;


  // // Middleware pour le téléchargement de fichiers
// const convertToBase64 = (file) => {
//     return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
//   };