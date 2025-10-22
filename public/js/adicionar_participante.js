document.addEventListener('DOMContentLoaded', carregarFilaEspera);

async function carregarFilaEspera() {
  const params = new URLSearchParams(window.location.search);
  const id_aula = params.get('id_aula');

  if (!id_aula) {
    document.getElementById("mensagemErro").textContent = "ID da aula inválido.";
    return;
  }

  try {
    const res = await fetch(`/api/fila-espera/${id_aula}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) {
      throw new Error('Erro ao buscar a fila de espera.');
    }

    const filaEspera = await res.json();
    const tbody = document.getElementById("listaFilaEspera");
    tbody.innerHTML = "";

    if (filaEspera.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5' class='text-center text-muted'>Nenhum cliente na fila de espera.</td></tr>";
      return;
    }

    filaEspera.forEach(cliente => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${cliente.prioridade}</td>
        <td>${cliente.nome}</td>
        <td>${cliente.email}</td>
        <td>${new Date(cliente.data_entrada_fila).toLocaleDateString('pt-PT')}</td>
        <td>
          <button class="btn btn-success btn-sm" onclick="adicionarParticipante(${cliente.id_utilizador}, ${id_aula})">
            Adicionar
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    console.error("Erro ao carregar fila de espera:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar fila de espera.";
  }
}

async function adicionarParticipante(id_utilizador, id_aula) {
  try {
    const res = await fetch('/api/aulas/adicionar-participante-manual', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id_aula, id_utilizador })
    });

    if (!res.ok) {
      const errorText = await res.json();
      throw new Error(errorText.erro || "Erro ao adicionar participante.");
    }

    alert("Participante adicionado com sucesso!");
    window.location.reload();
  } catch (err) {
    alert(err.message);
    console.error("Erro ao adicionar participante:", err);
  }
}
