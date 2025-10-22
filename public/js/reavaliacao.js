document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token'); // JWT guardado após login
  const form = document.getElementById('formReavaliacao');
  const tabela = document.getElementById('listaReavaliacoes');
  const msg = document.getElementById('mensagem');

  if (!token) {
    msg.textContent = 'Erro: sessão expirada. Por favor, faça login novamente.';
    msg.className = 'text-danger';
    return;
  }

async function carregarReavaliacoes() {
  const token = localStorage.getItem('token');
  const tabela = document.getElementById('listaReavaliacoes');
  const msg = document.getElementById('mensagem');

  try {
    const res = await fetch('/api/reavaliacoes', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta inválida do servidor (esperava JSON)');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || 'Erro ao carregar reavaliações');
    }

    tabela.innerHTML = '';

    if (!data || data.length === 0) {
      tabela.innerHTML = `<tr><td colspan="3" class="text-center">Nenhuma reavaliação marcada</td></tr>`;
      return;
    }

    data.forEach(r => {
      const dataObj = new Date(r.data_avaliacao);
      const dataStr = dataObj.toLocaleDateString('pt-PT');
      const horaStr = dataObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

      tabela.innerHTML += `
        <tr>
          <td>${dataStr}</td>
          <td>${horaStr}</td>
          <td>${r.profissional}</td>
        </tr>
      `;
    });

    msg.textContent = '';
  } catch (err) {
    msg.textContent = `Erro: ${err.message}`;
    msg.className = 'text-danger';
    tabela.innerHTML = `<tr><td colspan="3" class="text-danger text-center">Erro ao carregar reavaliações</td></tr>`;
    console.error(err);
  }
}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = document.getElementById('data').value;
    const hora = document.getElementById('hora').value;

    if (!data || !hora) {
      msg.textContent = 'Por favor, preenche todos os campos.';
      msg.className = 'text-danger';
      return;
    }

    try {
      const res = await fetch('/api/reavaliacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ data, hora }) // O ID é lido do token no backend
      });

      const result = await res.json();
      msg.textContent = result.mensagem || result.erro;
      msg.className = result.erro ? 'text-danger' : 'text-success';

      if (!result.erro) {
        form.reset();
        carregarReavaliacoes();
      }
    } catch (err) {
      msg.textContent = 'Erro ao marcar reavaliação';
      msg.className = 'text-danger';
      console.error('Erro:', err);
    }
  });

  carregarReavaliacoes();
});
