/* Eixos do Continente e São José. © OpenStreetMap contributors (ODbL).
   https://www.openstreetmap.org/copyright
   Amostras da API /0.6/map.json, consultadas em novembro de 2026. A projeção
   local mantém a forma de cada trecho. As ligações entre bairros são abreviadas
   para encaixar na escala do mapa existente. */
window.MTAMainland = (() => {
  "use strict";

  const kobrasol = { lon: -48.6133, lat: -27.5949, x: -854, z: 100, longitude: 55000, latitude: 62000 };
  const capoeiras = { lon: -48.5832, lat: -27.5990, x: -706, z: 155, longitude: 26500, latitude: 36500 };
  const streets = [
    { id: "ledio", name: "Avenida Lédio João Martins", frame: kobrasol, style: "sj-main",
      samples: [[-48.6125638, -27.5901943], [-48.6128349, -27.5913244],
        [-48.6133722, -27.5935644], [-48.6137277, -27.5950464], [-48.6141226, -27.5970914],
        [-48.6146194, -27.5994657], [-48.6149575, -27.6006083]] },
    { id: "adhemar", name: "Rua Adhemar da Silva", frame: kobrasol, style: "sj-local",
      samples: [[-48.6118002, -27.5899293], [-48.6120705, -27.5910277],
        [-48.6123818, -27.592324], [-48.6130648, -27.5951685], [-48.6133342, -27.5963344],
        [-48.6135188, -27.597183], [-48.6138401, -27.5987359]] },
    { id: "koesa", name: "Rua Koesa", frame: kobrasol, style: "sj-local",
      samples: [[-48.6129081, -27.5887199], [-48.6130326, -27.5892316],
        [-48.6132351, -27.5900637], [-48.6137062, -27.5920002], [-48.6141291, -27.5937384]] },
    { id: "ivo", name: "Avenida Governador Ivo Silveira", frame: capoeiras, style: "sj-main",
      samples: [[-48.5818639, -27.600467], [-48.5832906, -27.6006615],
        [-48.5847745, -27.6002364], [-48.5857252, -27.5999279], [-48.5861729, -27.5997694]] },
    { id: "santos", name: "Rua Santos Saraiva", frame: capoeiras, style: "sj-local",
      samples: [[-48.5817049, -27.5949451], [-48.5826377, -27.5957777],
        [-48.58442, -27.5976427], [-48.58607, -27.5983803]] },
  ];

  const labels = [
    ["Capoeiras", -705, 72],
    ["Kobrasol", -904, 115],
    ["Campinas", -808, -170],
    ["São José", -923, 510],
  ];

  function register(profiles, node, edge) {
    profiles["sj-main"] = {
      ...profiles.estreito, w: 13, speed: 13, hmin: 8, hmax: 24, style: "estreito",
    };
    profiles["sj-local"] = {
      ...profiles.estreito, w: 8.4, speed: 8, hmin: 5, hmax: 15, style: "vila",
    };
    for (const { id, name, frame, style, samples } of streets) {
      samples.forEach(([lon, lat], index) => {
        const x = Math.round((frame.x + (lon - frame.lon) * frame.longitude) * 10) / 10;
        const z = Math.round((frame.z + (frame.lat - lat) * frame.latitude) * 10) / 10;
        node(id + index, x, z);
        if (index > 0) edge(id + (index - 1), id + index, style, { name, smooth: 6 });
      });
    }
    const connections = [
      ["c5", "santos0"], ["santos2", "ivo2"], ["c7", "ivo0"],
      ["ivo4", "adhemar4"], ["adhemar0", "ledio0"], ["adhemar2", "ledio1"],
      ["adhemar4", "ledio4"], ["adhemar6", "ledio6"],
      ["ledio0", "koesa2"], ["ledio2", "koesa4"], ["koesa0", "adhemar0"],
    ];
    for (const [a, b] of connections) edge(a, b, "sj-local", { smooth: 6 });
  }

  function zone(x, z) {
    if (x < -779 && z > -325 && z < 520) {
      if (z < -36 && x > -883) return "Campinas · São José";
      if (z > 350) return "São José";
      return "Kobrasol · São José";
    }
    if (x < -659 && x >= -779 && z > -252 && z < 295) return "Capoeiras";
    return null;
  }

  function elevation(x, z, height) {
    const smooth = (a, b, v) => {
      const t = Math.min(1, Math.max(0, (v-a)/(b-a)));
      return t*t*(3-2*t);
    };
    const weight = (1-smooth(-775,-685,x))*smooth(-390,-310,z)*(1-smooth(835,910,z));
    const shoreHeight = 8+7*smooth(300,820,z)+2.0*Math.sin(z*.012+x*.006);
    return height+(Math.min(height,shoreHeight)-height)*weight;
  }

  return Object.freeze({ register, labels, zone, elevation });
})();
