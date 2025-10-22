let todosProfissionais = [];
let todosUtentes = [];

document.getElementById('filtro').addEventListener('input', renderizarListas);
document.getElementById('ordenarPor').addEventListener('change', renderizarListas);

async function carregarUtilizadores() {
  try {
    const resp = await fetch('/api/utilizadores/separados');
    const data = await resp.json();
    todosProfissionais = data.profissionais || [];
    todosUtentes = data.utentes || [];
    renderizarListas();
  } catch {
    document.getElementById('listaUtilizadores').innerHTML = '<p class="text-danger">Erro ao carregar utilizadores.</p>';
  }
}

function renderizarListas() {
  const filtro = document.getElementById('filtro').value.toLowerCase();
  const ordenar = document.getElementById('ordenarPor').value;

  function filtrarEOrdenar(lista, camposFiltro, campoOrdenar) {
    let filtrado = lista.filter(u =>
      camposFiltro.some(campo => (u[campo] || '').toString().toLowerCase().includes(filtro))
    );
    filtrado.sort((a, b) => {
      if (campoOrdenar === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else {
        return a.id_utilizador - b.id_utilizador;
      }
    });
    return filtrado;
  }

  const profsFiltrados = filtrarEOrdenar(todosProfissionais, ['nome', 'email', 'especialidade', 'clinica', 'id_utilizador'], ordenar);
const utentesFiltrados = filtrarEOrdenar(todosUtentes, ['nome', 'email', 'estado', 'profissional_responsavel', 'id_utilizador'], ordenar);

  const tbodyProfs = document.querySelector('#tabelaProfissionais tbody');
  tbodyProfs.innerHTML = profsFiltrados.map(u => `
  <tr>
    <td>${u.id_utilizador}</td>
    <td>${u.nome}</td>
    <td>${u.email}</td>
    <td>${u.especialidade || '-'}</td>
    <td>${u.clinica || '-'}</td>
    <td>
      <button class="btn btn-sm btn-${u.ativo ? 'warning' : 'success'} me-2" onclick="toggleAtivo(${u.id_utilizador}, ${!u.ativo})">
        ${u.ativo ? 'Desativar' : 'Ativar'}
      </button>
      <button class="btn btn-sm btn-danger" onclick="apagar(${u.id_utilizador})">Apagar</button>
    </td>
  </tr>
`).join('');


  const tbodyUtentes = document.querySelector('#tabelaUtentes tbody');
  tbodyUtentes.innerHTML = utentesFiltrados.map(u => `
  <tr>
    <td>${u.id_utilizador}</td>
    <td>${u.nome}</td>
    <td>${u.email}</td>
    <td>${u.estado || '-'}</td>
    <td>${u.profissional_responsavel || '-'}</td>
    <td>
      <button class="btn btn-sm btn-${u.ativo ? 'warning' : 'success'} me-2" onclick="toggleAtivo(${u.id_utilizador}, ${!u.ativo})">
        ${u.ativo ? 'Desativar' : 'Ativar'}
      </button>
      <button class="btn btn-sm btn-danger" onclick="apagar(${u.id_utilizador})">Apagar</button>
    </td>
  </tr>
`).join('');
}

async function toggleAtivo(id, novoEstado) {
  try {
    const resp = await fetch(`/api/utilizadores/${id}/ativo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: novoEstado })
    });

    if (resp.ok) {
      carregarUtilizadores();
    } else {
      const erro = await resp.json();
      alert(erro.error || "Erro ao atualizar estado.");
    }
  } catch {
    alert("Erro ao comunicar com o servidor.");
  }
}

async function apagar(id) {
  if (!confirm("Tem a certeza que deseja apagar este utilizador?")) return;

  try {
    const resp = await fetch(`/api/utilizadores/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      carregarUtilizadores();
    } else {
      const erro = await resp.json();
      alert(erro.error || "Erro ao apagar utilizador.");
    }
  } catch {
    alert("Erro ao comunicar com o servidor.");
  }
}

carregarUtilizadores();
