// app.js - Entry point para IIS/iisnode
// Este archivo debe estar en la raíz del proyecto

import('./server.js')
  .then(() => {
    console.log('Aplicación iniciada correctamente');
  })
  .catch((error) => {
    console.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  });