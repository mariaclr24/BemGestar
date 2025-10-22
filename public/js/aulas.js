document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');
  const filtroTerapia = document.getElementById('filtroTerapia');
  const filtroClinica = document.getElementById('filtroClinica');
  const modal = new bootstrap.Modal(document.getElementById('modalAula'));
  const modalBody = document.getElementById('modalBody');
  const btnAgendar = document.getElementById('btnAgendar');

  let todasAulas = [];
  let aulaSelecionadaId = null;

  const today = new Date();
  const twoMonthsLater = new Date();
  twoMonthsLater.setMonth(today.getMonth() + 2);

  async function carregarEventos() {
    try {
      const resposta = await fetch('/api/aulas');
      const aulas = await resposta.json();
      todasAulas = aulas.map(aula => ({
        id: aula.id_aula,
        title: aula.nome_terapia,
        start: aula.data,
        extendedProps: {
          descricao: aula.descricao,
          duracao: aula.duracao,
          nome_profissional: aula.nome_profissional,
          nome_espaco: aula.nome_espaco,
          nome_clinica: aula.nome_clinica
        }
      }));

      const terapias = [...new Set(aulas.map(a => a.nome_terapia))];
      terapias.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.textContent = nome;
        filtroTerapia.appendChild(option);
      });

      const clinicas = [...new Set(aulas.map(a => a.nome_clinica))];
      clinicas.forEach(clinica => {
        const option = document.createElement('option');
        option.value = clinica;
        option.textContent = clinica;
        filtroClinica.appendChild(option);
      });

      inicializarCalendario(todasAulas);

    } catch (err) {
      console.error('Erro ao buscar aulas:', err);
    }
  }

  let calendar;
  function inicializarCalendario(eventos) {
    if (calendar) calendar.destroy();

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'pt',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      validRange: {
        start: today.toISOString().split('T')[0],
        end: twoMonthsLater.toISOString().split('T')[0]
      },
      events: eventos,
      eventClick: function(info) {
        const aula = info.event;
        const props = aula.extendedProps;
        const dataHora = new Date(aula.start);
        aulaSelecionadaId = aula.id;

        modalBody.innerHTML = `
          <p><strong>Aula:</strong> ${aula.title}</p>
          <p><strong>Data:</strong> ${dataHora.toLocaleDateString('pt-PT')}</p>
          <p><strong>Hora:</strong> ${dataHora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Duração:</strong> ${props.duracao} minutos</p>
          <p><strong>Terapeuta:</strong> ${props.nome_profissional}</p>
          <p><strong>Sala:</strong> ${props.nome_espaco}</p>
          <p><strong>Clínica:</strong> ${props.nome_clinica}</p>
        `;
        modal.show();
      }
    });

    calendar.render();
  }

  btnAgendar.addEventListener('click', function() {
    if (aulaSelecionadaId) {
      window.location.href = `agendamento.html?idAula=${aulaSelecionadaId}`;
    }
  });

  function aplicarFiltros() {
    const tipoSelecionado = filtroTerapia.value;
    const clinicaSelecionada = filtroClinica.value;

    const filtradas = todasAulas.filter(evento => {
      const tipoOK = tipoSelecionado === 'todos' || evento.title === tipoSelecionado;
      const clinicaOK = clinicaSelecionada === 'todas' || evento.extendedProps.nome_clinica === clinicaSelecionada;
      return tipoOK && clinicaOK;
    });

    inicializarCalendario(filtradas);
  }

  filtroTerapia.addEventListener('change', aplicarFiltros);
  filtroClinica.addEventListener('change', aplicarFiltros);

  carregarEventos();
});
