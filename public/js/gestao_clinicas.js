 async function carregarClinicas() {
    const resposta = await fetch('/api/admin/clinicas');
    const clinicas = await resposta.json();
    const tbody = document.getElementById("tabelaClinicas");
    tbody.innerHTML = "";

    clinicas.forEach(c => {
      const dias = c.dias_funcionamento || [];

      const checkboxes = [0,1,2,3,4,5,6].map(d => {
        const checked = dias.includes(d) ? 'checked' : '';
        const nomeDia = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][d];
        return `<label class="me-1"><input type="checkbox" value="${d}" ${checked}> ${nomeDia}</label>`;
      }).join(" ");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id_clinica}</td>
        <td><input value="${c.nome}" id="nome-${c.id_clinica}" class="form-control"/></td>
        <td><input value="${c.localizacao}" id="loc-${c.id_clinica}" class="form-control"/></td>
        <td><input value="${c.hora_abertura}" id="abrir-${c.id_clinica}" type="time" class="form-control"/></td>
        <td><input value="${c.hora_fecho}" id="fechar-${c.id_clinica}" type="time" class="form-control"/></td>
        <td id="dias-${c.id_clinica}">${checkboxes}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="atualizar(${c.id_clinica})">💾</button>
          <button class="btn btn-sm btn-danger" onclick="apagar(${c.id_clinica})">🗑</button>
          <button class="btn btn-sm btn-info" onclick="verEspacos(${c.id_clinica})">🔍 Espaços</button>
        </td>
      `;
      tbody.appendChild(tr);

      const espacoRow = document.createElement("tr");
      espacoRow.id = `espacos-${c.id_clinica}`;
      espacoRow.style.display = 'none';
      espacoRow.innerHTML = `<td colspan="7"><div id="areaEspacos-${c.id_clinica}"><em>A carregar...</em></div></td>`;
      tbody.appendChild(espacoRow);
    });
  }

  function obterDiasSelecionados(id) {
    const checkboxes = document.querySelectorAll(`#dias-${id} input[type="checkbox"]`);
    return Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));
  }

  function obterDiasNovos() {
    const checkboxes = document.querySelectorAll("#diasNovos input[type='checkbox']");
    return Array.from(checkboxes).filter(c => c.checked).map(c => parseInt(c.value));
  }

  async function atualizar(id) {
    const dados = {
      nome: document.getElementById(`nome-${id}`).value,
      localizacao: document.getElementById(`loc-${id}`).value,
      hora_abertura: document.getElementById(`abrir-${id}`).value,
      hora_fecho: document.getElementById(`fechar-${id}`).value,
      dias_funcionamento: obterDiasSelecionados(id)
    };
    await fetch(`/api/admin/clinicas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    alert("Clínica atualizada.");
  }

  async function apagar(id) {
    if (!confirm("Deseja apagar esta clínica?")) return;
    await fetch(`/api/admin/clinicas/${id}`, { method: 'DELETE' });
    carregarClinicas();
  }

  async function adicionar() {
    const dados = {
      nome: document.getElementById("novoNome").value,
      localizacao: document.getElementById("novaLoc").value,
      hora_abertura: document.getElementById("horaAbertura").value,
      hora_fecho: document.getElementById("horaFecho").value,
      dias_funcionamento: obterDiasNovos()
    };
    await fetch('/api/admin/clinicas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    carregarClinicas();
  }

  function preencherDiasNovos() {
    const container = document.getElementById("diasNovos");
    const dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    container.innerHTML = "";
    for (let d = 0; d <= 6; d++) {
      const label = document.createElement("label");
      label.classList.add("me-1");
      label.innerHTML = `<input type="checkbox" value="${d}"> ${dias[d]}`;
      container.appendChild(label);
    }
  }

  async function verEspacos(idClinica) {
    const row = document.getElementById(`espacos-${idClinica}`);
    row.style.display = row.style.display === 'none' ? '' : 'none';
    if (row.style.display !== 'none') carregarEspacos(idClinica);
  }

  async function carregarEspacos(idClinica) {
    const resposta = await fetch(`/api/admin/clinicas/${idClinica}/espacos`);
    const espacos = await resposta.json();
    const container = document.getElementById(`areaEspacos-${idClinica}`);
    let html = `
      <table class="table table-sm table-bordered mt-2">
        <thead><tr><th>ID</th><th>Nome</th><th>Capacidade</th><th>Ações</th></tr></thead>
        <tbody>
          ${espacos.map(e => `
            <tr>
              <td>${e.id_espaco}</td>
              <td><input id="nomeEspaco-${e.id_espaco}" value="${e.nome}" class="form-control form-control-sm"/></td>
              <td><input id="capacidadeEspaco-${e.id_espaco}" value="${e.max_vagas}" class="form-control form-control-sm" type="number"/></td>
              <td>
                <button class="btn btn-sm btn-success" onclick="atualizarEspaco(${e.id_espaco})">💾</button>
                <button class="btn btn-sm btn-danger" onclick="apagarEspaco(${e.id_espaco}, ${idClinica})">🗑</button>
              </td>
            </tr>`).join("")}
          <tr>
            <td>+</td>
            <td><input id="novoEspacoNome-${idClinica}" class="form-control form-control-sm" placeholder="Nome"/></td>
            <td><input id="novoEspacoCap-${idClinica}" type="number" class="form-control form-control-sm" placeholder="Capacidade"/></td>
            <td><button class="btn btn-sm btn-primary" onclick="adicionarEspaco(${idClinica})">➕ Adicionar</button></td>
          </tr>
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }

  async function adicionarEspaco(idClinica) {
    const nome = document.getElementById(`novoEspacoNome-${idClinica}`).value;
    const cap = parseInt(document.getElementById(`novoEspacoCap-${idClinica}`).value);
    await fetch(`/api/admin/clinicas/${idClinica}/espacos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, max_vagas: cap })
    });
    carregarEspacos(idClinica);
  }

  async function atualizarEspaco(id) {
    const nome = document.getElementById(`nomeEspaco-${id}`).value;
    const cap = parseInt(document.getElementById(`capacidadeEspaco-${id}`).value);
    await fetch(`/api/admin/espacos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, max_vagas: cap })
    });
    alert("Espaço atualizado.");
  }

  async function apagarEspaco(id, idClinica) {
    if (!confirm("Deseja apagar este espaço?")) return;
    await fetch(`/api/admin/espacos/${id}`, { method: 'DELETE' });
    carregarEspacos(idClinica);
  }

  preencherDiasNovos();
  carregarClinicas();