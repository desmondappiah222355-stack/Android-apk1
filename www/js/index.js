// ── Shared ───────────────────────────────────────────────────────
const tabs = document.querySelectorAll('.tab');
const modes = document.querySelectorAll('.mode');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    modes.forEach(m => m.classList.remove('active'));
    document.getElementById(tab.dataset.mode).classList.add('active');
  });
});

// ── Scientific Calculator ────────────────────────────────────────
const display = document.getElementById('display');
let expression = '';
let memory = 0;
let isRadian = false;  // false = degrees, true = radians

function updateDisplay() {
  display.textContent = expression || '0';
}

function appendToDisplay(value) {
  if (expression === '0' && value !== '.') expression = '';
  expression += value;
  updateDisplay();
}

function appendFunction(func) {
  if (expression === '0') expression = '';

  let prefix = isRadian ? '' : 'Math.degToRad(';
  let suffix = isRadian ? '' : ')';

  if (func === 'x²') {
    expression += '**2';
  } else if (['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh'].includes(func)) {
    expression += `Math.\( {func} \){prefix ? '(' : ''}${prefix}`;
    if (prefix) expression += ',';
    expression += '(';  // open for argument
  } else if (func === 'Math.factorial') {
    expression += 'factorial(';
  } else if (func === 'Math.pow10') {
    expression += 'Math.pow(10,';
  } else {
    expression += func + '(';
  }
  updateDisplay();
}

function toggleAngleMode() {
  isRadian = !isRadian;
  document.getElementById('angleIndicator').textContent = isRadian ? 'RAD' : 'DEG';
}

Math.degToRad = (deg) => deg * Math.PI / 180;

// Custom factorial (simple – up to \~170 is safe in JS)
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  if (!Number.isInteger(n) || n < 0) throw new Error("Invalid factorial");
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function clearAll() { expression = ''; updateDisplay(); }
function clearEntry() { expression = '0'; updateDisplay(); }
function deleteLast() {
  if (expression.length > 0) {
    expression = expression.slice(0, -1);
    if (expression === '') expression = '0';
    updateDisplay();
  }
}

function calculate() {
  try {
    let evalExpr = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E');

    evalExpr = evalExpr.replace(/1\/(?!\()/g, '1/(');

    // Safe eval with limited scope
    const result = eval(evalExpr);

    if (isNaN(result) || !isFinite(result)) throw new Error("Invalid");

    expression = Number(result.toPrecision(12)).toString();
    updateDisplay();
  } catch (err) {
    display.textContent = 'Error';
    display.classList.add('display-error');
    setTimeout(() => {
      clearAll();
      display.classList.remove('display-error');
    }, 1400);
  }
}

// Memory functions
function memoryStore() { memory = parseFloat(expression) || 0; }
function memoryRecall() { appendToDisplay(memory.toString()); }
function memoryAdd() {
  let val = parseFloat(expression) || 0;
  memory += val;
}
function memoryClear() { memory = 0; }

// Keyboard support (limited to scientific mode)
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('scientific').classList.contains('active')) return;
  // ... same as before ...
});

// ── Unit Converter ───────────────────────────────────────────────
const unitCategories = {
  length: {
    m: 1, cm: 0.01, mm: 0.001, km: 1000,
    in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344
  },
  weight: {
    kg: 1, g: 0.001, mg: 1e-6, lb: 0.453592, oz: 0.0283495
  },
  area: {
    'm²': 1, 'cm²': 1e-4, 'mm²': 1e-6, 'km²': 1e6,
    'in²': 0.00064516, 'ft²': 0.092903, 'ac': 4046.86, 'ha': 10000
  },
  volume: {
    L: 1, mL: 0.001, 'cm³': 0.001, 'm³': 1000,
    'gal (US)': 3.78541, 'fl oz (US)': 0.0295735
  },
  speed: {
    'km/h': 1, mph: 1.60934, 'm/s': 3.6, kt: 1.852
  },
  time: {
    s: 1, min: 60, h: 3600, d: 86400
  },
  temperature: {} // special
};

const categorySelect = document.getElementById('category');
const fromUnit = document.getElementById('fromUnit');
const toUnit   = document.getElementById('toUnit');
const unitInput = document.getElementById('unitInput');
const unitResult = document.getElementById('unitResult');

function populateUnits() {
  const cat = categorySelect.value;
  fromUnit.innerHTML = toUnit.innerHTML = '';

  let units = cat === 'temperature' ? ['°C','°F','K'] : Object.keys(unitCategories[cat]);

  units.forEach(u => {
    let opt = document.createElement('option');
    opt.value = u;
    opt.text = u;
    fromUnit.appendChild(opt.cloneNode(true));
    toUnit.appendChild(opt);
  });

  // sensible defaults
  fromUnit.value = cat === 'temperature' ? '°C' : (cat === 'area' ? 'm²' : (cat in unitCategories ? Object.keys(unitCategories[cat])[0] : ''));
  toUnit.value   = cat === 'temperature' ? '°F' : (cat === 'area' ? 'ft²' : (cat in unitCategories ? Object.keys(unitCategories[cat])[1] : ''));
}

function convertUnit() {
  const cat = categorySelect.value;
  const val = parseFloat(unitInput.value) || 0;
  const from = fromUnit.value;
  const to   = toUnit.value;

  let result;

  if (cat === 'temperature') {
    let c;
    if (from === '°C') c = val;
    else if (from === '°F') c = (val - 32) * 5/9;
    else if (from === 'K') c = val - 273.15;

    if (to === '°C') result = c;
    else if (to === '°F') result = c * 9/5 + 32;
    else if (to === 'K') result = c + 273.15;
  } else {
    const base = val * unitCategories[cat][from];
    result = base / unitCategories[cat][to];
  }

  unitResult.textContent = `Result: ${isNaN(result) ? '—' : result.toFixed(6)} ${to}`;
}

categorySelect.addEventListener('change', () => { populateUnits(); convertUnit(); });
[unitInput, fromUnit, toUnit].forEach(el => el.addEventListener('input', convertUnit));

// Initial
populateUnits();

// ── Date Diff (unchanged) ────────────────────────────────────────
function calcDateDiff() {
  const from = document.getElementById('dateFrom').value;
  const to   = document.getElementById('dateTo').value;
  const res = document.getElementById('dateResult');

  if (!from || !to) {
    res.textContent = "Difference: Please select both dates";
    return;
  }

  const d1 = new Date(from), d2 = new Date(to);
  if (isNaN(d1) || isNaN(d2)) {
    res.textContent = "Difference: Invalid date";
    return;
  }

  const diff = Math.abs(d2 - d1);
  const days = Math.floor(diff / 86400000);
  res.textContent = `Difference: \( {days} day \){days !== 1 ? 's' : ''}`;
}