document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("clinicas-list");

  try {
    const response = await fetch("/api/admin/clinicas"); // API corrigida
    const clinicas = await response.json();

    // Dicionário para converter números em nomes de dias
    const diasSemana = {
      1: "Segunda-feira",
      2: "Terça-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "Sábado",
      0: "Domingo"
    };

    clinicas.forEach(clinica => {
      const div = document.createElement("div");
      div.classList.add("col-md-4", "clinica");

      // Formatando os horários
      const abertura = clinica.hora_abertura.slice(0, 5);
      const fecho = clinica.hora_fecho.slice(0, 5);

      // Convertendo dias de funcionamento corretamente
      const diasFuncionamento = clinica.dias_funcionamento.map(dia => diasSemana[dia]).join(", ");

      div.innerHTML = `
        <h3>${clinica.nome}</h3>
        <p><strong>Localização:</strong> ${clinica.localizacao}</p>
        <p><strong>Horário:</strong> ${abertura} - ${fecho}</p>
        <p><strong>Funcionamento:</strong> ${diasFuncionamento}</p>
        <iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyABo2BVdevuzUcLLjj7byJcGVnVUoY-wGE&q=${encodeURIComponent(clinica.localizacao)}" loading="lazy"></iframe>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error("Erro ao carregar clínicas:", error);
    container.innerHTML = "<p>Erro ao carregar clínicas. Tente novamente mais tarde.</p>";
  }

  const terapiasContainer = document.getElementById("terapias-list");

  try {
    const response = await fetch("/api/allterapias");
    const terapias = await response.json();

    terapias.forEach(terapia => {
      const div = document.createElement("div");
      div.classList.add("col-md-4", "terapia");

      div.innerHTML = `
        <h3>${terapia.nome}</h3>
        ${terapia.descricao ? `<p>${terapia.descricao}</p>` : ""}
        ${terapia.duracao ? `<p><strong>Duração:</strong> ${terapia.duracao} min</p>` : ""}
      `;

      terapiasContainer.appendChild(div);
    });

  } catch (error) {
    console.error("Erro ao carregar terapias:", error);
    terapiasContainer.innerHTML = "<p>Erro ao carregar terapias. Tente novamente mais tarde.</p>";
  }
});
