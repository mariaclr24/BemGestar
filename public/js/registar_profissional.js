document.addEventListener('DOMContentLoaded', () => {
  const btnAbrirLista = document.getElementById('btnAbrirLista');
  const modalElement = document.getElementById('modalProfissionais');
  const modalProfissionais = new bootstrap.Modal(modalElement);
  const tbody = document.querySelector('#listaProfissionais tbody');

  btnAbrirLista.addEventListener('click', async () => {
    try {
      const resp = await fetch('/api/admin/profissionais');
      if (!resp.ok) throw new Error('Falha ao carregar profissionais.');
      const profissionais = await resp.json();

      tbody.innerHTML = '';

      profissionais.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id_utilizador}</td>
        <td>${p.nome}</td>
        <td>${p.email}</td>
        <td>${p.especialidade || '-'}</td>
        <td>${p.nome_clinica || '-'}</td>
      `;
      tbody.appendChild(tr);
    });

      modalProfissionais.show();
    } catch (err) {
      alert('Erro ao carregar profissionais.');
      console.error(err);
    }
  });

  // 🔽 Nova função para carregar clínicas no <select>
  async function carregarClinicas() {
    try {
      const resp = await fetch('/api/clinicas');
      if (!resp.ok) throw new Error('Erro ao carregar clínicas');
      const clinicas = await resp.json();

      const select = document.getElementById('clinica');
      clinicas.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id_clinica;
        option.textContent = c.nome;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Erro ao carregar clínicas:', err);
    }
  }

  carregarClinicas(); // 🔁 chamada ao carregar a página

  // Submissão do formulário
  const form = document.getElementById('formProfissional');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      senha: document.getElementById('password').value,
      especialidade: document.getElementById('especialidade').value.trim(),
      hora_almoco_inicio: document.getElementById('hora_almoco_inicio').value || null,
      hora_almoco_fim: document.getElementById('hora_almoco_fim').value || null,
      id_clinica: document.getElementById('clinica').value
    };

    try {
      const resp = await fetch('/api/admin/profissionais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const result = await resp.json();
      const msgDiv = document.getElementById('mensagem');

      if (resp.ok) {
        msgDiv.innerHTML = '<div class="alert alert-success">Profissional registado com sucesso!</div>';
        form.reset();
      } else {
        msgDiv.innerHTML = `<div class="alert alert-danger">${result.error || 'Erro ao registar.'}</div>`;
      }
    } catch (err) {
      console.error(err);
      document.getElementById('mensagem').innerHTML = '<div class="alert alert-danger">Erro na comunicação com o servidor.</div>';
    }
  });
});
