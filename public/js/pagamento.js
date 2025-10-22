const userId = localStorage.getItem('userId');
const params = new URLSearchParams(window.location.search);
const idAula = params.get('idAula');
const data = params.get('data');
let aulaConfirmada = null;

if (!userId) {
  alert("⚠️ Faça login para continuar.");
  window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', async () => {
  const detalhes = document.getElementById('detalhesAula');

  let tempoRestante = 15 * 60;
  const temporizadorEl = document.getElementById("temporizador");
  const intervalo = setInterval(() => {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    temporizadorEl.textContent = `⏳ Tempo restante para pagamento: ${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

    if (tempoRestante <= 0) {
      clearInterval(intervalo);
      alert("⏰ Tempo esgotado. A aula será desmarcada.");
      window.location.href = "aulas.html";
    }

    tempoRestante--;
  }, 1000);

  try {
    const resp = await fetch('/api/aulas');
    const aulas = await resp.json();
    aulaConfirmada = aulas.find(a => a.id_aula == idAula);

    if (!aulaConfirmada) {
      detalhes.innerHTML = '<p class="text-danger">Aula não encontrada.</p>';
      return;
    }

    detalhes.innerHTML = `
      <p><strong>Terapia:</strong> ${aulaConfirmada.nome_terapia}</p>
      <p><strong>Data:</strong> ${new Date(data).toLocaleString()}</p>
      <p><strong>Valor:</strong> ${Number(aulaConfirmada.valor).toFixed(2)}€</p>
    `;
  } catch (err) {
    detalhes.innerHTML = '<p class="text-danger">Erro ao carregar dados da aula.</p>';
  }
});

document.getElementById('formPagamento').addEventListener('submit', async (e) => {
  e.preventDefault();

  const metodo = document.querySelector('input[name="metodo"]:checked').value;
  const simulacao = document.getElementById('simulacaoPagamento');
  const mensagem = document.getElementById('mensagemPagamento');

  if (!aulaConfirmada) return;

  try {
    const response = await fetch('/api/agendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_utilizador: userId,
        id_aula: aulaConfirmada.id_aula,
        data_agendamento: data
      })
    });

    const result = await response.json();

    if (response.ok) {
      if (result.em_espera) {
        const confirmar = confirm(result.mensagem || "A aula está cheia. Deseja entrar na lista de espera?");
        if (confirmar) {
          alert("✅ Foi adicionado à lista de espera.");
        } else {
          alert("⛔ Não foi adicionado à lista de espera.");
        }
        window.location.href = "aulas.html";
        return;
      }

      simulacao.style.display = 'block';
      simulacao.innerHTML = `<div class="alert alert-info">💳 Processando pagamento via ${metodo}...</div>`;

      setTimeout(() => {
        simulacao.style.display = 'none';
        window.onbeforeunload = null;

        if (result.pago) {
          mensagem.innerHTML = `<div class="alert alert-success">✅ Aula agendada e paga com o seu saldo!</div>`;
        } else {
          const falta = parseFloat(result.falta_pagar);
          if (falta === Number(aulaConfirmada.valor)) {
            mensagem.innerHTML = `<div class="alert alert-warning">⚠️ Pagamento total de <strong>${falta.toFixed(2)}€</strong> feito via <strong>${metodo}</strong>.</div>`;
          } else {
            mensagem.innerHTML = `<div class="alert alert-warning">⚠️ Parte paga com saldo. Restante a pagar via <strong>${metodo}</strong>: <strong>${falta.toFixed(2)}€</strong></div>`;
          }
        }

        setTimeout(() => {
          window.location.href = 'agendados.html';
        }, 3000);
      }, 2000);
    } else {
      alert(result.error || "Erro ao confirmar pagamento.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao comunicar com o servidor.");
  }
});
