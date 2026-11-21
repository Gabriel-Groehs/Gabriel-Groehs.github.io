/* Manezinho TA — modelos originais da frota e embarcações da Ilha. */
window.MTAFleet = (() => {
  "use strict";

  const colors = {
    street: [0x972c31, 0x48515d, 0x223e5c, 0xd4d8dc, 0x17191e],
    ltz: [0xf6f4f1],
    muscle: [0xf8ae25, 0xc83732, 0x212329, 0x414b60, 0xd8dbe2, 0x71846a],
    super: [0x95a93d, 0xf27729, 0xe4ba36, 0xa02731, 0x292b37, 0xe6e5df],
    truck: [0x65746a, 0x29485d, 0xddd9cb, 0x9f5532, 0x4e5057, 0x262b2f],
  };

  // Dimensions are in meters. Cab points are fractions of overall length.
  const fascia = {
    cruze: { nose: .83, tail: .89, grille: .48, lamp: "swept", rear: "swept" },
    eq: { nose: .9, tail: .94, grille: .63, lamp: "swept", rear: "swept" },
    compass: { nose: .92, tail: .93, grille: .59, slots: 7, lamp: "square", rear: "square" },
    camaro: { nose: .96, tail: .92, grille: .85, lamp: "square", rear: "round" },
    mustang: { nose: .91, tail: .89, grille: .69, lamp: "triple", rear: "triple" },
    raptor: { nose: .96, tail: .96, grille: .83, lamp: "bracket", rear: "bracket", offroad: true },
    ranger: { nose: .94, tail: .95, grille: .78, lamp: "bracket", rear: "bracket", offroad: true },
    aventador: { nose: .72, tail: .86, grille: .64, lamp: "fork", rear: "fork" },
    huracan: { nose: .79, tail: .89, grille: .57, lamp: "swept", rear: "line" },
    urus: { nose: .87, tail: .89, grille: .79, lamp: "fork", rear: "line" },
    ferrari: { nose: .77, tail: .88, grille: .58, lamp: "swept", rear: "round" },
    ferrari_458: { nose: .77, tail: .88, grille: .58, lamp: "swept", rear: "round" },
    porsche: { nose: .79, tail: .86, grille: .64, lamp: "round", rear: "line" },
    skyline: { nose: .94, tail: .93, grille: .62, lamp: "square", rear: "round" },
    audi: { nose: .92, tail: .9, grille: .72, lamp: "swept", rear: "line" },
    bmw: { nose: .91, tail: .91, grille: .52, slots: 2, lamp: "bracket", rear: "swept" },
    mercedes: { nose: .91, tail: .86, grille: .63, slots: 9, lamp: "swept", rear: "line" },
  };

  const cars = [
    // key, badge shown in-game, base physics class, fascia, length, width, height,
    // wheelbase, wheel radius, kg, acceleration, top speed (m/s), paint, rear wing.
    ["cruze", "Chevrolet Cruze · sedã", "garoupa", "cruze", 4.60, 1.79, 1.48, 2.68, .322, 1390, 12.5, 48, "street"],
    ["cruze_ltz_2014", "Chevrolet Cruze LTZ 2014 · branco com faixas", "garoupa", "cruze", 4.60, 1.797, 1.475, 2.685, .3285, 1427, 12.5, 54, "ltz"],
    ["equinox", "Chevrolet Equinox · SUV", "marlim", "eq", 4.65, 1.84, 1.66, 2.73, .36, 1640, 13.6, 51, "street"],
    ["compass", "Jeep Compass · SUV", "marlim", "compass", 4.40, 1.82, 1.64, 2.64, .35, 1570, 13.2, 49, "truck"],
    ["camaro_ss", "Chevrolet Camaro SS · V8", "tubarao", "camaro", 4.84, 1.92, 1.38, 2.85, .365, 1760, 20, 72, "muscle"],
    ["camaro_z28", "Chevrolet Camaro Z/28 · pista", "tubarao", "camaro", 4.85, 1.94, 1.36, 2.85, .35, 1740, 22, 77, "muscle", .09],
    ["camaro_zl1", "Chevrolet Camaro ZL1 · V8", "tubarao", "camaro", 4.81, 1.91, 1.34, 2.81, .355, 1770, 24, 82, "muscle", .24],
    ["mustang_gt", "Ford Mustang GT · V8", "tubarao", "mustang", 4.79, 1.92, 1.39, 2.72, .348, 1760, 20, 71, "muscle"],
    ["mustang_mach", "Ford Mustang Mach 1 · pista", "tubarao", "mustang", 4.78, 1.92, 1.38, 2.72, .35, 1790, 22, 74, "muscle", .10],
    ["mustang_shelby", "Ford Mustang Shelby GT500 · V8", "tubarao", "mustang", 4.83, 1.94, 1.38, 2.72, .36, 1900, 24, 82, "muscle", .29],
    ["f150_raptor", "Ford F-150 Raptor · 4×4", "siri", "raptor", 5.91, 2.20, 2.03, 3.70, .444, 2680, 15, 47, "truck"],
    ["f150_monster", "Ford F-150 Raptor R · off-road elevado", "siri", "raptor", 5.93, 2.24, 2.22, 3.70, .50, 2780, 18, 46, "truck"],
    ["ranger_raptor", "Ford Ranger Raptor · 4×4", "siri", "ranger", 5.36, 2.03, 1.93, 3.27, .419, 2440, 14.5, 46, "truck"],
    ["ranger_exped", "Ford Ranger Raptor · expedição", "siri", "ranger", 5.38, 2.06, 2.05, 3.27, .449, 2510, 14, 44, "truck"],
    ["aventador", "Lamborghini Aventador SVJ · V12", "espadarte", "aventador", 4.94, 2.10, 1.14, 2.70, .359, 1590, 29, 91, "super", .23],
    ["huracan", "Lamborghini Huracán · V10", "espadarte", "huracan", 4.57, 1.93, 1.17, 2.62, .354, 1500, 27, 87, "super", .07],
    ["urus", "Lamborghini Urus SE · SUV", "marlim", "urus", 5.123, 2.022, 1.638, 3.003, .39, 2500, 21, 81, "super"],
    ["ferrari", "Ferrari 488 · GT", "arraia", "ferrari", 4.57, 1.95, 1.21, 2.65, .356, 1475, 27, 88, "super"],
    ["ferrari_458", "Ferrari 458 · conversível", "espadarte", "ferrari_458", 4.527, 1.937, 1.213, 2.65, .35, 1485, 25, 87, "super"],
    ["porsche", "Porsche 911 GT3 · flat-six", "anchova", "porsche", 4.57, 1.85, 1.28, 2.46, .351, 1450, 25, 84, "super", .26],
    ["skyline", "Nissan Skyline GT-R · cupê", "moreia", "skyline", 4.60, 1.79, 1.36, 2.67, .334, 1560, 21, 70, "street", .25],
    ["audi", "Audi RS 5 · cupê", "anchova", "audi", 4.72, 1.87, 1.37, 2.77, .353, 1740, 22, 74, "street"],
    ["bmw", "BMW M4 · cupê", "anchova", "bmw", 4.79, 1.89, 1.39, 2.86, .353, 1750, 23, 76, "street"],
    ["mercedes", "Mercedes-AMG GT · cupê", "anchova", "mercedes", 4.73, 1.98, 1.35, 2.70, .36, 1860, 24, 82, "street", .09],
  ];

  const moorings = [
    ["pirata_escuna", -124, 49, -Math.PI / 2, 0x683f29],
    ["pirata_brigue", -210, -261, -Math.PI / 2, 0x332d29],
    ["pirata_escuna", 628, -1539, Math.PI, 0x753e2e],
  ];

  function register(catalog) {
    for (const [key, name, baseKey, design, length, width, height,
      wheelbase, radius, mass, accel, top, palette, wing = 0] of cars) {
      const base = catalog[baseKey];
      const lift = Math.max(0, radius - base.wr);
      const belt = (base.yb / base.H) * height + lift * .25;
      catalog[key] = {
        ...base, name, model: key,
        muscle: false, jdm: false, gtr: false, wedge: false,
        L: length, Wd: width, H: height, yb: belt,
        wb: wheelbase, wr: radius, mass, accel, top,
        seat: { ...base.seat, y: base.seat.y + lift },
        colors: colors[palette],
        customBody: { ...fascia[design], design, wing },
        paintClearcoat: true,
      };
    }
    for (const key of ["tubarao", "marlim", "bernuncia", "taxi", "berbigao"]) {
      catalog[key].legacyPaint = true;
    }
    catalog.viatura_classica = {
      ...catalog.viatura,
      name: "Viatura da Polícia da Ilha · clássica",
      legacyPaint: true,
    };
    catalog.cruze_ltz_2014.mirrorWidth = 2.098;
    catalog.cruze_ltz_2014.headlightGlow = .80;
    catalog.cruze_ltz_2014.detailRange = 15;
    Object.assign(catalog.ferrari_458, {
      seat: { x:.365, y:.265, z:-.055, s:.590 }, detailRange: 9, headlightGlow: .79,
    });
    catalog.boeing_737 = {
      ...catalog.tecoteco, name: "Boeing 737 · jato comercial", prop: false, airliner: true,
      L: 35, Wd: 3.8, H: 11.1, wb: 11.7, wr: .475,
      mass: 42000, accel: 9.6, top: 105, brake: 18, steer: .44, engine: .83, tough: 3.5,
      stall: 28, vr: 35, cam: 35,
      seat: { x: .62, y: 4.15, z: 12.3, s: .78 },
      colors: [0xf7f5f0],
    };
    catalog.pirata_escuna = {
      ...catalog.traineira, name: "Escuna Pirata da Ilha", model: "pirata_escuna",
      pirate: 2, L: 15.8, Wd: 4.5, H: 9, mass: 18500, accel: 3.1,
      top: 11.5, brake: 3.8, steer: .48, cam: 21,
      seat: { x: .54, y: 1.9, z: -4.6, s: .86 },
      colors: [0x683f29, 0x753e2e, 0x4a3429],
    };
    catalog.pirata_brigue = {
      ...catalog.traineira, name: "Galeão Corsário das Baías", model: "pirata_brigue",
      pirate: 3, L: 22, Wd: 6.15, H: 13, mass: 36000, accel: 2.6,
      top: 10.4, brake: 3.2, steer: .36, cam: 28,
      seat: { x: .48, y: 2.4, z: -7.4, s: .88 },
      colors: [0x332d29, 0x53372c],
    };
    catalog.bicicleta_urbana = {
      ...catalog.bicicleta, name: "Bicicleta urbana · quadro de aço",
      mass: 91, top: 10.5, colors: [0x40395b, 0x4b746d, 0xab4f3c, 0xbca58c],
    };
    catalog.patinete = {
      ...catalog.bicicleta, name: "Patinete elétrico urbano", bike: false, scooter: true,
      L: 1.19, Wd: .48, H: 1.15, yb: .48, wb: .87, wr: .126,
      mass: 94, accel: 4.8, top: 7.5, brake: 10, grip: 8.5, steer: .85,
      engine: .06, cam: 4.9, seat: { x: 0, y: .815, z: -.13, s: .86 },
      colors: [0x5b646a, 0x4e807b, 0x615184, 0xe2973d],
    };
    return catalog;
  }

  function traffic(regular, premium) {
    regular.push(["cruze", 3.4], ["equinox", 1.05], ["compass", 1.25],
      ["camaro_ss", 8.2], ["camaro_z28", .23], ["camaro_zl1", .30],
      ["mustang_gt", .85], ["mustang_mach", .26], ["mustang_shelby", .21],
      ["f150_raptor", .72], ["f150_monster", .24], ["ranger_raptor", 1.15],
      ["ranger_exped", .43], ["audi", .5], ["bmw", .53], ["mercedes", .23],
      ["skyline", .35], ["urus", .22]);
    premium.push(["camaro_ss", 4.1], ["camaro_zl1", .65], ["mustang_mach", .5],
      ["mustang_shelby", .55], ["f150_raptor", .45], ["ranger_raptor", .46],
      ["aventador", .64], ["huracan", .80], ["urus", .82], ["ferrari", .78],
      ["porsche", .90], ["audi", .85], ["bmw", .80], ["mercedes", .70], ["skyline", .48]);
    for (const pool of [regular,premium]) {
      // Keep the relative weights of the remaining vehicles as a single share.
      const other = pool.reduce((sum,[,weight]) => sum+weight,0);
      pool.push(["ferrari_458",25*other],["cruze_ltz_2014",15*other]);
    }
  }


  // Stations describe the body from tail to nose: length, width, shoulder and crown.
  const sportBodies = {
    porsche: {
      cabin: [ .45, .08, -.36, -.83 ], glass: [.76, .72, .75, .65], round: .146,
      stations: [[-1,.76,.548,.025],[-.88,.89,.584,.086],[-.59,1.025,.63,.037],
        [-.2,.958,.615,.036],[.26,.927,.60,.051],[.60,.991,.597,-.034],[.84,.944,.560,-.056],[1,.758,.443,.041]],
    },
    skyline: {
      cabin: [ .43, .015, -.45, -.75 ], glass: [.79, .77, .82, .71], round: .067,
      stations: [[-1,.885,.630,.023],[-.87,.945,.655,.031],[-.57,1.014,.651,.032],
        [-.16,.962,.643,.028],[.28,.957,.636,.033],[.59,1.006,.611,.034],[.83,.958,.580,.029],[1,.855,.544,.025]],
    },
    audi: {
      cabin: [ .46, .09, -.35, -.82 ], glass: [.80, .73, .80, .65], round: .113,
      stations: [[-1,.820,.593,.033],[-.85,.936,.628,.056],[-.59,1.011,.647,.058],
        [-.17,.960,.628,.043],[.27,.956,.622,.048],[.60,1,.604,.037],[.85,.938,.557,.058],[1,.849,.503,.034]],
    },
    bmw: {
      cabin: [ .37, -.075, -.40, -.77 ], glass: [.80, .72, .80, .69], round: .095,
      stations: [[-1,.865,.613,.033],[-.85,.955,.637,.042],[-.60,1.016,.650,.052],
        [-.17,.955,.638,.046],[.28,.956,.637,.056],[.60,1.006,.628,.067],[.84,.952,.579,.066],[1,.846,.511,.040]],
    },
    mercedes: {
      cabin: [ .215, -.20, -.475, -.88 ], glass: [.76, .72, .75, .61], round: .172,
      stations: [[-1,.746,.548,.028],[-.87,.891,.600,.071],[-.59,1.018,.640,.077],
        [-.20,.938,.635,.053],[.27,.949,.613,.045],[.60,1,.587,.043],[.84,.945,.532,.064],[1,.768,.470,.039]],
    },
  };

  function sampleBody(stations, progress, field) {
    const end = stations.length - 1;
    let hi = 1;
    while (hi < end && progress > stations[hi][0]) hi++;
    const a = stations[hi - 1], b = stations[hi];
    const p = stations[Math.max(0, hi - 2)], n = stations[Math.min(end, hi + 1)];
    const interval = b[0] - a[0];
    const t = (progress - a[0]) / interval;
    const m0 = (b[field] - p[field]) / (b[0] - p[0]) * interval;
    const m1 = (n[field] - a[field]) / (n[0] - a[0]) * interval;
    return a[field] + t * (m0 + t * (3 * (b[field] - a[field]) - 2 * m0 - m1
      + t * (2 * (a[field] - b[field]) + m0 + m1)));
  }

  function buildRoadGeometry(car, tools) {
    const { Builder, box, cyl8, cyl12, cyl16, matrix, tint } = tools;
    const paint = new Builder(), glass = new Builder(), trim = new Builder(), wheel = new Builder();
    const length = car.L, beam = car.Wd, half = length * .5;
    const roof = car.H, belt = car.yb, tire = car.wr, arch = tire + .061;
    const design = car.customBody;
    const sport = sportBodies[design.design];
    if (sport) {
      const [zFB, zFT, zRT, zRB] = sport.cabin.map(value => value * half);
      car.cab = { zFB, zFT, zRT, zRB, yr: roof };
    }
    const warmWhite = [1, 1, 1];
    const dark = tint(0x1b2025), soft = tint(0x323840), chrome = tint(0x9aa2a7);
    const plate = tint(0xd5d6cf);
    const pickup = car.kind === "pickup";
    const suv = car.kind === "suv";
    const low = car.kind === "super";
    const roofWidth = beam * (sport ? sport.glass[0] * .5 : pickup || suv ? .433 : low ? .359 : .383);
    const axles = [-car.wb * .5, car.wb * .5];
    const mix = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function section(z) {
      const p = z / half;
      const f = Math.max(0, (Math.abs(p) - .48) / .52);
      const nearest = Math.min(...axles.map(at => Math.abs(at - z)));
      const flare = .011 * Math.exp(-((nearest / .34) ** 2));
      const width = beam * .5 * (sport ? sampleBody(sport.stations, p, 1)
        : 1 - (1 - (p > 0 ? design.nose : design.tail)) * f ** 2 + flare);
      const shoulder = sport ? roof * sampleBody(sport.stations, p, 2)
        : belt - (p > 0 ? (low ? .18 : .1) : .067) * f ** 1.6;
      const crown = sport ? roof * sampleBody(sport.stations, p, 3) : .064 * (low ? 1.1 : 1);
      const sill = Math.max(.18, tire * (pickup ? .79 : .68));
      const entry = nearest < arch ? tire + Math.sqrt(arch ** 2 - nearest ** 2) : sill;
      return { width, shoulder, sill, crown, archY: clamp(entry, sill, shoulder - .031) };
    }

    const steps = new Set();
    for (let i = 0; i <= 44; i++) steps.add(-half + length * i / 44);
    if (sport) for (const point of sport.stations) steps.add(point[0] * half);
    for (const axle of axles) {
      for (let i = 0; i <= 14; i++) {
        const z = axle + arch * Math.cos(i / 14 * Math.PI);
        if (z > -half && z < half) steps.add(z);
      }
      for (const side of [-1, 1]) if (Math.abs(axle + side * (arch + .012)) < half) {
        steps.add(axle + side * (arch + .012));
      }
    }
    const stations = [...steps].sort((a, b) => a - b);
    const sillAt = (s, q) => q < .06 ? s.archY : mix(s.archY, s.shoulder, q);
    const roundedEnd = (z, fraction) => {
      if (!sport) return z;
      const p = z / half;
      return z - Math.sign(p) * sport.round * fraction ** 2 * Math.max(0, (Math.abs(p) - .76) / .24) ** 2;
    };
    const sidePoint = (z, sign, q) => {
      const s = section(z);
      const flare = .897 + .095 * Math.sin(Math.PI * q * .82);
      return [sign * s.width * flare, sillAt(s, q), roundedEnd(z, 1)];
    };
    const deckPoint = (z, fraction) => {
      const s = section(z);
      return [
        fraction * sidePoint(z, 1, 1)[0],
        s.shoulder + s.crown * (1 - fraction ** 2),
        roundedEnd(z, fraction),
      ];
    };
    const endPoint = (sign, fraction, level, lift = 0) => {
      const z = sign * half;
      const end = section(z);
      const top = deckPoint(z, fraction);
      return [top[0] * mix(.94, 1, level), mix(end.sill, top[1], level),
        top[2] + sign * (lift - .065 * (1 - level))];
    };

    for (let i = 1; i < stations.length; i++) {
      const a = stations[i - 1], b = stations[i];
      for (const sign of [-1, 1]) {
        for (let j = 1; j <= 5; j++) {
          const lo = (j - 1) / 5, hi = j / 5;
          const p = [sidePoint(a, sign, lo), sidePoint(b, sign, lo),
            sidePoint(b, sign, hi), sidePoint(a, sign, hi)];
          paint.quad(...(sign === 1 ? p.slice().reverse() : p), warmWhite);
        }
      }
      if (sport) {
        const inner = (z, sign) => [section(z).width * .63 * sign, section(z).sill - .026, z];
        trim.quad(inner(a, -1), inner(b, -1), inner(b, 1), inner(a, 1), dark);
        trim.quad(inner(a, 1), inner(b, 1), inner(b, -1), inner(a, -1), dark);
        for (const sign of [-1, 1]) {
          const outerA = sidePoint(a, sign, 0), outerB = sidePoint(b, sign, 0);
          const edgeA = [outerA[0] * .67, outerA[1] - .025, outerA[2]];
          const edgeB = [outerB[0] * .67, outerB[1] - .025, outerB[2]];
          const archLiner = [outerA, outerB, edgeB, edgeA];
          const wall = [edgeA, edgeB, inner(b, sign), inner(a, sign)];
          trim.quad(...(sign > 0 ? archLiner : archLiner.slice().reverse()), dark);
          trim.quad(...(sign > 0 ? wall : wall.slice().reverse()), dark);
        }
      }
      // The cabin covers the center of the belt, while exposed sections form the hood and deck.
      const midpoint = (a + b) / 2;
      for (let j = 1; j <= 12; j++) {
        const left = (j - 1) / 6 - 1, right = j / 6 - 1;
        if (midpoint < car.cab.zFB && midpoint > car.cab.zRB && Math.abs(left) < .68 && Math.abs(right) < .68) continue;
        if (pickup && midpoint < car.cab.zRB && Math.abs(left) < .73 && Math.abs(right) < .73) continue;
        paint.quad(deckPoint(a, left), deckPoint(b, left),
          deckPoint(b, right), deckPoint(a, right), warmWhite);
      }
    }
    for (const side of [-1, 1]) {
      const z = side * half;
      for (let j = 1; j <= 10; j++) {
        const a = (j - 1) / 5 - 1, b = j / 5 - 1;
        const topA = deckPoint(z, a), topB = deckPoint(z, b);
        const lowA = endPoint(side, a, 0), lowB = endPoint(side, b, 0);
        const panel = [lowA, lowB, topB, topA];
        paint.quad(...(side === 1 ? panel : panel.slice().reverse()), warmWhite);
      }
    }

    const fg = car.cab.zFB, rg = car.cab.zRB;
    const fRoof = car.cab.zFT, rRoof = car.cab.zRT;
    const baseY = belt + .015;
    const glassY = roof - .059;
    const innerFront = section(fg).width * (sport ? sport.glass[2] : .86);
    const innerRear = section(rg).width * (sport ? sport.glass[3] : .86);
    const roofPoint = (z, f) => {
      const t = (z - rRoof) / (fRoof - rRoof);
      const width = sport ? mix(roofWidth * sport.glass[1] / sport.glass[0], roofWidth, t) : roofWidth;
      const shape = sport ? f ** 2 * mix(-.038, -.060, t) : 0;
      return [f * width, glassY + .058 * (1 - f ** 2) + shape * .21, z + shape];
    };
    const topCorner = (sign, z) => roofPoint(z, sign);
    const baseCorner = (sign, z, width) =>
      [sign * width, sport ? section(z).shoulder + .014 : baseY, z];
    for (let k = 1; k <= 8; k++) {
      const a = (k - 1) / 4 - 1, b = k / 4 - 1;
      paint.quad(roofPoint(rRoof, a), roofPoint(fRoof, a),
        roofPoint(fRoof, b), roofPoint(rRoof, b), warmWhite);
    }

    const bottomFrontL = baseCorner(-1, fg, innerFront), bottomFrontR = baseCorner(1, fg, innerFront);
    const bottomRearL = baseCorner(-1, rg, innerRear), bottomRearR = baseCorner(1, rg, innerRear);
    function windscreen(edge, roofEdge, width, direction) {
      const at = (f, t) => {
        const top = roofPoint(roofEdge, f), base = baseCorner(f, edge, width);
        const curve = sport ? (1 - f * f) * .072 : 0;
        return [mix(base[0], top[0], t), mix(base[1], top[1], t) + curve * .38,
          mix(base[2], top[2], t) + direction * curve];
      };
      const span = sport ? 10 : 1, rows = sport ? 4 : 1;
      for (let j = 0; j < span; j++) {
        const left = -direction + direction * j * 2 / span;
        const right = -direction + direction * (j + 1) * 2 / span;
        for (let row = 0; row < rows; row++) {
          glass.quad(at(left, row / rows), at(right, row / rows),
            at(right, (row + 1) / rows), at(left, (row + 1) / rows), warmWhite);
        }
      }
    }
    windscreen(fg, fRoof, innerFront, 1);
    windscreen(rg, rRoof, innerRear, -1);

    const bar = (a, b, radius, color) =>
      trim.add(cyl8, tools.between(...a, ...b, radius), color);
    for (const sign of [-1, 1]) {
      const frontCorner = baseCorner(sign, fg, innerFront);
      const rearCorner = baseCorner(sign, rg, innerRear);
      const topFront = topCorner(sign, fRoof);
      const topRear = topCorner(sign, rRoof);
      const points = [frontCorner, topFront, topRear, rearCorner];
      glass.quad(...(sign === 1 ? points : points.slice().reverse()), warmWhite);
      bar(frontCorner, topFront, pickup ? .042 : .026, soft);
      bar(rearCorner, topRear, .031, soft);
      bar(frontCorner, rearCorner, .014, dark);
      bar(topFront, topRear, .016, soft);
      const pillarBottom = frontCorner.map((value, axis) => mix(value, rearCorner[axis], .53));
      const pillarTop = topFront.map((value, axis) => mix(value, topRear[axis], .47));
      bar(pillarBottom, pillarTop, .019, dark);
      const mirrorX = innerFront * sign;
      const mirrorY = frontCorner[1] + .087;
      trim.add(box, matrix(mirrorX * 1.15, mirrorY, fg - .14, sign * .22, .17, .083, .12), soft);
      trim.add(box, matrix(mirrorX * 1.15, mirrorY, fg - .201, sign * .22, .128, .052, .016), chrome);

      const seatX = sign * beam * .20, seatZ = car.seat.z - .12;
      trim.add(box, matrix(seatX, car.seat.y - .01, seatZ, 0, beam * .236, .105, .47), soft);
      trim.add(box, matrix(seatX, car.seat.y + .27, seatZ - .24, 0, beam * .221, .52, .11, -.17), soft);
      trim.add(box, matrix(seatX, car.seat.y + .58, seatZ - .28, 0, .17, .14, .091), dark);
    }
    bar(bottomFrontL, bottomFrontR, .019, dark);
    bar(bottomRearL, bottomRearR, .017, dark);

    let steeringGeo = null, steeringPivot = null;
    if (sport) {
      const dashboardY = section(fg).shoulder - .033;
      trim.add(box, matrix(0, dashboardY, fg - .135, 0, innerFront * 1.94, .138, .255, -.105), dark);
      trim.add(box, matrix(0, dashboardY - .09, -.27, 0, .177, .18, (fg - rg) * .55), soft);
      trim.add(box, matrix(car.seat.x, dashboardY + .038, fg - .223, 0, .31, .075, .111), soft);
      trim.add(box, matrix(car.seat.x, dashboardY + .017, fg - .29, 0, .263, .025, .009), tint(0x797e76));
      steeringPivot = [car.seat.x, dashboardY - .017, Math.min(fg - .30, car.seat.z + .30)];
      bar([car.seat.x, dashboardY - .080, fg - .174], steeringPivot, .028, dark);
      const wheelBuilder = new Builder();
      const rim = [];
      for (let i = 0; i <= 16; i++) {
        const phase = i / 16 * Math.PI * 2;
        rim.push([Math.sin(phase) * .142, Math.cos(phase) * .124, 0]);
      }
      for (let i = 1; i < rim.length; i++) {
        wheelBuilder.add(cyl8, tools.between(...rim[i - 1], ...rim[i], .016), dark);
      }
      for (const spoke of [4, 8, 12]) {
        wheelBuilder.add(cyl8, tools.between(0, 0, 0, ...rim[spoke], .015), soft);
      }
      wheelBuilder.add(box, matrix(0, -.004, -.007, 0, .105, .062, .030), dark);
      steeringGeo = wheelBuilder.build();
    }

    if (pickup) {
      const bedEnd = -half + .11;
      const bedStart = rg - .13;
      trim.add(box, matrix(0, belt - .31, (bedEnd + bedStart) * .5, 0, beam * .78, .083, bedStart - bedEnd), dark);
      for (let i = -3; i <= 3; i++) {
        trim.add(box, matrix(i * beam * .102, belt - .26, (bedEnd + bedStart) * .5,
          0, .014, .022, bedStart - bedEnd - .1), soft);
      }
      trim.add(box, matrix(0, belt - .20, bedEnd, 0, beam * .78, .25, .045), soft);
    }
    for (const sign of sport ? [] : [-1, 1]) {
      const y = Math.max(.41, tire + .096);
      trim.add(box, matrix(0, y, sign * (half + .036), 0, .40, .092, .022), plate);
      trim.add(box, matrix(0, y + .04, sign * (half + .048), 0, .39, .017, .004), tint(0x244873));
    }
    const rim = tire * .695;
    const tw = pickup || low ? .29 : .227;
    const wheelPart = (r, h, color) =>
      wheel.add(cyl16, matrix(0, 0, 0, 0, 2 * r, h, 2 * r, 0, Math.PI / 2), color);
    wheelPart(tire, tw, tint(0x1c1f23));
    wheelPart(rim, tw + .014, chrome);
    wheelPart(rim * .83, tw + .029, soft);
    const sportSpokes = { porsche: 10, skyline: 6, audi: 5, bmw: 10, mercedes: 7 };
    const spokes = sportSpokes[design.design] ?? (pickup ? 6 : design.design === "mustang" ? 5 : 9);
    for (let j = 0; j < spokes; j++) {
      const angle = j / spokes * Math.PI * 2;
      wheel.add(box, matrix(0, rim * .53 * Math.cos(angle), rim * .53 * Math.sin(angle),
        0, tw + .045, rim * .81, .027, angle), chrome);
    }
    wheelPart(rim * .26, tw + .053, soft);
    if (sport) {
      addSportDetails(trim, car, { box, cyl8, cyl16, matrix, tint, between: tools.between }, section, sidePoint);
    } else {
      addRoadTrim(trim, car, { box, cyl8, matrix, tint });
    }

    // Weld shading normals along shared samples while keeping true panel edges.
    const geometry = paint.build();
    const pos = geometry.attributes.position, normals = geometry.attributes.normal;
    const groups = new Map();
    for (let j = 0; j < pos.count; j++) {
      const key = [pos.getX(j), pos.getY(j), pos.getZ(j)].map(v => Math.round(v * 10000)).join("/");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(j);
    }
    for (const indices of groups.values()) {
      const originals = indices.map(j => [normals.getX(j), normals.getY(j), normals.getZ(j)]);
      for (let j = 0; j < indices.length; j++) {
        let x = 0, y = 0, z = 0;
        const [a, b, c] = originals[j];
        for (const [nx, ny, nz] of originals) {
          if (a * nx + b * ny + c * nz < .65) continue;
          x += nx;
          y += ny;
          z += nz;
        }
        const size = Math.hypot(x, y, z) || 1;
        normals.setXYZ(indices[j], x / size, y / size, z / size);
      }
    }
    const lights = sport ? sportLights(trim, car, { Builder, box, cyl16, matrix, tint }, endPoint, deckPoint)
      : buildLights(car, { Builder, box, cyl16, matrix, tint });
    return {
      paintGeo: geometry, glassGeo: glass.build(), trimGeo: trim.build(), ...lights,
      wheelGeo: wheel.build(), tw, steeringGeo, steeringPivot,
    };
  }

  function addSportDetails(out, car, tools, section, sidePoint) {
    const { box, cyl8, cyl16, matrix, tint, between } = tools;
    const { design, wing } = car.customBody;
    const edge = car.L * .5;
    const beam = car.Wd;
    const satin = tint(0x525962), rubber = tint(0x191d22), silver = tint(0x9fa7b1);
    const exhausts = {
      porsche: [-.09, .09], skyline: [.51], audi: [-.62, .62],
      bmw: [-.62, -.49, .49, .62], mercedes: [-.63, -.50, .50, .63],
    };
    for (const sign of [-1, 1]) {
      const doorEnd = car.cab.zRT * .82 + car.cab.zRB * .18;
      const doorStart = car.cab.zFB - .055;
      const behind = (doorEnd + doorStart) * .5 - .19;
      const handle = sidePoint(behind, sign, .83);
      out.add(box, matrix(handle[0] + .011 * sign, handle[1], behind, 0, .024, .028, .143), satin);
      for (const z of [doorEnd, doorStart]) {
        const shape = [.06, .35, .67, .95].map(level => {
          const p = sidePoint(z, sign, level);
          p[0] += .0055 * sign;
          return p;
        });
        for (let i = 1; i < shape.length; i++) {
          out.add(cyl8, between(...shape[i - 1], ...shape[i], .0039), rubber);
        }
      }
      const trimAt = section(doorEnd);
      const rockerY = car.wr * .71;
      out.add(box, matrix(sign * trimAt.width * .934, rockerY, 0, 0, .092, .056,
        car.wb - car.wr * 2.45), rubber);
      if (design === "bmw" || design === "mercedes") {
        const z = car.wb * .5 - car.wr - .19;
        const vent = sidePoint(z, sign, .74);
        out.add(box, matrix(vent[0] + .004 * sign, vent[1], z, sign * .085, .022, .074, .194), rubber);
        out.add(box, matrix(vent[0] + .018 * sign, vent[1] - .012, z, sign * .085, .01, .009, .144), silver);
      }
    }
    if (wing) {
      const z = -edge + .25, supportY = section(z).shoulder;
      for (const sign of [-1, 1]) {
        const x = sign * beam * .26;
        out.add(cyl8, between(x, supportY - .015, z + .06,
          x, supportY + wing, z - .055, .026), rubber);
        if (wing > .15) {
          out.add(box, matrix(sign * beam * .413, supportY + wing, z - .033,
            0, .030, .104, .295, -.13), satin);
        }
      }
      out.add(box, matrix(0, supportY + wing, z - .052,
        0, beam * .83, .040, .248, -.09), rubber);
    }
    for (const offset of exhausts[design]) {
      const x = offset * beam * .5;
      const y = section(-edge).sill + .032;
      const diameter = design === "audi" ? .113 : .085;
      out.add(cyl16, matrix(x, y, -edge + .013, 0, diameter, .115, diameter * .79, Math.PI / 2), silver);
      out.add(cyl16, matrix(x, y, -edge - .048, 0, diameter * .79, .006, diameter * .68, Math.PI / 2), rubber);
    }
  }

  function sportLights(trim, car, tools, endPoint, deckPoint) {
    const { Builder, cyl16, matrix, tint } = tools;
    const front = new Builder(), back = new Builder();
    const dark = tint(0x15191d), frame = tint(0x333940), silver = tint(0x66707a);
    const white = tint(0xeaf3ff), red = tint(0xc9232f);
    const style = car.customBody.design;
    const lampOutlines = {
      skyline: [[.35,.76],[.45,.94],[.95,.93],[.98,.72],[.76,.65],[.37,.66]],
      audi: [[.56,.91],[.95,.96],[.99,.73],[.80,.66],[.60,.79]],
      bmw: [[.49,.89],[.89,.97],[.98,.81],[.91,.72],[.64,.67],[.50,.73]],
      mercedes: [[.51,.88],[.77,.98],[.97,.89],[.97,.72],[.68,.70],[.50,.79]],
    };
    const rearOutlines = {
      audi: [[.30,.79],[.65,.84],[.94,.92],[.96,.76],[.67,.66],[.32,.67]],
      bmw: [[.35,.80],[.70,.88],[.96,.94],[.95,.72],[.78,.67],[.37,.69]],
      mercedes: [[.22,.85],[.94,.92],[.98,.78],[.83,.74],[.23,.77]],
    };

    function shape(builder, sign, points, paint, lift = .016) {
      const area = points.reduce((sum, p, i) => {
        const n = points[(i + 1) % points.length];
        return sum + p[0] * n[1] - p[1] * n[0];
      }, 0);
      const nodes = points.map(([x, y]) => endPoint(sign, x, y, lift));
      if (Math.sign(area) !== sign) nodes.reverse();
      const center = nodes.reduce((sum, p) => sum.map((n, i) => n + p[i] / nodes.length), [0, 0, 0]);
      for (let i = 0; i < nodes.length; i++) builder.tri(center, nodes[i], nodes[(i + 1) % nodes.length], paint);
    }
    function two(builder, sign, points, paint, lift) {
      for (const side of [-1, 1]) shape(builder, sign, points.map(([x, y]) => [x * side, y]), paint, lift);
    }
    function strip(builder, sign, left, right, y, thick, paint, lift) {
      shape(builder, sign, [[left,y],[right,y],[right,y+thick],[left,y+thick]], paint, lift);
    }

    if (style === "porsche") {
      shape(trim, 1, [[-.69,.13],[.69,.13],[.77,.38],[.42,.51],[-.42,.51],[-.77,.38]], dark);
      for (let y = .22; y < .46; y += .07) strip(trim, 1, -.64, .64, y, .015, frame, .027);
      const half = car.L / 2;
      for (const sign of [-1, 1]) {
        const points = [];
        const center = deckPoint(half * .77, sign * .79);
        const at = angle => {
          const p = deckPoint(half * .77 + .26 * Math.cos(angle), sign * .79 + .161 * Math.sin(angle));
          p[1] += .022;
          return p;
        };
        center[1] += .028;
        for (let i = 0; i < 20; i++) points.push(at(i * Math.PI / 10));
        for (let i = 0; i < points.length; i++) {
          const p = points[i], q = points[(i + 1) % points.length];
          trim.tri(center, p, q, silver);
          const inner = point => point.map((value, axis) => center[axis] + (value - center[axis]) * .83 + (axis === 1 ? .007 : 0));
          front.tri([center[0],center[1]+.007,center[2]], inner(p), inner(q), white);
        }
      }
      strip(trim, -1, -.94, .94, .72, .15, dark, .013);
      strip(back, -1, -.84, .84, .78, .058, red, .026);
    } else {
      const lights = lampOutlines[style];
      two(trim, 1, lights, dark, .018);
      const center = lights.reduce((sum, [x, y]) => [sum[0] + x / lights.length, sum[1] + y / lights.length], [0, 0]);
      two(front, 1, lights.map(([x, y]) => [center[0] + (x - center[0]) * .86,
        center[1] + (y - center[1]) * .62]), white, .027);
      if (style === "audi") {
        shape(trim, 1, [[-.44,.15],[.44,.15],[.65,.57],[.50,.82],[-.50,.82],[-.65,.57]], silver);
        shape(trim, 1, [[-.41,.183],[.41,.183],[.611,.57],[.479,.77],[-.479,.77],[-.611,.57]], dark, .023);
        for (let row = 0; row < 5; row++) {
          const y = .24 + .099 * row;
          for (let j = -4; j <= 4; j++) {
            const x = j * .105 + (row % 2) * .032;
            shape(trim, 1, [[x-.046,y],[x-.032,y+.021],[x+.023,y+.021],[x+.040,y]], frame, .031);
          }
        }
      } else if (style === "bmw") {
        two(trim, 1, [[.025,.72],[.10,.87],[.39,.84],[.46,.69],[.41,.25],[.25,.12],[.065,.15]], silver);
        two(trim, 1, [[.047,.71],[.116,.82],[.37,.79],[.43,.68],[.38,.28],[.24,.17],[.09,.19]], dark, .024);
        for (let y = .25; y < .75; y += .083) {
          const w = .29 + y * .15;
          two(trim, 1, [[.063,y],[w,y],[w,y+.016],[.063,y+.016]], frame, .032);
        }
      } else if (style === "mercedes") {
        shape(trim, 1, [[-.45,.13],[.45,.13],[.66,.65],[.52,.79],[-.52,.79],[-.66,.65]], silver);
        shape(trim, 1, [[-.43,.17],[.43,.17],[.615,.65],[.49,.74],[-.49,.74],[-.615,.65]], dark, .025);
        for (let j = -5; j <= 5; j++) {
          const x = j * .09;
          shape(trim, 1, [[x-.008,.21],[x+.008,.21],[x*1.27+.010,.70],[x*1.27-.010,.70]], silver, .034);
        }
      } else {
        strip(trim, 1, -.36, .36, .722, .15, dark, .017);
        strip(trim, 1, -.35, .35, .76, .021, silver, .027);
        shape(trim, 1, [[-.68,.16],[.68,.16],[.59,.54],[-.59,.54]], dark);
        for (let y = .24; y <= .46; y += .075) strip(trim, 1, -.56, .56, y, .015, frame, .026);
      }

      if (style === "skyline") {
        strip(trim, -1, -.93, .93, .56, .31, dark, .014);
        for (const sign of [-1, 1]) for (const x of [.54, .77]) {
          const p = endPoint(-1, x * sign, .737, .024);
          const radius = x > .65 ? .148 : .119;
          trim.add(cyl16, matrix(p[0],p[1],p[2],0,radius+.020,.026,radius+.020,Math.PI/2), frame);
          back.add(cyl16, matrix(p[0],p[1],p[2]-.019,0,radius,.015,radius,Math.PI/2), red);
        }
      } else {
        const outline = rearOutlines[style];
        two(trim, -1, outline, dark, .015);
        two(back, -1, outline.map(([x,y]) => [.64 + (x-.64) * .93, .78 + (y-.78) * .65]), red, .024);
      }
    }
    two(trim, 1, [[.70,.20],[.92,.20],[.96,.52],[.74,.56]], dark, .018);
    two(trim, -1, [[.23,.10],[.84,.11],[.87,.29],[.25,.27]], dark, .018);
    // The plate is modeled as part of the bumper so its curvature follows the face.
    for (const sign of [-1, 1]) {
      strip(trim, sign, -.24, .24, .34, .135, tint(0xd5d6cf), .033);
      strip(trim, sign, -.23, .23, .441, .027, tint(0x244873), .036);
    }
    return { lampGeo: front.build(), tailGeo: back.build() };
  }

  function addRoadTrim(out, car, tools) {
    const { box, cyl8, matrix, tint } = tools;
    const profile = car.customBody;
    const front = car.L / 2;
    const halfWidth = car.Wd / 2;
    const bumper = Math.max(.44, car.wr + .13);
    const top = Math.max(bumper + .08, car.yb - (car.kind === "super" ? .25 : .28));
    const low = car.kind === "super" || car.kind === "sport";
    const dark = tint(0x191c20);
    const satin = tint(0x4a4d51);
    const grilleWidth = car.Wd * profile.grille;

    out.add(box, matrix(0, top, front + .022, 0, grilleWidth, low ? .15 : .25, .055), dark);
    if (profile.slots) {
      for (let i = 0; i < profile.slots; i++) {
        const x = grilleWidth * ((i + .5) / profile.slots - .5);
        out.add(box, matrix(x, top, front + .057, 0, profile.slots === 2 ? .048 : .013, .16, .025), satin);
      }
    } else {
      for (let i = -1; i <= 1; i++) {
        out.add(box, matrix(0, top + i * .036, front + .056, 0, grilleWidth * .96, .008, .015), satin);
      }
    }

    for (const side of [-1, 1]) {
      const doorZ = car.cab.zFT * .42 + car.cab.zRT * .58;
      out.add(box, matrix(side * (halfWidth * .976), car.yb - .11, doorZ, 0, .02, .038, .135), satin);
      const lowerLip = car.wr * .71;
      out.add(box, matrix(side * (halfWidth * .92), lowerLip, 0, 0,
        profile.offroad ? .19 : .08, .06, car.wb - car.wr * 2.2), dark);
      if (!profile.offroad) continue;
      out.add(box, matrix(side * (halfWidth * .90), car.yb + .005, -front * .60, 0, .13, .07, front * .63), dark);
      out.add(cyl8, matrix(side * (halfWidth * .70), bumper - .13, -front - .04, 0, .117, .13, .117, Math.PI / 2), satin);
      for (const axle of [-1, 1]) {
        // Thin arch lips leave most of the wheel and its suspension visible.
        for (let i = 0; i <= 10; i++) {
          const angle = .14 + i * (Math.PI - .28) / 10;
          const radius = car.wr + .085;
          out.add(box, matrix(side * (halfWidth * .935), car.wr + radius * Math.sin(angle),
            axle * car.wb / 2 + radius * Math.cos(angle), 0, .12, .083, .16, angle - Math.PI / 2), dark);
        }
      }
    }
    if (profile.offroad) {
      for (const x of [-.19, 0, .19]) {
        out.add(box, matrix(x, top + .12, front + .063, 0, .039, .022, .015), tint(0xe39846));
      }
    }
    if (profile.wing) {
      const z = -front + .27;
      const height = car.yb + profile.wing + .09;
      for (const side of [-1, 1]) {
        out.add(box, matrix(side * halfWidth * .54, car.yb + profile.wing / 2, z, 0,
          .042, profile.wing + .10, .11), dark);
      }
      out.add(box, matrix(0, height, z, 0, car.Wd * .86, .047, .25, -.08), dark);
    }
  }

  function buildLights(car, tools) {
    const { Builder, box, cyl16, matrix, tint } = tools;
    const front = new Builder();
    const back = new Builder();
    const profile = car.customBody;
    const d = car.L / 2;
    const w = car.Wd / 2;
    const h = Math.max(car.wr + .23, car.yb - (car.kind === "super" ? .27 : .25));
    const white = tint(0xfff1d6);
    const red = tint(0xc92630);

    function bar(builder, side, x, y, z, length, thickness, angle, color) {
      builder.add(box, matrix(side * x, y, z, 0, length, thickness, .046, 0, side * angle), color);
    }

    function signature(builder, style, side, z, y, color, inset) {
      const x = w * inset;
      if (style === "round") {
        for (const offset of [-.077, .077]) {
          builder.add(cyl16, matrix(side * (x + offset), y, z, 0, .136, .035, .136, Math.PI / 2), color);
        }
        return;
      }
      if (style === "triple") {
        for (const offset of [-.095, 0, .095]) bar(builder, side, x + offset, y, z, .043, .105, -.14, color);
        return;
      }
      if (style === "fork") {
        bar(builder, side, x + .052, y + .025, z, .185, .029, .37, color);
        bar(builder, side, x - .032, y + .013, z, .105, .028, -.34, color);
        return;
      }
      if (style === "bracket") {
        for (const offset of [-.052, .052]) bar(builder, side, x, y + offset, z, .23, .028, 0, color);
        bar(builder, side, x + .10, y, z, .028, .12, 0, color);
        return;
      }
      bar(builder, side, x, y, z, style === "line" ? w * .58 : .25,
        style === "square" ? .095 : .047, style === "swept" ? .18 : 0, color);
    }

    for (const side of [-1, 1]) {
      signature(front, profile.lamp, side, d + .044, h, white, profile.nose * .69);
      signature(back, profile.rear, side, -d - .059, h + .018, red, profile.tail * .69);
    }
    if (profile.rear === "line") bar(back, 1, 0, h + .018, -d - .048, w * .94, .024, 0, red);
    return { lampGeo: front.build(), tailGeo: back.build() };
  }

  function buildPirate(out, ship, paint, tools) {
    const { hull, box, cyl8, matrix, tint, between } = tools;
    const length = ship.L;
    const beam = ship.Wd;
    const deck = ship.pirate === 3 ? 1.6 : 1.3;
    const wood = tint(paint);
    const shadow = tint(0x2c211b);
    const brass = tint(0xa68b54);
    const canvas = tint(0xded1aa);
    const rope = tint(0x594a32);
    const planks = [0x675039, 0x7b6144, 0x8a704d, 0x715742].map(tint);
    hull(out, length, beam, ship.pirate === 3 ? 1.6 : 1.15,
      deck + .33, 1.1, wood, tint(0x38291e), shadow, planks[2]);

    function prism(x, y, z, w, h, d, color) {
      out.add(box, matrix(x, y, z, 0, w, h, d), color);
    }

    function pole(a, b, radius, color) {
      out.add(cyl8, between(...a, ...b, radius), color);
    }

    for (let i = 0; i < 10; i++) {
      const x = (i - 4.5) * beam * .077;
      prism(x, deck - .035, -.40, beam * .068, .085, length * .69, planks[i % 4]);
    }
    for (const side of [-1, 1]) {
      const x = side * beam * .417;
      for (let i = 0; i < 10; i++) {
        const z = -.43 * length + i * length * .071;
        const railX = x * (z > 0 ? 1 - (z / length) ** 2 * 2 : 1);
        pole([railX, deck, z], [railX, deck + .56, z], .055, wood);
        if (i > 0) pole([railX, deck + .54, z - length * .071], [railX, deck + .54, z], .058, brass);
      }
      pole([x, deck + .28, -length * .40], [x * .66, deck + .90, length * .37], .044, wood);
    }

    const bridgeZ = -length * .355;
    prism(0, deck + .46, bridgeZ, beam * .71, 1.0, length * .15, wood);
    prism(0, deck + 1, bridgeZ, beam * .78, .14, length * .171, shadow);
    for (const x of [-.86, 0, .86]) prism(x, deck + .64, bridgeZ - length * .077, .32, .37, .025, brass);
    pole([0, deck + .36, length * .36], [0, deck + 2.45, length * .59], .096, wood);
    pole([0, deck + 2.45, length * .59], [0, deck + 5.3, length * .12], .022, rope);
    pole([.54, deck + .25, bridgeZ + 1.1], [.54, deck + 1.19, bridgeZ + 1.1], .076, wood);

    const mastZ = ship.pirate === 3 ? [.24, .02, -.22] : [.17, -.16];
    for (const [index, fraction] of mastZ.entries()) {
      const z = fraction * length;
      const top = ship.H * (index === 1 ? 1 : .82);
      pole([0, deck-.1, z], [0, top, z], .115, wood);
      pole([0, top, z], [beam * .39, deck + .46, z - .9], .027, rope);
      pole([0, top, z], [-beam * .39, deck + .46, z - .9], .027, rope);
      for (let level = 0; level < 2; level++) {
        const y = top - .78 - level * (top - deck) * .36;
        const spread = beam * (level ? .46 : .32);
        const drop = (top - deck) * (level ? .32 : .27);
        pole([-spread, y, z], [spread, y, z], .066, wood);
        const point = (u, v) => [spread * u * (1 + .12 * v), y - drop * v + .12 * u * u,
          z + .04 + Math.sin(Math.PI * v) * (1 - u * u) * beam * .17];
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 10; col++) {
            const a = col / 5 - 1;
            const b = a + .2;
            const upper = row / 4;
            const lower = upper + .25;
            const p = [point(a, upper), point(b, upper), point(b, lower), point(a, lower)];
            out.quad(...p, canvas);
            out.quad(p[3], p[2], p[1], p[0], canvas);
          }
        }
        pole([-spread, y, z], [-spread, y - drop, z + .04], .017, rope);
        pole([spread, y, z], [spread, y - drop, z + .04], .017, rope);
      }
      if (index !== 1) continue;
      const flag = [[0, top, z], [0, top - .8, z], [1.29, top - .92, z - .2], [1.29, top - .12, z - .2]];
      out.quad(...flag, tint(0x17181c));
      out.quad(flag[3], flag[2], flag[1], flag[0], tint(0x17181c));
      for (const side of [-1, 1]) {
        const pos = z - .104 + side * .018;
        const mark = tint(0xe3d6ad);
        const a = [.47, top - .31, pos], b = [.81, top - .62, pos];
        const c = [.76, top - .31, pos], d = [.42, top - .62, pos];
        pole(a, b, .034, mark);
        pole(c, d, .034, mark);
      }
    }
  }

  function buildScooter(vehicle, tools) {
    const { Builder, box, cylinder, matrix, tint, between } = tools;
    const paint = new Builder(), trim = new Builder(), lamp = new Builder();
    const fork = new Builder(), forkLamp = new Builder(), wheel = new Builder();
    const dark = tint(0x21252a), silver = tint(0x8a9296);
    const white = tint(0xf0f6ff), red = tint(0xa7202a);
    const axle = vehicle.wb * .5;
    const localWheelY = vehicle.wr - 1;
    const localWheelZ = .12;
    const part = (out, x, y, z, w, h, d, color) =>
      out.add(box, matrix(x, y, z, 0, w, h, d), color);

    part(paint, 0, .117, -.07, .17, .078, .66, [1, 1, 1]);
    part(trim, 0, .162, -.07, .159, .012, .627, dark);
    part(trim, 0, .22, -axle, .127, .037, .18, dark);
    part(lamp, 0, .22, -axle - .095, .065, .021, .012, red);
    fork.add(cylinder, between(0, localWheelY + .02, localWheelZ, 0, .102, -.07, .028), silver);
    fork.add(cylinder, between(-.235, .105, -.066, .235, .105, -.066, .018), silver);
    part(fork, 0, .123, -.06, .12, .05, .09, dark);
    for (const side of [-1, 1]) part(fork, side * .19, .105, -.066, .11, .048, .048, dark);
    part(forkLamp, 0, .097, -.002, .066, .035, .013, white);
    for (const [radius, depth, color] of [[vehicle.wr, .058, dark], [vehicle.wr * .69, .067, silver],
      [vehicle.wr * .28, .077, dark]]) {
      wheel.add(cylinder, matrix(0, 0, 0, 0, radius * 2, depth, radius * 2, 0, Math.PI / 2), color);
    }
    return { paint: paint.build(), trim: trim.build(), lamp: lamp.build(), fork: fork.build(),
      forkLamp: forkLamp.build(), wheel: wheel.build() };
  }

  const parked = [
    ["boeing_737", 142, 485, 0, 0xf7f5f0],
    ["bicicleta_urbana", 24.4, 13, 0, 0x4b746d],
    ["patinete", 24.4, 22, Math.PI, 0x4e807b],
    ["patinete", -529, 26, 0, 0xe2973d],
    ["camaro_ss", 16.9, 31, Math.PI, 0xf8ae25],
    ["mustang_gt", 23.1, 28, 0, 0x294c77],
    ["ranger_raptor", 23.1, 38, 0, 0x5c6452],
    ["cruze", 23.1, 49, 0, 0x9c2931],
    ["cruze_ltz_2014", 23.1, 56.4, 0, 0xf6f4f1],
    ["cruze_ltz_2014", 170, 726, Math.PI / 2, 0xf6f4f1],
    ["cruze_ltz_2014", -546, 46.5, 0, 0xf6f4f1],
    ["cruze_ltz_2014", 638, -1400, 0, 0xf6f4f1],
    ["cruze_ltz_2014", 878, 37, 0, 0xf6f4f1],
    ["aventador", 300, -1390, Math.PI / 2, 0x9aa238],
    ["urus", 380, -1343, -Math.PI / 2, 0x292b37],
    ["f150_monster", -546, 53, 0, 0x454a51],
    ["ferrari_458", 174, 719, Math.PI / 2, 0xad151c],
    // Vagas adicionais perto dos pontos onde estes carros já aparecem.
    ["ferrari_458", 23.1, 63.6, 0, 0xad151c],
    ["camaro_ss", 23.1, 70.8, 0, 0xf8ae25],
    ["cruze_ltz_2014", 23.1, 78, 0, 0xf6f4f1],
    ["ferrari_458", 153, 719, Math.PI / 2, 0xad151c],
    ["camaro_ss", 162, 726, Math.PI / 2, 0xf8ae25],
    ["cruze_ltz_2014", 154, 726, Math.PI / 2, 0xf6f4f1],
    ["ferrari_458", -546, 60.2, 0, 0xad151c],
    ["camaro_ss", -546, 67.4, 0, 0xc83732],
    ["cruze_ltz_2014", -546, 74.6, 0, 0xf6f4f1],
    ["ferrari_458", 300, -1422, Math.PI / 2, 0xad151c],
    ["camaro_ss", 300, -1406, Math.PI / 2, 0xd8dbe2],
    ["cruze_ltz_2014", 300, -1414, Math.PI / 2, 0xf6f4f1],
    ["ferrari_458", 631, -1400, Math.PI / 2, 0xad151c],
    ["camaro_ss", 624, -1400, Math.PI / 2, 0xf8ae25],
    ["cruze_ltz_2014", 617, -1400, Math.PI / 2, 0xf6f4f1],
    ["ferrari_458", 878, 45.5, 0, 0xad151c],
    ["camaro_ss", 878, 53, 0, 0xc83732],
    ["cruze_ltz_2014", 878, 60.4, 0, 0xf6f4f1],
    ["ferrari_458", 388, 1000, Math.PI, 0xad151c],
    ["camaro_ss", 396, 1000, Math.PI, 0xf8ae25],
    ["cruze_ltz_2014", 404, 1000, Math.PI, 0xf6f4f1],
    ["viatura_classica", 108, 97, 0],
    ["viatura_classica", 712, -1404, Math.PI / 2],
    ["viatura_classica", 884, 836, Math.PI],
    ["viatura_classica", 586, 34, 0],
    ["viatura_classica", -513, 20, 0],
    // Vagas dos favoritos em áreas que já têm acesso pela rua.
    ["ferrari_458", 23.1, 85.2, 0, 0xad151c, 320],
    ["ferrari_458", 23.1, 92.4, 0, 0xf6f4f1, 320],
    ["ferrari_458", 145, 719, Math.PI / 2, 0xad151c, 320],
    ["ferrari_458", 137, 719, Math.PI / 2, 0xf3ad2b, 320],
    ["ferrari_458", 129, 719, Math.PI / 2, 0xad151c, 320],
    ["ferrari_458", 145, 726, Math.PI / 2, 0x292b37, 320],
    ["ferrari_458", 137, 726, Math.PI / 2, 0xad151c, 320],
    ["ferrari_458", -555, 67.4, 0, 0xad151c, 320],
    ["ferrari_458", -546, 89, 0, 0xf6f4f1, 320],
    ["ferrari_458", 300, -1430, Math.PI / 2, 0xad151c, 320],
    ["ferrari_458", 292, -1422, Math.PI / 2, 0xf3ad2b, 320],
    ["ferrari_458", 610, -1400, Math.PI / 2, 0xad151c, 320],
    ["ferrari_458", 603, -1400, Math.PI / 2, 0x292b37, 320],
    ["ferrari_458", 878, 67.8, 0, 0xad151c, 320],
    ["ferrari_458", 887, 53.5, 0, 0xad151c, 320],
    ["ferrari_458", 412, 1000, Math.PI, 0xf3ad2b, 320],
    ["ferrari_458", 420, 1000, Math.PI, 0xad151c, 320],
    ["cruze_ltz_2014", 129, 726, Math.PI / 2, 0xf6f4f1, 320],
    ["cruze_ltz_2014", -546, 96.2, 0, 0xf6f4f1, 320],
    ["cruze_ltz_2014", 595, -1400, Math.PI / 2, 0xf6f4f1, 320],
  ];


  const visualKeys = {
    cruze: "family-sedan",
    cruze_ltz_2014: "cruze-ltz-2014",
    camaro_ss: "camaro-modern",
    mustang_mach: "muscle-car",
    f150_raptor: "pickup-truck",
    f150_monster: "pickup-truck",
    ranger_raptor: "pickup-truck",
    ranger_exped: "pickup-truck",
    aventador: "supercar",
    huracan: "supercar",
    ferrari: "supercar",
    ferrari_458: "ferrari-458-italia",
    equinox: "suv",
    compass: "suv",
    urus: "suv",
    onibus: "city-bus",
    baiacu: "rally-car",
    viatura: "police-car",
    garoupa: "family-sedan",
    siri: "pickup-truck",
    camaro_z28: "muscle-car",
    camaro_zl1: "muscle-car",
    mustang_gt: "classic-coupe",
    mustang_shelby: "muscle-car",
  };
  const models = new Map();
  const paints = new WeakMap();
  const reflective = new Set();
  let environment = null;

  function addReflection(material) {
    if (!material?.isMeshStandardMaterial || reflective.has(material)) return;
    reflective.add(material);
    material.envMap = environment;
    material.envMapIntensity = /glass|mirror|chrome/i.test(material.name) ? .74 : .69;
    if (environment) material.needsUpdate = true;
  }

  function setEnvironment(texture) {
    if (texture === environment) return;
    const compile = !environment || !texture;
    environment = texture;
    for (const material of reflective) {
      material.envMap = texture;
      if (compile) material.needsUpdate = true;
    }
  }
  const twoWheeled = new Set(["city-bicycle", "motor-scooter", "sport-motorcycle", "electric-kick-scooter"]);

  async function loadModels(loader, payload, diagnostics, bytesFromBase64) {
    const simplifyReady = prepareRoadSimplifier();
    await Promise.all(Object.entries(payload || {}).map(async ([key, source]) => {
      try {
        const { scene } = await loader.parseAsync(bytesFromBase64(source).buffer, "");
        const slots = twoWheeled.has(key) ? ["F", "R"] : ["FL", "FR", "RL", "RR"];
        const required = specialParts[key] ?? slots.map(slot => "wheel_" + slot);
        if (!required.every(name => scene.getObjectByName(name))) {
          throw new Error("partes articuladas ausentes");
        }
        scene.traverse(node => {
          if (!node.isMesh) return;
          const slots = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of slots) addReflection(material);
        });
        models.set(key, scene);
        diagnostics.ok.push("frota:" + key);
      } catch (error) {
        diagnostics.fail.push("frota:" + key + ": " + error.message);
      }
    }));
    await simplifyReady;
  }

  // The imported vehicles share a rig. These proportions give each design a distinct silhouette.
  const profiles = {
    cruze: { roof: .025, rear: .043, nose: .049, fender: .014, cabinForward: .058, noseTaper: .063 },
    eq: { roof: .031, rear: .093, nose: .043, fender: .026,
      cabinForward: .044, noseTaper: .020, equinox: true },
    compass: { roof: -.045, rear: -.085, nose: -.032, fender: .027 },
    urus: { roof: .095, rear: .115, nose: .045, fender: .032 },
    camaro: { roof: .07, rear: .045, nose: -.012, fender: .038 },
    mustang: { roof: -.025, rear: .065, nose: .021, fender: .013 },
    raptor: { roof: -.03, rear: -.021, nose: -.026, fender: .049 },
    ranger: { roof: .015, rear: .011, nose: .019, fender: .023 },
    aventador: { roof: .065, rear: .066, nose: .072, fender: .026 },
    huracan: { roof: .026, rear: .041, nose: .049, fender: .014 },
    ferrari: { roof: -.036, rear: .093, nose: .068, fender: .024 },
  };
  const camaroSSProfile = { roof: .013, rear: .043, nose: .024, fender: .041,
    cabinForward: .018, noseTaper: .046, sculptedHood: true };
  const revisedGeometry = new Map();

  function adaptSheetMetal(root, label, car, bounds, size, center, tools) {
    const design = car.customBody?.design;
    const profile = label === "camaro-modern" ? camaroSSProfile : profiles[design];
    if (!profile) return;
    const cacheKey = label + "/" + design;
    if (!revisedGeometry.has(cacheKey)) revisedGeometry.set(cacheKey, []);
    const cache = revisedGeometry.get(cacheKey);
    const { Vector, Attribute } = tools;
    const point = new Vector();
    const clamp = value => Math.min(1, Math.max(0, value));
    const fade = value => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    let meshIndex = 0;
    root.traverse(mesh => {
      if (!mesh.isMesh) return;
      const index = meshIndex++;
      for (let node = mesh; node && node !== root; node = node.parent) {
        if (/^(wheel|steer)_/i.test(node.name)) return;
      }
      if (cache[index]) {
        mesh.geometry = cache[index];
        return;
      }

      const source = mesh.geometry.getAttribute("position");
      const position = new Float32Array(source.count * 3);
      const inverse = mesh.matrixWorld.clone().invert();
      for (let i = 0; i < source.count; i++) {
        point.fromBufferAttribute(source, i).applyMatrix4(mesh.matrixWorld);
        const height = (point.y - bounds.min.y) / size.y;
        const along = (point.z - center.z) / (size.z * .5);
        const greenhouse = fade((height - .55) / .40);
        const rear = fade((-along - .10) / .90);
        const nose = fade((along - .52) / .48);
        const side = Math.exp(-(((height - .43) * 7) ** 2))
          * fade((Math.abs(along) - .28) / .52);
        point.x = center.x + (point.x - center.x)
          * (1 - profile.roof * greenhouse - profile.nose * nose * .45 + profile.fender * side);
        point.y -= size.y * (profile.rear * rear * greenhouse + profile.nose * nose * fade((height - .29) / .32));
        if (profile.cabinForward) {
          const travel = (1 - Math.min(.86, Math.abs(along))) * fade((height - .45) / .38);
          point.z += size.z * profile.cabinForward * travel;
          const lateral = Math.min(1, Math.abs(point.x - center.x) / (size.x * .5));
          point.z -= size.z * profile.noseTaper * lateral ** 2.75 * nose;
        }
        if (profile.equinox) {
          const across = Math.min(1, Math.abs(point.x-center.x)/(size.x*.5));
          const movingRearGlass = fade((-along-.43)/.42)*fade((height-.58)/.29);
          const cowl = fade((along+.10)/.28)*fade((.54-along)/.20);
          const nearBelt = fade((height-.45)/.13)*(1-fade((height-.70)/.20));
          point.z += size.z*(.061*movingRearGlass + .071*cowl*nearBelt);
          const hood = fade((along-.24)/.22)*fade((.96-along)/.27)*fade((height-.37)/.18)*(1-greenhouse);
          const ridge = Math.exp(-(((across-.72)/.14)**2));
          point.y += size.y*hood*(.028*(1-across*across)+.014*ridge);
          const tailShoulder = fade((-along-.48)/.4)*fade((height-.33)/.23)*(1-greenhouse);
          point.y += size.y*.024*tailShoulder;
        }
        if (profile.sculptedHood && height > .40) {
          const lateral = Math.abs(point.x - center.x) / (size.x * .5);
          const onHood = fade((along - .26) / .19) * fade((.94 - along) / .21);
          const centerBulge = fade((.60 - lateral) / .32);
          const rim = Math.exp(-Math.pow((lateral - .82) / .16, 2));
          point.y += size.y * onHood * (.038 * centerBulge + .022 * rim);
        }
        point.applyMatrix4(inverse).toArray(position, i * 3);
      }
      const geometry = mesh.geometry.clone();
      geometry.setAttribute("position", new Attribute(position, 3));
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      mesh.geometry = geometry;
      cache[index] = geometry;
    });
  }

  function cabinControls(original, tools) {
    const { Group, Box, Vector } = tools;
    const steering = original.getObjectByName("steering_wheel");
    const leftDoor = original.getObjectByName("door_FL") || original.getObjectByName("door_L");
    const door = leftDoor || original.getObjectByName("door_FR") || original.getObjectByName("door_R");
    const hinge = door?.rotation.y ?? 0;
    const home = steering?.rotation.z ?? 0;
    let doorAmount = 0;
    let doorAnimation = 0;
    let grips = null;
    if (steering) {
      const span = new Box().setFromObject(steering);
      const center = span.getCenter(new Vector());
      const size = span.getSize(new Vector());
      if (size.x > .14 && size.y > .07) {
        grips = {};
        for (const [side, direction] of [["L", 1], ["R", -1]]) {
          const handle = new Group();
          const point = center.clone();
          point.x += direction * size.x * .41;
          point.y += size.y * .09;
          handle.position.copy(steering.worldToLocal(point));
          steering.add(handle);
          grips[side] = handle;
        }
      }
    }
    function poseDoor(amount) {
      doorAmount = amount;
      door.rotation.y = hinge + amount * (leftDoor ? -1.02 : 1.02);
    }
    function setDoor(amount) {
      if (!door) return;
      doorAnimation++;
      poseDoor(amount);
    }
    function finishDoor(openForExit) {
      if (!door) return;
      const motion = ++doorAnimation;
      const started = performance.now();
      const opening = openForExit ? .18 : 0;
      const hold = openForExit ? .27 : 0;
      const from = doorAmount;
      const close = .30;
      function frame(now) {
        if (motion !== doorAnimation) return;
        const elapsed = (now - started) / 1000;
        const open = elapsed < opening
          ? from + (1 - from) * elapsed / opening
          : elapsed < opening + hold ? 1
          : Math.max(0, 1 - (elapsed - opening - hold) / close) * (openForExit ? 1 : from);
        poseDoor(open);
        if (elapsed < opening + hold + close) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    return {
      grips, door, setDoor, finishDoor,
      steer(value) { if (steering) steering.rotation.z = home - value * 3.25; },
    };
  }

  function positionEspadartePlate(geometry, front) {
    const source = geometry.getAttribute("position");
    const color = geometry.getAttribute("color");
    if (!source || !color) return geometry;
    const plate = [];
    for (let i = 0; i < source.count; i++) {
      const [x,y,z] = [source.getX(i),source.getY(i),source.getZ(i)];
      if (Math.abs(x) > .202 || y < .449 || y > .568 || z < 1.855 || z > 2.25) continue;
      const [r,g,b] = [color.getX(i),color.getY(i),color.getZ(i)];
      const field = Math.min(r,g,b) > .83;
      const header = r < .040 && g > .048 && g < .105 && b > .32 && b < .42;
      if (field || header) plate.push(i);
    }
    if (!plate.length) return geometry;
    const stations = plate.map(i => source.getZ(i));
    const tip = Math.max(...stations), depth = tip - Math.min(...stations);
    if (depth < .1) return geometry;
    const corrected = geometry.clone();
    const position = corrected.getAttribute("position");
    const normal = corrected.getAttribute("normal");
    for (const i of plate) {
      const x = source.getX(i);
      const y = .255 + .102 * (tip - source.getZ(i)) / depth;
      position.setXYZ(i,x,y,front + .021 - x*x*.035);
      normal?.setXYZ(i,0,0,1);
    }
    corrected.computeBoundingBox();
    corrected.computeBoundingSphere();
    return corrected;
  }

  function attachRoadCabin(geometry, chassis, trim, tools) {
    if (!geometry.steeringGeo) return null;
    const { Group, Mesh } = tools;
    const column = new Group();
    const wheel = new Mesh(geometry.steeringGeo, trim);
    wheel.name = "steering_wheel";
    column.position.set(...geometry.steeringPivot);
    column.rotation.x = .31;
    column.userData.roadCabin = true;
    column.add(wheel);
    chassis.add(column);
    chassis.updateWorldMatrix(true, true);
    return cabinControls(column, tools);
  }

  const roadBatches = new Map();
  let roadSimplifier = null;

  async function prepareRoadSimplifier() {
    const candidate = window.MeshoptSimplifier;
    if (!candidate?.supported) return;
    try {
      await candidate.ready;
      roadSimplifier = candidate;
    } catch (error) {
      console.warn("Simplificador da frota indisponível", error);
    }
  }

  function simplifyRoadBatch(geometry, limit, tools, dense = false, fraction = dense ? .31 : .46) {
    const current = geometry.getIndex();
    const optimizer = roadSimplifier;
    if (!optimizer || current.count < 720) return;
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const uv = geometry.getAttribute("uv");
    const width = uv ? 5 : 3;
    const weights = uv ? [.16,.16,.16,.35,.35] : [.16,.16,.16];
    const attributes = new Float32Array(position.count * width);
    for (let i = 0; i < position.count; i++) {
      const at = i * width;
      if (normal) attributes.set(normal.array.subarray(i * 3, i * 3 + 3), at);
      if (uv) attributes.set(uv.array.subarray(i * 2, i * 2 + 2), at + 3);
    }

    const target = Math.max(216, Math.floor(current.count * fraction / 3) * 3);
    const flags = dense ? ["Permissive", "Prune", "ErrorAbsolute"] : ["LockBorder", "ErrorAbsolute"];
    const [reduced] = optimizer.simplifyWithAttributes(Uint32Array.from(current.array), position.array, 3,
      attributes, width, weights, null, target, limit, flags);
    if (reduced.length >= current.count || reduced.length < 3) return;
    const [remap, remaining] = optimizer.compactMesh(reduced);
    for (const [name, source] of Object.entries(geometry.attributes)) {
      const packed = new Float32Array(remaining * source.itemSize);
      for (let i = 0; i < remap.length; i++) {
        if (remap[i] >= remaining) continue;
        const offset = i * source.itemSize;
        packed.set(source.array.subarray(offset, offset + source.itemSize), remap[i] * source.itemSize);
      }
      geometry.setAttribute(name,new tools.Attribute(packed,source.itemSize));
    }
    const indices = remaining > 65535 ? reduced : Uint16Array.from(reduced);
    geometry.setIndex(new tools.Attribute(indices,1));
  }
  const cabinBits = /^(bays|belt|belts|card_|dashboard|headliner|interior|pedal|pillar_lining|seat|screen|steering_wheel)/i;

  function roadMeshBatch(group, toHolder, tools, dense = false) {
    const { Geometry, Attribute, Vector, NormalMatrix } = tools;
    const definition = [["position",3],["normal",3],["uv",2],["uv1",2],["color",3]];
    const count = group.reduce((total, mesh) => total + mesh.geometry.getAttribute("position").count, 0);
    const indexCount = group.reduce((total, mesh) => total + (mesh.geometry.index?.count
      ?? mesh.geometry.getAttribute("position").count), 0);
    const geometry = new Geometry();
    const arrays = new Map();
    for (const [name, components] of definition) {
      if (!group.some(mesh => mesh.geometry.hasAttribute(name))) continue;
      const width = Math.max(components, ...group.map(mesh => mesh.geometry.getAttribute(name)?.itemSize ?? 0));
      arrays.set(name, { width, values: new Float32Array(count * width) });
    }
    const indices = count > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);
    const normalMatrix = new NormalMatrix();
    const point = new Vector();
    let vertexStart = 0, indexStart = 0;
    for (const mesh of group) {
      const original = mesh.geometry;
      const transform = toHolder.clone().multiply(mesh.matrixWorld);
      const reflect = transform.determinant() < 0;
      normalMatrix.getNormalMatrix(transform);
      const vertices = original.getAttribute("position").count;
      for (const [name, {width,values}] of arrays) {
        const source = original.getAttribute(name);
        for (let i = 0; i < vertices; i++) {
          const at = (vertexStart + i) * width;
          if (name === "position") {
            point.fromBufferAttribute(source, i).applyMatrix4(transform).toArray(values, at);
          } else if (name === "normal") {
            if (source) point.fromBufferAttribute(source, i).applyNormalMatrix(normalMatrix).toArray(values, at);
            else values[at + 1] = 1;
          } else {
            for (let n = 0; n < width; n++) {
              values[at + n] = source && n < source.itemSize ? source.getComponent(i,n) : name === "color" ? 1 : 0;
            }
          }
        }
      }
      const source = original.getIndex();
      const elements = source?.count ?? vertices;
      for (let i = 0; i < elements; i += 3) {
        const a = source ? source.getX(i) : i;
        const b = source ? source.getX(i + 1) : i + 1;
        const c = source ? source.getX(i + 2) : i + 2;
        indices[indexStart++] = vertexStart + a;
        indices[indexStart++] = vertexStart + (reflect ? c : b);
        indices[indexStart++] = vertexStart + (reflect ? b : c);
      }
      vertexStart += vertices;
    }
    for (const [name, {width,values}] of arrays) geometry.setAttribute(name,new Attribute(values,width));
    geometry.setIndex(new Attribute(indices,1));
    const material = group[0].material;
    if (!material.transparent && !/light|lamp|projector|lens|grille-radiator/i.test(material.name)) {
      simplifyRoadBatch(geometry, dense ? .008 : .019, tools, dense);
    }
    geometry.computeBoundingSphere();
    return geometry;
  }

  const mediumWheelGeometry = new WeakMap();

  function buildWheelDetails(wheels, tools) {
    const parts = [];
    for (const wheel of wheels) wheel.traverse(node => {
      if (!node.isMesh || !node.geometry.index || Array.isArray(node.material)) return;
      const near = node.geometry;
      if (!mediumWheelGeometry.has(near)) {
        const packed = roadMeshBatch([node], node.matrixWorld.clone().invert(), tools);
        const usePacked = packed.index.count < near.index.count;
        mediumWheelGeometry.set(near, usePacked ? packed : near);
        if (!usePacked) packed.dispose();
      }
      const medium = mediumWheelGeometry.get(near);
      if (medium !== near) parts.push({ node, near, medium });
    });
    return parts;
  }

  const mediumReflectiveMaterials = new WeakMap();

  function mediumRoadMaterial(key, source, tools) {
    if (!["cruze_ltz_2014","ferrari_458"].includes(key) || !source.isMeshPhysicalMaterial ||
        /light|lamp|projector|lens/i.test(source.name)) return source;
    if (!mediumReflectiveMaterials.has(source)) {
      const material = new tools.Material({
        name: source.name, color: source.color, roughness: source.roughness,
        metalness: source.metalness, transparent: source.transparent, opacity: source.opacity,
        side: source.side, depthWrite: source.depthWrite, alphaTest: source.alphaTest,
        map: source.map, normalMap: source.normalMap, normalScale: source.normalScale,
        alphaMap: source.alphaMap, roughnessMap: source.roughnessMap, metalnessMap: source.metalnessMap,
      });
      addReflection(material);
      mediumReflectiveMaterials.set(source, material);
    }
    return mediumReflectiveMaterials.get(source);
  }

  function mountMediumRoadBody(key, original, holder, tools) {
    const visible = [];
    let unsupported = false;
    original.traverse(node => {
      if (!node.isMesh || !node.visible) return;
      if (Array.isArray(node.material) || !node.geometry.hasAttribute("position")) {
        unsupported = true;
        return;
      }
      for (let ancestor = node; ancestor && ancestor !== original; ancestor = ancestor.parent) {
        if (cabinBits.test(ancestor.name) ||
            (key === "ferrari_458" && /^(carpet|interior_(dark|light)|carbon_fibre_trim)$/.test(ancestor.name))) return;
      }
      visible.push(node);
    });
    if (unsupported || !visible.length) return null;
    if (!roadBatches.has(key)) {
      holder.updateWorldMatrix(true, true);
      const transform = holder.matrixWorld.clone().invert();
      const perMaterial = new Map();
      for (let index = 0; index < visible.length; index++) {
        const mesh = visible[index];
        const material = mesh.material;
        if (!perMaterial.has(material)) perMaterial.set(material, { reference: index, meshes: [] });
        perMaterial.get(material).meshes.push(mesh);
      }
      const batches = [];
      for (const {reference,meshes} of perMaterial.values()) {
        const geometry = roadMeshBatch(meshes,transform,tools,key==="ferrari_458");
        let far = null;
        if ((key==="ferrari_458" || key==="cruze_ltz_2014") && geometry.index.count>=720) {
          const reduced = geometry.clone();
          const ferrari=key==="ferrari_458";
          simplifyRoadBatch(reduced,ferrari?.075:.052,tools,true,ferrari?.16:.22);
          if (reduced.index.count < geometry.index.count) {
            reduced.computeBoundingSphere();
            far = reduced;
          } else {
            reduced.dispose();
          }
        }
        batches.push({ reference, geometry, far });
      }
      roadBatches.set(key,batches);
    }
    const shell = new tools.Group();
    shell.name = "carroceria-media:" + key;
    shell.visible = false;
    const distanceParts = [];
    for (const {reference,geometry,far} of roadBatches.get(key)) {
      const material = mediumRoadMaterial(key, visible[reference].material, tools);
      const mesh = new tools.Mesh(geometry,material);
      mesh.receiveShadow = true;
      mesh.castShadow = !material.transparent;
      shell.add(mesh);
      if (far) distanceParts.push({node:mesh,medium:geometry,far});
    }
    shell.userData.distanceParts = distanceParts;
    holder.add(shell);
    return shell;
  }

  function attachModel(key, car, color, root, chassis, tools) {
    const label = visualKeys[key];
    const source = models.get(label);
    if (!source) return null;
    const { Group, Box, Vector } = tools;
    const original = source.clone(true);
    const adjustment = new Group();
    const holder = new Group();
    adjustment.add(original);
    holder.add(adjustment);
    original.updateMatrixWorld(true);

    const midpoint = (left, right) => original.getObjectByName(left).getWorldPosition(new Vector())
      .add(original.getObjectByName(right).getWorldPosition(new Vector())).multiplyScalar(.5);
    const front = midpoint("wheel_FL", "wheel_FR");
    const rear = midpoint("wheel_RL", "wheel_RR");
    adjustment.rotation.y = -Math.atan2(front.x - rear.x, front.z - rear.z);
    adjustment.updateMatrixWorld(true);
    const bounds = new Box().setFromObject(adjustment);
    const size = bounds.getSize(new Vector());
    const center = bounds.getCenter(new Vector());
    if (![size.x, size.y, size.z].every(v => Number.isFinite(v) && v > .05)) return null;
    if (label !== "cruze-ltz-2014") adaptSheetMetal(original, label, car, bounds, size, center, tools);
    adjustment.position.set(-center.x, -bounds.min.y, -center.z);
    holder.scale.set((car.mirrorWidth ?? car.Wd) / size.x, car.H / size.y, car.L / size.z);

    const brakes = new Map();
    const headlights = new Map();
    original.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const recolored = materials.map(material => {
        if (/^(light_front|lamp_front|headlight|headlamp)(_|$)/i.test(material.name) && material.emissive) {
          if (!headlights.has(material)) {
            const lens = material.clone();
            lens.emissiveIntensity = .05;
            headlights.set(material, lens);
          }
          return headlights.get(material);
        }
        if (/^lamp_red(_body)?$/i.test(material.name) && material.emissive) {
          if (!brakes.has(material)) {
            const lens = material.clone();
            lens.emissive.setHex(0x9a1409);
            lens.emissiveIntensity = .12;
            brakes.set(material, lens);
          }
          return brakes.get(material);
        }
        if (!/^paint(_body)?(\.\d+)?$/i.test(material.name)) return material;
        if (!paints.has(material)) paints.set(material, new Map());
        const variants = paints.get(material);
        const isFamilySedan = label === "family-sedan";
        const tintKey = isFamilySedan ? "sedan/" + color : color;
        if (!variants.has(tintKey)) {
          const copy = material.clone();
          copy.color.setHex(color);
          if (isFamilySedan) {
            // The source sedan's base-color image already contains deep blue paint.
            copy.map = null;
            copy.metalness = .30;
            copy.roughness = .29;
          }
          addReflection(copy);
          variants.set(tintKey, copy);
        }
        return variants.get(tintKey);
      });
      node.material = Array.isArray(node.material) ? recolored : recolored[0];
    });

    chassis.add(holder);
    root.updateMatrixWorld(true);
    const originalWheels = ["FL","FR","RL","RR"].map(slot => original.getObjectByName("wheel_" + slot));
    const wheels = originalWheels.map((mesh, index) => {
      const joint = new Group();
      const center = root.worldToLocal(mesh.getWorldPosition(new Vector()));
      joint.position.copy(center);
      joint.rotation.order = "YXZ";
      joint.userData.front = index < 2;
      root.add(joint);
      root.updateMatrixWorld(true);
      joint.attach(mesh);
      return joint;
    });
    const grille = window.MTAFronts?.mount(key, car, original, tools);
    if (grille) {
      chassis.add(grille);
      holder.attach(grille);
    }
    const equinoxPanels = window.MTAFronts?.mountEquinox(key, car, original, tools) ?? [];
    const tailPanel = equinoxPanels.find(part => part.name==="eq-rear");
    if (tailPanel) {
      const paint = original.getObjectByName("body_1")?.material;
      if (paint?.name==="paint_body") {
        original.traverse(node => {
          if (node.isMesh && /^(lamp_red_body|light_rear_body)$/.test(node.material?.name)) node.material=paint;
        });
        brakes.clear();
      }
      brakes.set(tailPanel.material,tailPanel.material);
    }
    for (const part of [...equinoxPanels, ...(window.MTAFronts?.mountCamaroSides(key, car, original, tools) ?? [])]) {
      chassis.add(part);
      holder.attach(part);
    }
    const rearLens = window.MTAFronts?.mountCamaroTail(key, car, original, tools);
    if (rearLens) {
      chassis.add(rearLens);
      holder.attach(rearLens);
      brakes.set(rearLens.material, rearLens.material);
    }
    holder.name = "carroceria-glb:" + label;
    holder.userData.design = car.customBody?.design ?? label;
    const cabin = cabinControls(original, tools);
    const medium = mountMediumRoadBody(key, original, holder, tools);
    const wheelDetails = medium && ["cruze_ltz_2014","ferrari_458"].includes(key) ? buildWheelDetails(wheels, tools) : [];
    return { holder, near: adjustment, medium, wheels, wheelDetails, distanceParts:medium?.userData.distanceParts,
      brakes: [...brakes.values()],
      headlights: [...headlights.values()], ...cabin };
  }


  function attachBike(car, chassis, steering, tools) {
    if (car.skate) return null;
    const label = car.bike ? "city-bicycle" : car.scooter ? "electric-kick-scooter"
      : car.sport ? "sport-motorcycle" : "motor-scooter";
    const source = models.get(label);
    if (!source) return null;
    const { Group, Box, Vector } = tools;
    const body = source.clone(true);
    const adjust = new Group();
    const holder = new Group();
    adjust.add(body);
    holder.add(adjust);
    holder.name = "duas-rodas-glb:" + label;

    const front = body.getObjectByName("wheel_F");
    const rear = body.getObjectByName("wheel_R");
    const axle = front.getWorldPosition(new Vector()).sub(rear.getWorldPosition(new Vector()));
    adjust.rotation.y = -Math.atan2(axle.x, axle.z);
    adjust.updateMatrixWorld(true);
    const bounds = new Box().setFromObject(adjust);
    const size = bounds.getSize(new Vector());
    const center = bounds.getCenter(new Vector());
    if (![size.x, size.y, size.z].every(v => Number.isFinite(v) && v > .05)) return null;
    adjust.position.set(-center.x, -bounds.min.y, -center.z);
    holder.scale.set(car.Wd / size.x, car.H / size.y, car.L / size.z);
    body.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });

    chassis.add(holder);
    chassis.updateWorldMatrix(true, true);
    const handlebar = body.getObjectByName("handlebar") || body.getObjectByName("steering") || body.getObjectByName("fork");
    if (handlebar) steering.attach(handlebar);
    const wheels = [front, rear].map((wheel, index) => {
      const parent = index === 0 ? steering : chassis;
      const pivot = new Group();
      parent.add(pivot);
      pivot.position.copy(parent.worldToLocal(wheel.getWorldPosition(new Vector())));
      pivot.attach(wheel);
      return pivot;
    });
    const cranks = body.getObjectByName("cranks");
    const bar = handlebar?.getObjectByName("handlebar_mesh") || handlebar;
    let grips = null;
    if (bar) {
      const limits = new Box().setFromObject(bar);
      const width = limits.max.x - limits.min.x;
      const y = limits.max.y - .025;
      const z = limits.min.z + (limits.max.z - limits.min.z) * .28;
      grips = {};
      for (const [side, x] of [["L", limits.max.x - width * .10], ["R", limits.min.x + width * .10]]) {
        const pick = new Group();
        pick.name = "guidão-" + side;
        pick.position.copy(steering.worldToLocal(new Vector(x, y, z)));
        steering.add(pick);
        grips[side] = pick;
      }
    }
    return { holder, wheels, cranks, grips, kickstand: body.getObjectByName("kickstand") };
  }

  const specialParts = {
    speedboat: ["propeller_L", "propeller_R"],
    "light-aircraft": ["propeller"],
    "light-helicopter": ["main_rotor", "tail_rotor"],
    galleon: ["rudder", "wheel", "sails_furled"],
  };
  const specialKeys = { lancha: "speedboat", tecoteco: "light-aircraft", beijaflor: "light-helicopter", pirata_brigue: "galleon" };

  function attachSpecial(key, car, assembly, tools) {
    const label = specialKeys[key];
    const source = models.get(label);
    if (!source) return;
    const { Group, Box, Vector } = tools;
    const original = source.clone(true);
    const shape = new Group();
    shape.add(original);
    shape.name = "veiculo-especial-glb:" + label;
    const bounds = new Box().setFromObject(original);
    const size = bounds.getSize(new Vector());
    const center = bounds.getCenter(new Vector());
    if (![size.x, size.y, size.z].every(value => Number.isFinite(value) && value > .05)) return;
    const pirate = key === "pirata_brigue";
    const vertical = car.H / size.y;
    const draft = pirate ? 1.08 : key === "lancha" ? .25 : 0;
    original.position.set(-center.x, -bounds.min.y - draft / vertical, -center.z);
    const lengthScale = car.L / size.z;
    shape.scale.set(key === "lancha" ? car.Wd / size.x : lengthScale, vertical, lengthScale);
    const moving = specialParts[label].map(part => original.getObjectByName(part));
    const preserved = new Set([assembly.flame, assembly.disc, assembly.gear]);
    for (const piece of assembly.chassis.children) {
      if (piece.isMesh && !preserved.has(piece)) piece.visible = false;
    }
    original.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    assembly.chassis.add(shape);
    assembly.specialVisual = shape;
    if (key === "beijaflor") {
      [assembly.rotor, assembly.tailR] = moving;
      const rotor = assembly.rotor.getWorldPosition(new Vector());
      assembly.disc.position.copy(assembly.chassis.worldToLocal(rotor));
      assembly.disc.scale.setScalar(lengthScale * .86);
    } else if (key === "tecoteco") {
      assembly.prop = moving[0];
      const prop = assembly.prop.getWorldPosition(new Vector());
      assembly.disc.position.copy(assembly.chassis.worldToLocal(prop));
    } else if (pirate) {
      const [rudder, wheel, furled] = moving;
      furled.visible = false;
      assembly.helm = { rudder, wheel };
      const position = assembly.chassis.worldToLocal(wheel.getWorldPosition(new Vector()));
      assembly.crewSeat = { x: position.x, y: position.y - .30, z: position.z - .38, s: car.seat.s };
    } else {
      assembly.boatProps = moving;
    }
  }

  return Object.freeze({ register, traffic, buildRoadGeometry, loadModels, attachModel, attachRoadCabin, attachBike, attachSpecial, setEnvironment,
    buildPirate, buildScooter, positionEspadartePlate, moorings, parked });
})();
