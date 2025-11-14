const anysDisponibles = [ 2023, 2024, 2025 ];

function generaBotonsAnys(selectedAny = anysDisponibles[anysDisponibles.length - 1]) {
    const selector = document.querySelector('.year-selector');
    selector.innerHTML = '';
    anysDisponibles.forEach(any => {
        const btn = document.createElement('button');
        btn.textContent = any;
        if (any === selectedAny) btn.classList.add('active');
        btn.onclick = () => {
            generaBotonsAnys(any);   // Regenera els botons amb el correcte marcat
            loadYear(any);           // Carrega les dades de l'any seleccionat
        };
        selector.appendChild(btn);
    });
}

async function loadYear(any) {
    const response = await fetch(`${any}.csv`);
    const text = await response.text();
    const lines = text.trim().split('\n');

    // Primera línia: PUNTS_REQUERITS;245
    const requerits = parseInt(lines[0].split(';')[1]);
    document.getElementById('punts-requerits').textContent = requerits;

    const tbody = document.querySelector('#caminades-table tbody');
    tbody.innerHTML = '';

    let totalPunts = 0, totalKm = 0, totalDesnivell = 0;

    const puntsSpan = document.getElementById('punts');
    const summary = document.getElementById('summary');
    const assolitText = document.getElementById('assolit-text');

    // Utilitat per refrescar el resum (manté sempre el número)
    function updateSummary() {
        puntsSpan.textContent = totalPunts;
        if (totalPunts >= requerits) {
            summary.classList.add('success');
            assolitText.classList.remove('ocult');
        } else {
            summary.classList.remove('success');
            assolitText.classList.add('ocult');
        }
    }

    lines.slice(2).forEach(line => {
        const [data, nom, kms, desnivell, punts] = line.split(';');
        const tr = document.createElement('tr');
        tr.setAttribute('tabindex', '0'); // accessibilitat opcional

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        // Quan el checkbox canvia, actualitzem totals i estils
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                totalPunts += parseInt(punts);
                totalKm += parseInt(kms);
                totalDesnivell += parseInt(desnivell);
            } else {
                totalPunts -= parseInt(punts);
                totalKm -= parseInt(kms);
                totalDesnivell -= parseInt(desnivell);
            }

            // Actualitza valors
            document.getElementById('kms').textContent = totalKm;
            document.getElementById('desnivell').textContent = totalDesnivell;

            // Actualitza estat visual del resum (no perdem el número)
            updateSummary();

            // Sincronitza la classe visual de la fila
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
    document.getElementById('kms').textContent = totalKm;
    document.getElementById('desnivell').textContent = totalDesnivell;
    updateSummary();

    // Sincronitza estat visual de totes les files
    initRowSelectionState();
}

/* =========================
   Selecció per clic a la fila
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#caminades-table tbody');
  if (!tableBody) return;

  // Delegació de clics
  tableBody.addEventListener('click', (e) => {
    // Si cliques directament el checkbox, respecta el comportament estàndard
    if (e.target && e.target.closest('input[type="checkbox"]')) {
      const tr = e.target.closest('tr');
      syncRowSelectedClass(tr);
      return;
    }

    const tr = e.target.closest('tr');
    if (!tr) return;

    const checkbox = tr.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    // Toggle manual + dispara 'change' per reutilitzar la lògica
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Accessibilitat opcional: espai/enter fan toggle
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

// Afegeix/treu la classe 'selected' segons l'estat del checkbox
function syncRowSelectedClass(tr) {
  const checkbox = tr?.querySelector('input[type="checkbox"]');
  if (!checkbox) return;
  tr.classList.toggle('selected', checkbox.checked);
}

// Recorre totes les files i ajusta la classe 'selected'
function initRowSelectionState() {
  const tableBody = document.querySelector('#caminades-table tbody');
  if (!tableBody) return;
  tableBody.querySelectorAll('tr').forEach(tr => syncRowSelectedClass(tr));
}

// Genera els botons i carrega l'any més recent per defecte
generaBotonsAnys();
