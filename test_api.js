const http = require('http');

async function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    console.log('🔐 Logeando como papa.sofia...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'papa.sofia@happyschool.edu.mx',
      password: 'HappySchool2026!'
    });

    const token = loginRes.accessToken;
    if (!token) {
      console.log('❌ Login falló:', loginRes);
      return;
    }

    console.log('✅ Token obtenido');

    console.log('\n📋 Obteniendo mis-hijos...');
    const res = await request('GET', '/api/alumnos/mis-hijos', null, token);

    if (!Array.isArray(res)) {
      console.log('Error:', res);
      return;
    }

    console.log(`\n✅ Total de registros: ${res.length}`);
    console.log('\n📌 Validación de duplicados:');
    console.log('─'.repeat(60));
    
    const nombres = {};
    res.forEach(h => {
      nombres[h.nombre_completo] = (nombres[h.nombre_completo] || 0) + 1;
    });

    let hasDuplicados = false;
    Object.entries(nombres).sort().forEach(([nombre, count]) => {
      const status = count > 1 ? '❌ DUPLICADO' : '✅';
      if (count > 1) hasDuplicados = true;
      console.log(`${status}\t${nombre}\t(${count})`);
    });
    
    console.log('─'.repeat(60));
    if (!hasDuplicados) {
      console.log('\n🎉 ¡SIN DUPLICADOS! DISTINCT ON funcionando correctamente');
    }

    console.log('\n📍 Listado completo con tiene_extension:');
    console.log('─'.repeat(60));
    res.forEach(h => {
      const ext = h.tiene_extension ? '✓ Extensión' : '-';
      console.log(`${h.nombre_completo}\t\t${ext}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
