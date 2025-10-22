document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/avaliacoes");
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const avaliacoes = await response.json();
        const container = document.getElementById("avaliacoes");

        container.innerHTML = ""; // Limpa o conteúdo anterior

        if (avaliacoes.length === 0) {
            container.innerHTML = "<p class='text-warning'>Nenhuma avaliação disponível.</p>";
            return;
        }

        avaliacoes.forEach(avaliacao => {
            const dataFormatada = new Date(avaliacao.data_avaliacao).toLocaleString("pt-PT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            const div = document.createElement("div");
            div.classList.add("col-md-6");
            div.setAttribute("id", `avaliacao-${avaliacao.id_avaliacao}`);

            div.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Avaliação</h5>
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Utente:</strong> ${avaliacao.nome_utente}</p>
                        <button onclick="definirTerapia(${avaliacao.id_avaliacao})" class="btn btn-primary">Definir Terapia</button>
                        <div id="tabela-terapia-${avaliacao.id_avaliacao}" style="display: none;"></div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
        document.getElementById("avaliacoes").innerHTML = `<p class='text-danger'>${error.message}</p>`;
    }
});
async function definirTerapia(idAvaliacao) {
    const tabelaContainer = document.getElementById(`tabela-terapia-${idAvaliacao}`);
    
    // Se já estiver visível, alterna para esconder
    if (tabelaContainer.style.display === "block") {
        tabelaContainer.style.display = "none";
        return;
    }

    tabelaContainer.style.display = "block"; // Exibe a tabela

    // Criar a estrutura da tabela
    tabelaContainer.innerHTML = `
        <table class="table mt-3">
            <thead>
                <tr>
                    <th>Terapia</th>
                    <th>Tipo</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody id="terapias-${idAvaliacao}">
                <tr>
                    <td colspan="3">Carregando terapias...</td>
                </tr>
            </tbody>
        </table>
    `;

    try {
        const response = await fetch("/api/terapias");
        if (!response.ok) {
            throw new Error(`Erro ao buscar terapias: ${response.status}`);
        }

        const terapias = await response.json();
        const tbody = document.getElementById(`terapias-${idAvaliacao}`);
        tbody.innerHTML = ""; // Limpa antes de inserir novas linhas

        terapias.forEach(terapia => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${terapia.nome}</td>
                <td>
                    <select class="form-select">
                        <option value="recomendada">Recomendada</option>
                        <option value="nao_recomendada">Não Recomendada</option>
                        <option value="proibida">Proibida</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-success" onclick="salvarTerapia(${idAvaliacao}, ${terapia.id_terapia}, this)">Salvar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Erro ao carregar terapias:", error);
        document.getElementById(`terapias-${idAvaliacao}`).innerHTML = `<tr><td colspan="3" class="text-danger">Erro ao carregar terapias.</td></tr>`;
    }
}
async function salvarTerapia(idAvaliacao, idTerapia, button) {
    const tipo = button.parentElement.previousElementSibling.firstChild.value;

    console.log("ID da Avaliação antes de enviar:", idAvaliacao); // Debug
    console.log("Dados enviados para API:", { id_avaliacao: idAvaliacao, id_terapia: idTerapia, tipo });

    try {
        const response = await fetch("/api/definir-terapia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_avaliacao: idAvaliacao, id_terapia: idTerapia, tipo })
        });

        const result = await response.json();
        console.log("Resposta do servidor:", result);

        if (result.status === "success") {
            button.classList.remove("btn-success");
            button.classList.add("btn-secondary");
            button.textContent = "Salvo";
            button.disabled = true;
        } else {
            alert("Erro ao definir terapia.");
        }
    } catch (error) {
        console.error("Erro ao salvar terapia:", error);
        alert("Erro na comunicação com o servidor.");
    }
}
