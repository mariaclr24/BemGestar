let agendamentoConfirmado = false;

window.addEventListener('beforeunload', (e) => {
  if (!agendamentoConfirmado) {
    e.preventDefault();
    e.returnValue = 'Tem certeza que deseja sair do agendamento?';
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const idAula = params.get('idAula');
  const userId = localStorage.getItem('userId');
  const detalhesDiv = document.getElementById('detalhesAula');
  const msg = document.getElementById('msgErro');
  const confirmarBtn = document.getElementById('confirmarBtn');
  let aulaSelecionada = null;

  if (!userId) {
    alert("⚠️ Acesso negado. Por favor, faça login.");
    window.location.href = "login.html";
    return;
  }

  try {
    const resp = await fetch('/api/aulas');
    const aulas = await resp.json();
    aulaSelecionada = aulas.find(a => a.id_aula == idAula);

    if (!aulaSelecionada) {
      detalhesDiv.innerHTML = '<p class="text-danger">Aula não encontrada.</p>';
      confirmarBtn.disabled = true;
      return;
    }

    const data = new Date(aulaSelecionada.data).toLocaleString();
    detalhesDiv.innerHTML = `
      <p><strong>Terapia:</strong> ${aulaSelecionada.nome_terapia}</p>
      <p><strong>Data:</strong> ${data}</p>
      <p><strong>Profissional:</strong> ${aulaSelecionada.nome_profissional}</p>
      <p><strong>Espaço:</strong> ${aulaSelecionada.nome_espaco}</p>
      <p><strong>Clínica:</strong> ${aulaSelecionada.nome_clinica}</p>
    `;
  } catch (err) {
    detalhesDiv.innerHTML = '<p class="text-danger">Erro ao carregar detalhes da aula.</p>';
    confirmarBtn.disabled = true;
    return;
  }

  async function verificarRecomendacao(id_terapia) {
    try {
      const resp = await fetch(`/api/avaliacao-terapia/${userId}/${id_terapia}`);
      const data = await resp.json();
      return data.tipo;
    } catch (err) {
      console.error("Erro ao verificar recomendação:", err);
      return null;
    }
  }

  confirmarBtn.addEventListener('click', async () => {
    msg.textContent = '';
    msg.classList.add('d-none');
    msg.classList.remove('alert-danger', 'alert-warning');

    if (!aulaSelecionada) return;

    const tipo = await verificarRecomendacao(aulaSelecionada.id_terapia);
    if (tipo === 'proibida') {
      msg.innerHTML = `
        <div style="font-size: 1.5rem; font-weight: bold; color: #a30000;">
          ⛔ Esta terapia está <strong>proibida</strong> para si. O agendamento não é permitido.
        </div>`;
      msg.classList.remove('d-none');
      msg.classList.add('alert-danger');
      setTimeout(() => window.location.href = 'aulas.html', 3500);
      return;
    }

    if (tipo === 'nao_recomendada') {
      const continuar = confirm("⚠️ Esta terapia não é recomendada. Deseja mesmo continuar com o agendamento?");
      if (!continuar) {
        window.location.href = 'aulas.html';
        return;
      }
    }

    agendamentoConfirmado = true;

    const dataFormatada = encodeURIComponent(aulaSelecionada.data);
    window.location.href = `pagamento.html?idAula=${aulaSelecionada.id_aula}&data=${dataFormatada}`;
  });
});
