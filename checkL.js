
(function () {
  // Versión reducida del motor de la app real, solo para la demo de la landing.
  // Menos sectores y menos frases que la app completa — a propósito, para no duplicar
  // todo el contenido acá y tener que mantenerlo dos veces.
  const DEMO_SECTORES = {
    gastronomia: {
      label: 'Gastronomía', accent: '#d9714e', pattern: 'blobs',
      keywords: ['restaurante','bar','cafeteria','café','cafe','comida','pizzeria','panaderia','panadería','pasteleria','cocina','tapas'],
      openers: ['Hoy se come distinto en {negocio}', 'El plato del día tiene nombre propio', 'En {negocio} el sabor no espera', 'Hoy cocinamos con ganas', 'Un clásico que nunca falla'],
      footers: ['📍 {negocio} · Te esperamos', 'Pide ya · Reparto a domicilio', 'Reservas por DM']
    },
    belleza: {
      label: 'Belleza y Estética', accent: '#b98bb0', pattern: 'rings',
      keywords: ['peluqueria','peluquería','salon','salón','estetica','estética','spa','uñas','manicura','belleza','maquillaje','barberia'],
      openers: ['Tu mejor versión empieza en {negocio}', 'Un ratito para ti, hoy', 'En {negocio} te cuidamos como te mereces', 'Hoy es un buen día para consentirte', '{negocio}: resultados que se notan'],
      footers: ['📍 {negocio} · Reserva tu cita', 'Citas por DM o WhatsApp', 'Plazas limitadas esta semana']
    },
    moda: {
      label: 'Moda y Comercio', accent: '#c8a96e', pattern: 'stripes',
      keywords: ['ropa','moda','boutique','tienda de ropa','zapateria','accesorios','joyeria','calzado','tienda'],
      openers: ['Llegó lo nuevo a {negocio}', 'El look que estabas buscando', '{negocio}: nueva colección disponible', 'Últimas unidades en tienda', 'Renueva tu armario hoy'],
      footers: ['📍 {negocio} · Envíos disponibles', 'Nueva colección · Stock limitado', '@{negocio} · Todas las tallas']
    },
    general: {
      label: 'General', accent: '#c8a96e', pattern: 'blobs',
      keywords: [],
      openers: ['Hoy en {negocio} tenemos algo para ti', 'Lo nuevo ya está disponible en {negocio}', 'Gracias por seguir eligiéndonos', '{negocio} está aquí para ayudarte'],
      footers: ['📍 {negocio} · Contáctanos', 'Escríbenos para más información', 'Síguenos para más novedades']
    }
  };

  const demoState = { sector: 'general', photoImg: null, seed: 0 };

  function detectDemoSector(text) {
    const t = text.toLowerCase().trim();
    if (!t) return null;
    let best = null, bestLen = 0;
    for (const [key, r] of Object.entries(DEMO_SECTORES)) {
      r.keywords.forEach(k => { if (t.includes(k) && k.length > bestLen) { best = key; bestLen = k.length; } });
    }
    return best;
  }

  function fillTemplate(str, name) {
    return str.replace(/\{negocio\}/g, name || 'nuestro negocio');
  }

  function pick(arr, seed) { return arr[seed % arr.length]; }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function shadeColor(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    const c = v => Math.min(255, Math.max(0, v));
    return `rgb(${c(r + amt)},${c(g + amt)},${c(b + amt)})`;
  }
  function hexToRgba(hex, a) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

  function drawDemoPattern(ctx, W, H, pattern) {
    if (pattern === 'blobs') {
      [[0.2,0.16,0.34],[0.86,0.28,0.28],[0.14,0.82,0.32]].forEach(([bx,by,br]) => {
        const r = W*br;
        const g = ctx.createRadialGradient(W*bx,H*by,0,W*bx,H*by,r);
        g.addColorStop(0,'rgba(255,255,255,0.16)'); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W*bx,H*by,r,0,Math.PI*2); ctx.fill();
      });
    } else if (pattern === 'rings') {
      [[0.24,0.2],[0.8,0.62],[0.3,0.86]].forEach(([cx,cy]) => {
        for (let k=0;k<3;k++){ ctx.beginPath(); ctx.lineWidth=2; ctx.strokeStyle=`rgba(255,255,255,${0.18-k*0.045})`; ctx.arc(W*cx,H*cy,W*(0.1+k*0.06),0,Math.PI*2); ctx.stroke(); }
      });
    } else if (pattern === 'stripes') {
      ctx.save(); ctx.translate(W/2,H/2); ctx.rotate(-0.35); ctx.translate(-W/2,-H/2);
      const gap = W*0.12; ctx.fillStyle='rgba(255,255,255,0.07)';
      for (let x=-H;x<W+H;x+=gap) ctx.fillRect(x,-H,gap*0.45,H*3);
      ctx.restore();
    }
  }

  function wrapLines(ctx, text, maxWidth) {
    const words = text.split(' '); const lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur+' '+w : w; if (ctx.measureText(t).width > maxWidth && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }

  function drawWatermark(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.font = "700 26px 'DM Sans', sans-serif";
    ctx.translate(W/2, H/2); ctx.rotate(-0.4); ctx.translate(-W/2, -H/2);
    for (let y = -H; y < H*2; y += 130) {
      for (let x = -W; x < W*2; x += 340) {
        ctx.fillText('VISTA PREVIA', x, y);
      }
    }
    ctx.restore();
  }

  function renderDemo() {
    const canvas = document.getElementById('demoCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const sector = DEMO_SECTORES[demoState.sector];
    const name = document.getElementById('demoName').value.trim();

    ctx.clearRect(0,0,W,H);

    if (demoState.photoImg) {
      const img = demoState.photoImg;
      const scale = Math.max(W/img.width, H/img.height);
      const dw = img.width*scale, dh = img.height*scale;
      ctx.drawImage(img, W/2-dw/2, H/2-dh/2, dw, dh);
      ctx.fillStyle = hexToRgba(sector.accent, 0.14);
      ctx.fillRect(0,0,W,H);
    } else {
      const grad = ctx.createLinearGradient(0,0,W,H);
      grad.addColorStop(0, shadeColor(sector.accent, 16));
      grad.addColorStop(1, shadeColor(sector.accent, -32));
      ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
      drawDemoPattern(ctx, W, H, sector.pattern);
    }

    const mainPhrase = fillTemplate(pick(sector.openers, demoState.seed), name);
    const footerPhrase = fillTemplate(pick(sector.footers, demoState.seed), name);

    ctx.font = "700 60px 'Playfair Display', serif";
    const maxWidth = W*0.82;
    const lines = wrapLines(ctx, mainPhrase, maxWidth);
    const lineHeight = 70;
    const mainY = H*0.7;
    const blockH = lines.length*lineHeight;

    const grad2 = ctx.createLinearGradient(0, mainY-blockH/2-70, 0, mainY+blockH/2+70);
    grad2.addColorStop(0,'rgba(0,0,0,0)'); grad2.addColorStop(0.5,'rgba(0,0,0,0.55)'); grad2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = grad2; ctx.fillRect(0, mainY-blockH/2-70, W, blockH+140);

    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=16;
    let sy = mainY - blockH/2 + 45;
    lines.forEach(l => { ctx.fillText(l, W/2, sy); sy += lineHeight; });
    ctx.shadowBlur = 0;

    const barTop = H*0.87;
    ctx.fillStyle = hexToRgba(sector.accent, 0.92);
    ctx.fillRect(0, barTop, W, H-barTop);
    ctx.fillStyle = '#0a0a0f';
    ctx.font = "700 32px 'DM Sans', sans-serif";
    ctx.fillText(footerPhrase, W/2, barTop + (H-barTop)/2 + 11);

    const pad = 30;
    ctx.strokeStyle = sector.accent; ctx.lineWidth = 6; ctx.globalAlpha = 0.85;
    ctx.strokeRect(pad, pad, W-pad*2, H-pad*2); ctx.globalAlpha = 1;

    drawWatermark(ctx, W, H);
  }

  document.getElementById('demoSector').addEventListener('input', e => {
    const match = detectDemoSector(e.target.value);
    const hint = document.getElementById('demoHint');
    if (!e.target.value.trim()) { hint.textContent = 'Prueba con gastronomía, belleza o moda — el resto se muestra en la app completa.'; return; }
    demoState.sector = match || 'general';
    hint.textContent = match ? `Detectado: ${DEMO_SECTORES[match].label} ✓` : 'Usando estilo general — hay más sectores en la app completa.';
  });

  const demoDropZone = document.getElementById('demoDropZone');
  const demoImageInput = document.getElementById('demoImageInput');
  demoDropZone.addEventListener('click', () => demoImageInput.click());
  demoImageInput.addEventListener('change', e => { if (e.target.files[0]) loadDemoPhoto(e.target.files[0]); });
  demoDropZone.addEventListener('dragover', e => { e.preventDefault(); demoDropZone.style.borderColor = 'var(--accent)'; });
  demoDropZone.addEventListener('dragleave', () => demoDropZone.style.borderColor = '');
  demoDropZone.addEventListener('drop', e => {
    e.preventDefault(); demoDropZone.style.borderColor = '';
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadDemoPhoto(f);
  });
  function loadDemoPhoto(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => { demoState.photoImg = img; demoDropZone.textContent = '✓ Foto cargada · toca para cambiarla'; };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('demoGenerate').addEventListener('click', () => {
    demoState.seed++;
    renderDemo();
  });

  document.fonts.ready.then(renderDemo);
  renderDemo();
})();
