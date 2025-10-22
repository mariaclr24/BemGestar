let aulas = []; // global para guardar as aulas carregadas
const modalInscritos = new bootstrap.Modal(document.getElementById('modalInscritos'));

async function carregarAulas() {
  const resposta = await fetch('/api/admin/aulas');
  aulas = await resposta.json();
  const tbody = document.getElementById("tabelaAulas");
  tbody.innerHTML = "";

  const dataFiltro = document.getElementById("filtroData").value;
  const tFiltro = document.getElementById("filtroTerapia").value.toLowerCase();
  const pFiltro = document.getElementById("filtroProfissional").value.toLowerCase();
  const cFiltro = document.getElementById("filtroClinica").value.toLowerCase();
  const eFiltro = document.getElementById("filtroEspaco").value.toLowerCase();

  aulas.filter(a => {
    return (!dataFiltro || a.data.startsWith(dataFiltro)) &&
           (!tFiltro || a.nome_terapia.toLowerCase().includes(tFiltro)) &&
           (!pFiltro || a.nome_profissional.toLowerCase().includes(pFiltro)) &&
           (!cFiltro || a.nome_clinica.toLowerCase().includes(cFiltro)) &&
           (!eFiltro || a.nome_espaco.toLowerCase().includes(eFiltro));
  }).forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.id_aula}</td>
      <td>${a.nome_clinica}</td>
      <td>${a.nome_espaco}</td>
      <td>${a.nome_terapia}</td>
      <td>${a.nome_profissional}</td>
      <td><input type="date" class="form-control" value="${a.data.split('T')[0]}" id="data-${a.id_aula}"/></td>
      <td><input type="time" class="form-control" value="${a.hora}" id="hora-${a.id_aula}"/></td>
      <td class="text-center">
        ${a.vagas_ocupadas} / ${a.n_vagas}<br/>
        <button class="btn btn-link p-0" onclick="mostrarInscritos(${a.id_aula})">Ver inscritos</button>
      </td>
      <td>
        <button class="btn btn-sm btn-success" onclick="editarAula(${a.id_aula})">💾</button>
        <button class="btn btn-sm btn-danger" onclick="cancelarAula(${a.id_aula})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function mostrarInscritos(idAula) {
  const aula = aulas.find(a => a.id_aula === idAula);
  const container = document.getElementById('modalInscritosBody');

  if (!aula || !aula.inscritos || aula.inscritos.length === 0) {
    container.innerHTML = '<p>Não há inscritos nesta aula.</p>';
  } else {
    let html = '<table class="table table-striped"><thead><tr><th>ID</th><th>Nome</th></tr></thead><tbody>';
    aula.inscritos.forEach(i => {
      html += `<tr><td>${i.id_utilizador}</td><td>${i.nome}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  modalInscritos.show();
}


async function criarAula() {
  const dataInput = document.getElementById("dataAula").value;
  const horaInput = document.getElementById("horaAula").value;

  if (!dataInput) {
    alert("Por favor, selecione uma data para a aula.");
    return;
  }
  if (!horaInput) {
    alert("Por favor, selecione uma hora para a aula.");
    return;
  }

  const dados = {
    id_clinica: document.getElementById("clinicaSelect").value,
    id_terapia: document.getElementById("terapiaSelect").value,
    id_espaco: document.getElementById("espacoSelect").value,
    data: dataInput,
    hora: horaInput,
    n_vagas: 0,
    id_utilizador: document.getElementById("profissionalSelect").value
  };

  try {
    const response = await fetch('/api/admin/aulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Erro ao criar aula.");
      return;
    }

    alert(result.message);
    carregarAulas();
  } catch (err) {
    alert("Erro na comunicação com o servidor.");
    console.error(err);
  }
}


async function editarAula(id) {
  const dados = {
    data: document.getElementById(`data-${id}`).value,
    hora: document.getElementById(`hora-${id}`).value
  };

  await fetch(`/api/admin/aulas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  alert("Aula atualizada.");
}

async function cancelarAula(id) {
  if (!confirm("Tem a certeza que deseja cancelar esta aula?")) return;
  await fetch(`/api/admin/aulas/${id}`, { method: 'DELETE' });
  carregarAulas();
}

async function carregarSelects() {
  const [clinicas, espacos, terapias, profissionais] = await Promise.all([
    fetch('/api/clinicas').then(r => r.json()),
    fetch('/api/espacos').then(r => r.json()),
    fetch('/api/terapias').then(r => r.json()),
    fetch('/api/profissionais').then(r => r.json())
  ]);

  preencherSelect("clinicaSelect", clinicas, 'id_clinica');
  preencherSelect("espacoSelect", espacos, 'id_espaco');
  preencherSelect("terapiaSelect", terapias, 'id_terapia');
  preencherSelect("profissionalSelect", profissionais, 'id_utilizador');
}

function preencherSelect(id, lista, campoId) {
  const select = document.getElementById(id);
  select.innerHTML = lista.map(e => `<option value="${e[campoId]}">${e.nome}</option>`).join("");
}

carregarSelects();
carregarAulas();
