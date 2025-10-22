const userId = localStorage.getItem('userId');
if (!userId) {
  alert("Faça login primeiro.");
  window.location.href = "login.html";
}

async function carregarAulasDoDia() {
  try {
    const resp = await fetch(`/api/aulas-hoje/${userId}`);
    const aulas = await resp.json();
    const lista = document.getElementById("listaAulas");

    if (!aulas.length) {
      lista.innerHTML = "<p class='text-muted'>Nenhuma aula marcada para hoje.</p>";
      return;
    }

    lista.innerHTML = "<h4>Escolha a aula:</h4>";
    aulas.forEach(a => {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline-primary m-2";
      btn.textContent = `${a.nome_terapia} - ${new Date(a.data).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
      btn.onclick = () => gerarQRCode(a.id_aula);
      lista.appendChild(btn);
    });
  } catch (err) {
    console.error("Erro ao carregar aulas:", err);
  }
}

function gerarQRCode(idAula) {
  const qrDiv = document.getElementById("qrContainer");
  qrDiv.classList.remove("d-none");

  const url = `http://localhost:3000/confirmar_presenca.html?uid=${userId}&id=${idAula}`;

  // Atualiza o link direto acima do QR
  const link = document.getElementById("linkAlternativo");
  link.href = url;
  link.textContent = "Clique aqui se não conseguir ler o QR Code";

  // Gera o QR code no canvas
  const qrCanvas = document.getElementById("qrcode");
  QRCode.toCanvas(qrCanvas, url, function (error) {
    if (error) console.error(error);
  });
}

carregarAulasDoDia();
