document.addEventListener('DOMContentLoaded', () => {
  carregarProfissionais();
  carregarTerapias();

  document.getElementById('formTerapia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id_terapia').value;
    const dados = {
      nome: document.getElementById('nome').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
      n_vagas: document.getElementById('n_vagas').value,
      duracao: document.getElementById('duracao').value,
      valor: document.getElementById('valor').value,
      id_profissional: document.getElementById('profissional').value
    };
    const url = id ? `/api/admin/terapias/${id}` : '/api/admin/terapias';
    const metodo = id ? 'PUT' : 'POST';

    try {
      const resp = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      const result = await resp.json();
      const msg = document.getElementById('mensagem');
      if (resp.ok) {
        msg.innerHTML = `<div class="alert alert-success">Terapia ${id ? 'atualizada' : 'criada'} com sucesso.</div>`;
        document.getElementById('formTerapia').reset();
        document.getElementById('id_terapia').value = '';
        carregarTerapias();
      } else {
        msg.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
      }
    } catch (err) {
      console.error(err);
    }
  });
});

async function carregarProfissionais() {
  try {
    const resp = await fetch('/api/admin/profissionais');
    const lista = await resp.json();
    const sel = document.getElementById('profissional');
    sel.innerHTML = '<option value="">Selecione um profissional</option>';
    lista.forEach(p => {
      const op = document.createElement('option');
      op.value = p.id_utilizador;
      op.textContent = p.nome;
      sel.appendChild(op);
    });
  } catch (err) {
    console.error('Erro ao carregar profissionais:', err);
  }
}

async function carregarTerapias() {
  const tbody = document.querySelector('#listaTerapias tbody');
  tbody.innerHTML = '';
  try {
    const resp = await fetch('/api/admin/terapias');
    const terapias = await resp.json();

    terapias.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.id_terapia}</td>
        <td>${t.nome}</td>
        <td>${t.descricao}</td>
        <td>${t.n_vagas}</td>
        <td>${t.duracao} min</td>
        <td>${Number(t.valor).toFixed(2)}€</td>
        <td>${t.profissional || '—'}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editarTerapia(${t.id_terapia})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="removerTerapia(${t.id_terapia})">Remover</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao carregar terapias:', err);
  }
}

async function editarTerapia(id) {
  try {
    const resp = await fetch(`/api/admin/terapias/${id}`);
    const t = await resp.json();
    document.getElementById('id_terapia').value = t.id_terapia;
    document.getElementById('nome').value = t.nome;
    document.getElementById('descricao').value = t.descricao;
    document.getElementById('n_vagas').value = t.n_vagas;
    document.getElementById('duracao').value = t.duracao;
    document.getElementById('valor').value = t.valor;
    document.getElementById('profissional').value = t.id_profissional || '';
  } catch (err) {
    console.error('Erro ao carregar dados da terapia:', err);
  }
}

async function removerTerapia(id) {
  if (!confirm('Tem a certeza que deseja remover esta terapia?')) return;
  try {
    await fetch(`/api/admin/terapias/${id}`, { method: 'DELETE' });
    carregarTerapias();
  } catch (err) {
    console.error('Erro ao remover terapia:', err);
  }
}
