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
    console.log('🔐 Logeando como maestra...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'prekinder@happyschool.edu.mx',
      password: 'HappySchool2026!'
    });

    const token = loginRes.accessToken;
    if (!token) {
      console.log('❌ Login falló:', loginRes);
      return;
    }

    console.log('✅ Token obtenido');

    console.log('\n📋 Obteniendo grupo/mi-grupo...');
    const res = await request('GET', '/api/grupos/mi-grupo?fecha=2026-04-19', null, token);

    if (!res.alumnos) {
      console.log('Error:', res);
      return;
    }

    console.log(`\n✅ Total de alumnos en grupo: ${res.alumnos.length}`);
    console.log('─'.repeat(60));
    
    const nombres = {};
    res.alumnos.forEach(a => {
      nombres[a.nombre_completo] = (nombres[a.nombre_completo] || 0) + 1;
    });

    let hasDuplicados = false;
    Object.entries(nombres).sort().forEach(([nombre, count]) => {
      const status = count > 1 ? '❌ DUPLICADO' : '✅';
      if (count > 1) hasDuplicados = true;
      console.log(`${status}\t${nombre}\t(${count})`);
    });
    
    console.log('─'.repeat(60));
    if (!hasDuplicados) {
      console.log('\n🎉 ¡SIN DUPLICADOS EN GRUPOS! DISTINCT ON funcionando');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
