
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('formQuestionario');
  const mensagem = document.getElementById('mensagem');
  const btnSubmeter = document.getElementById('btnSubmeter');
  const params = new URLSearchParams(window.location.search);
  const id_aula = params.get('id_aula');
  const token = localStorage.getItem('token');

  if (!id_aula || !token) {
    mensagem.textContent = "Erro: sessão inválida ou aula não especificada.";
    mensagem.className = "text-danger";
    return;
  }

  try {
    const res = await fetch(`/api/questionario/resposta/${id_aula}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const resposta = await res.json();

    if (res.ok && resposta && resposta.id_resposta) {
      Object.entries(resposta).forEach(([chave, valor]) => {
        const input = form.elements[chave];
        if (input) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = valor === true;
          } else {
            input.value = valor;
          }
          input.disabled = true;
        }
      });

      Array.from(form.elements).forEach(el => el.disabled = true);
      btnSubmeter.classList.add('d-none');
      mensagem.innerHTML = `<div class="alert alert-info">Já respondeu a este questionário.</div>
        <a href="aulas_realizadas.html" class="btn btn-outline-primary">Voltar às Aulas</a>`;
      return;
    }

  } catch (err) {
    console.warn("Nenhuma resposta anterior encontrada ou erro:", err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form).entries());
    dados.id_aula = id_aula;

    try {
      const res = await fetch('/api/questionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dados)
      });

      const resultado = await res.json();
      mensagem.textContent = resultado.mensagem || resultado.erro;
      mensagem.className = resultado.erro ? 'text-danger' : 'text-success';

      if (!resultado.erro) {
        setTimeout(() => {
          window.location.href = "aulas_realizadas.html";
        }, 2000);
      }

    } catch (err) {
      console.error("Erro ao enviar questionário:", err);
      mensagem.textContent = "Erro ao enviar respostas.";
      mensagem.className = "text-danger";
    }
  });
});
