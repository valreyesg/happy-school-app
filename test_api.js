const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/tareas/reciente?alumno_id=2ee56308-2835-4924-bc0a-d8a256caa337',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('=== RESPUESTA DEL ENDPOINT ===');
      console.log('created_at:', json.created_at || 'NO PRESENTE');
      console.log('fecha_limite:', json.fecha_limite || 'NO PRESENTE');
      console.log('titulo:', json.titulo || 'NO PRESENTE');
      console.log('completada:', json.completada || 'NO PRESENTE');
      console.log('\n=== JSON COMPLETO ===');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('ERROR parsing:', data);
    }
  });
});

req.on('error', (e) => { console.error('REQUEST ERROR:', e.message); });
req.end();
