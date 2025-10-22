const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");
const id = params.get("id");

const msgDiv = document.getElementById("mensagem");

if (uid && id) {
  fetch('/api/presenca', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_utilizador: uid, id_aula: id })
  })
  .then(res => res.json())
  .then(data => {
    msgDiv.innerHTML = `
      <div class="alert alert-success">✅ Presença confirmada com sucesso!</div>
      <p>Redirecionando...</p>
    `;
    setTimeout(() => {
      window.location.href = "dashboard_cliente.html";
    }, 2500);
  })
  .catch(err => {
    console.error(err);
    msgDiv.innerHTML = `
      <div class="alert alert-danger">❌ Erro ao confirmar presença.</div>
      <p>Tente novamente.</p>
    `;
  });
} else {
  msgDiv.innerHTML = `
    <div class="alert alert-warning">Parâmetros inválidos. Acesso negado.</div>
  `;
}
