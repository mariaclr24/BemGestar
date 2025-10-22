document.addEventListener('DOMContentLoaded', carregarAulasRealizadas);

async function carregarAulasRealizadas() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "login.html";
      return;
    }

    const resAulas = await fetch('/api/admin/aulas-realizadas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resAulas.ok) throw new Error("Erro ao procurar aulas realizadas.");
    const aulas = await resAulas.json();

    const tbodyAulas = document.getElementById("listaAulasRealizadas");
    tbodyAulas.innerHTML = "";

    if (aulas.length === 0) {
      tbodyAulas.innerHTML = "<tr><td colspan='6' class='text-center text-muted'>Nenhuma aula encontrada.</td></tr>";
    } else {
      aulas.forEach(aula => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(aula.data).toLocaleDateString('pt-PT')}</td>
          <td>${aula.nome_terapia}</td>
          <td>${aula.profissional}</td>
          <td>${aula.espaco}</td>
          <td>${aula.clinica}</td>
          <td>
            <button class="btn btn-info btn-sm" onclick="carregarExamesUtentes(${aula.id_aula})">
              Ver Exames
            </button>
          </td>
        `;
        tbodyAulas.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar aulas:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar aulas.";
  }
}

async function carregarExamesUtentes(id_aula) {
  try {
    document.getElementById("examesUtentes").classList.remove("d-none");

    const resExames = await fetch(`/api/presencas/${id_aula}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!resExames.ok) throw new Error("Erro ao buscar exames dos utentes.");
    const { aula, participantes } = await resExames.json();

    const tbodyExames = document.getElementById("listaExamesUtentes");
    tbodyExames.innerHTML = "";

    if (participantes.length === 0) {
      tbodyExames.innerHTML = "<tr><td colspan='6' class='text-center text-muted'>Nenhum utente participou.</td></tr>";
    } else {
      participantes.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${p.nome}</td>
          <td>${p.email}</td>
          <td>${p.questionario ? `<button class="btn btn-sm btn-outline-secondary" onclick="verQuestionario(${id_aula}, ${p.id_utilizador})">Ver</button>` : '❌'}</td>
          <td>${p.biosinal ? `<button class="btn btn-sm btn-outline-info" onclick="verBiosinal(${id_aula}, ${p.id_utilizador})">Ver</button>` : '❌'}</td>
          <td>
            <button class="btn btn-sm btn-success" onclick="visualizarRelatorio(${id_aula}, ${p.id_utilizador})">
              Ver Relatório
            </button>
          </td>
        `;
        tbodyExames.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar exames dos utentes:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar exames.";
  }
}

async function verQuestionario(id_aula, id_utilizador) {
  try {
    const res = await fetch(`/api/questionario/${id_aula}/${id_utilizador}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar questionário.");
    const data = await res.json();
    
    if (data.erro) {
      document.getElementById("mensagemErro").textContent = data.erro;
      return;
    }

    // Format the questionnaire data for display
    const questionarioHTML = `
    <p><strong>Classificação Geral (1–5):</strong> ${data.resposta.classificacao_geral || 'N/A'}</p>
    <p><strong>A aula foi clara?</strong> ${data.resposta.aula_foi_clara || 'N/A'}</p>
    <p><strong>O profissional acompanhou durante a aula?</strong> ${data.resposta.acompanhou_profissional || 'N/A'}</p>
    <p><strong>Colocou dúvidas?</strong> ${data.resposta.colocou_duvidas || 'N/A'}</p>
    <p><strong>A aula ajudou no bem-estar?</strong> ${data.resposta.ajudou_bem_estar || 'N/A'}</p>
    <p><strong>Contribuição positiva da sessão para o seu estado físico (1–5):</strong> ${data.resposta.contribuicao_positiva || 'N/A'}</p>
    <p><strong>Nível de esforço físico (1–10):</strong> ${data.resposta.nivel_esforco || 'N/A'}</p>
    <p><strong>Sentiu dor muscular?</strong> ${data.resposta.dor_muscular || 'N/A'}</p>
    <p><strong>Sentiu desconforto durante a aula?</strong> ${data.resposta.sentiu_desconforto || 'N/A'}</p>
    <p><strong>Fadiga após aula (1–10):</strong> ${data.resposta.fadiga || 'N/A'}</p>
    <p><strong>Conseguiu acompanhar os exercícios? (1–5):</strong> ${data.resposta.coordenacao || 'N/A'}</p>
    <p><strong>Teve dificuldades de equilíbrio?</strong> ${data.resposta.equilibrio || 'N/A'}</p>
    <p><strong>Comentários adicionais:</strong> ${data.resposta.comentarios || 'Nenhum'}</p>
    `;

    document.getElementById("conteudoQuestionario").innerHTML = questionarioHTML;
    document.getElementById("modalQuestionario").classList.remove("d-none");
  } catch (err) {
    console.error("Erro ao carregar questionário:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar questionário.";
  }
}

async function verBiosinal(id_aula, id_utilizador) {
  try {
    const res = await fetch(`/api/biosinal/analise/${id_aula}?id_utilizador=${id_utilizador}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar biosinal.");
    const data = await res.json();
    
    if (data.erro) {
      document.getElementById("mensagemErro").textContent = data.erro;
      return;
    }

    // Display the biosignal graph if available
    if (data.grafico) {
      document.getElementById("imagemBiosinal").src = data.grafico;
    }

    // Display the analysis data
    const biosinalHTML = `
      <div class="mb-3">
        <h6>Estatísticas:</h6>
        <p><strong>RMS:</strong> ${data.rms || 'N/A'}</p>
        <p><strong>Média:</strong> ${data.media || 'N/A'}</p>
        <p><strong>Desvio Padrão:</strong> ${data.desvio || 'N/A'}</p>
      </div>
    `;

    document.getElementById("tabelaBiosinal").innerHTML = biosinalHTML;
    document.getElementById("modalBiosinal").classList.remove("d-none");
  } catch (err) {
    console.error("Erro ao carregar biosinal:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar biosinal.";
  }
}


async function visualizarRelatorio(id_aula, id_utilizador) {
  try {
    const res = await fetch(`/api/aula/detalhes/${id_aula}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar relatório.");
    const data = await res.json();
    
    if (data.erro) {
      document.getElementById("mensagemErro").textContent = data.erro;
      return;
    }

    if (data.relatorio) {
      window.open(data.relatorio, '_blank');
    } else {
      document.getElementById("mensagemErro").textContent = "Relatório não disponível.";
    }
  } catch (err) {
    console.error("Erro ao carregar relatório:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar relatório.";
  }
}

function fecharModalQuestionario() {
  document.getElementById("modalQuestionario").classList.add("d-none");
}

function fecharModalBiosinal() {
  document.getElementById("modalBiosinal").classList.add("d-none");
}