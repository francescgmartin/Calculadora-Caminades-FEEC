const anysDisponibles = [2023, 2024, 2025];

function generaBotonsAnys(selectedAny = anysDisponibles[anysDisponibles.length - 1]) {
  const selector = document.querySelector('.year-selector');
  if (!selector) return; // si no existeix, sortim silenciosament
  selector.innerHTML = '';
  anysDisponibles.forEach(any => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = any;
    btn.classList.toggle('active', any === selectedAny);
    btn.onclick = () => {
      // Regenera els botons amb el correcte marcat i carrega l'any
      generaBotonsAnys(any);
      loadYear(any);
    };
    selector.appendChild(btn);
  });
}

async function loadYear(any) {
  // Protecció bàsica si criden amb undefined
  if (!any) return;
  try {
    const response = await fetch(`${any}.csv`);
    if (!response.ok) {
      console.error(`Error fetching ${any}.csv:`, response.status, response.statusText);
      // netegem la taula i valors en cas d'error
      const tbodyErr = document.querySelector('#caminades-table tbody');
      if (tbodyErr) tbodyErr.innerHTML = '';
      document.getElementById('punts-requerits') && (document.getElementById('punts-requerits').textContent = '—');
      document.getElementById('kms') && (document.getElementById('kms').textContent = '0');
      document.getElementById('desnivell') && (document.getElementById('desnivell').textContent = '0');
      document.getElementById('punts') && (document.getElementById('punts').textContent = '0');
      return;
    }

    const text = await response.text();
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Primera línia: PUNTS_REQUERITS;245
    const firstParts = lines[0].split(';');
    const requerits = firstParts.length >= 2 ? parseInt(firstParts[1], 10) : 0;
    const puntsRequeritsEl = document.getElementById('punts-requerits');
    if (puntsRequeritsEl) puntsRequeritsEl.textContent = isNaN(requerits) ? '—' : requerits;

    const tbody = document.querySelector('#caminades-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let totalPunts = 0, totalKm = 0, totalDesnivell = 0;

    const puntsSpan = document.getElementById('punts');
    const summary = document.getElementById('summary');
    const assolitText = document.getElementById('assolit-text');

    function updateSummary() {
      if (puntsSpan) puntsSpan.textContent = totalPunts;
      if (!summary || !assolitText) return;
      if (requerits && totalPunts >= requerits) {
        summary.classList.add('success');
        assolitText.classList.remove('ocult');
      } else {
        summary.classList.remove('success');
        assolitText.classList.add('ocult');
      }
    }

    // Les línies de dades comencen normalment a partir de la línia 3 (index >= 2),
    // però com que fem filter(Boolean) i no depenem d'un índex fix, agafuem les que siguin després de la capçalera.
    // Aquí suposem que les dues primeres línies són info + capçalera; mantenim el comportament original:
    const dataLines = lines.slice(2);

    dataLines.forEach(line => {
      const parts = line.split(';');
      // Protecció si la línia no té 5 camps
      if (parts.length < 5) return;
      const [data, nom, kms, desnivell, punts] = parts;
      const tr = document.createElement('tr');
      tr.setAttribute('tabindex', '0');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      checkbox.addEventListener('change', () => {
        const pts = parseInt(punts || '0', 10) || 0;
        const k = parseInt(kms || '0', 10) || 0;
        const d = parseInt(desnivell || '0', 10) || 0;
        if (checkbox.checked) {
          totalPunts += pts;
          totalKm += k;
          totalDesnivell += d;
        } else {
          totalPunts -= pts;
          totalKm -= k;
          totalDesnivell -= d;
        }
        const kmsEl = document.getElementById('kms');
        const desnEl = document.getElementById('desnivell');
        if (kmsEl) kmsEl.textContent = totalKm;
        if (desnEl) desnEl.textContent = totalDesnivell;
        updateSummary();
        syncRowSelectedClass(tr);
      });

      tr.innerHTML = `<td>${data}</td><td>${nom}</td><td>${kms}</td><td>${desnivell}</td><td>${punts}</td>`;
      const tdCheck = document.createElement('td');
      tdCheck.appendChild(checkbox);
      tr.appendChild(tdCheck);
      tbody.appendChild(tr);
    });

    // Estat inicial net
    totalPunts = 0;
    totalKm = 0;
    totalDesnivell = 0;
    const kmsElInit = document.getElementById('kms');
    const desnElInit = document.getElementById('desnivell');
    if (kmsElInit) kmsElInit.textContent = totalKm;
    if (desnElInit) desnElInit.textContent = totalDesnivell;
    updateSummary();

    // Sincronitza estat visual de totes les files
    initRowSelectionState();
  } catch (err) {
    console.error('Error carregant l\'any', any, err);
  }
}

/* =========================
   Selecció per clic a la fila
   ========================= */

function syncRowSelectedClass(tr) {
  const checkbox = tr?.querySelector('input[type="checkbox"]');
  if (!checkbox) return;
  tr.classList.toggle('selected', checkbox.checked);
}

function initRowSelectionState() {
  const tableBody = document.querySelector('#caminades-table tbody');
  if (!tableBody) return;
  tableBody.querySelectorAll('tr').forEach(tr => syncRowSelectedClass(tr));
}

// Inicialització global al DOMContentLoaded: genera botons, carrega l'any per defecte i configura delegació d'esdeveniments
document.addEventListener('DOMContentLoaded', () => {
  const defaultAny = anysDisponibles[anysDisponibles.length - 1];

  // Comprovacions bàsiques per ajudar si alguna cosa no existeix
  if (!document.querySelector('.year-selector')) {
    console.warn('No s\'ha trobat .year-selector al DOM. Comprova que l\'HTML tingui un element amb aquesta classe.');
  }

  // Genera botons i marca l'any per defecte
  generaBotonsAnys(defaultAny);

  // Carrega les dades de l'any per defecte
  loadYear(defaultAny);

  // Delegació de clics i teclat a la taula (només una vegada)
  const tableBody = document.querySelector('#caminades-table tbody');
  if (!tableBody) return;

  tableBody.addEventListener('click', (e) => {
    // Si es clica directament el checkbox, respectem el comportament per defecte (l'event 'change' s'encarregarà)
    if (e.target && e.target.closest('input[type="checkbox"]')) {
      const tr = e.target.closest('tr');
      if (tr) syncRowSelectedClass(tr);
      return;
    }

    const tr = e.target.closest('tr');
    if (!tr) return;

    const checkbox = tr.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Accessibilitat: espai/enter fan toggle sobre la fila
  tableBody.addEventListener('keydown', (e) => {
    if (!(e.key === ' ' || e.key === 'Enter')) return;
    const tr = e.target.closest('tr');
    if (!tr) return;
    const checkbox = tr.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    e.preventDefault();
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });
});
