const anysDisponibles = [ 2023, 2024, 2025];

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

    // Element dels punts per modificar fàcilment
    const puntsSpan = document.getElementById('punts');

    lines.slice(2).forEach(line => {
        const [data, nom, kms, desnivell, punts] = line.split(';');
        const tr = document.createElement('tr');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            if(checkbox.checked) {
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

            // Assoliment de punts mínims
            if (totalPunts >= requerits) {
                puntsSpan.textContent = 'ASSOLIT';
                puntsSpan.classList.add('punts-assolit');
            } else {
                puntsSpan.textContent = totalPunts;
                puntsSpan.classList.remove('punts-assolit');
            }
        });

        tr.innerHTML = `<td>${data}</td><td>${nom}</td><td>${kms}</td><td>${desnivell}</td><td>${punts}</td>`;
        const tdCheck = document.createElement('td');
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);
        tbody.appendChild(tr);
    });

    // Inicialitza estat (per si tot està desmarcat)
    puntsSpan.textContent = totalPunts;
    puntsSpan.classList.remove('punts-assolit');
}

// Genera els botons i carrega l'any més recent per defecte
generaBotonsAnys();
loadYear(anysDisponibles[anysDisponibles.length - 1]);