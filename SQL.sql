-- ENUMS
CREATE TYPE tipo_estado AS ENUM ('Grávida', 'Pós-parto');
CREATE TYPE tipo_profissional AS ENUM ('médico', 'terapeuta');
CREATE TYPE tipo_biosinal AS ENUM ('ECG', 'EMG');
CREATE TYPE estado_aula AS ENUM ('inativo', 'ativo');
CREATE TYPE tipo_definicao AS ENUM ('recomendada', 'nao_recomendada', 'proibida');
CREATE TYPE estado_agendamento AS ENUM ('pendente', 'confirmada', 'cancelada');
CREATE TYPE tipo_disponibilidade AS ENUM ('avaliacao', 'aula', 'consulta');

-- UTILIZADOR
CREATE TABLE Utilizador (
    id_utilizador SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_utilizador VARCHAR(20) CHECK (tipo_utilizador IN ('administrador', 'utente', 'profissional')) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- CLÍNICA
CREATE TABLE Clinica (
    id_clinica INT PRIMARY KEY,
    nome VARCHAR(100),
    localizacao VARCHAR(200),
    dias_funcionamento SMALLINT[], -- 0=Domingo a 6=Sábado
    hora_abertura TIME,
    hora_fecho TIME
);

-- ESPAÇO
CREATE TABLE Espaco (
    id_espaco INT PRIMARY KEY,
    nome VARCHAR(100),
    id_clinica INT,
    max_vagas INT,
    FOREIGN KEY (id_clinica) REFERENCES Clinica(id_clinica)
);

-- UTENTE
CREATE TABLE Utente (
    id_utilizador INT PRIMARY KEY,
    estado tipo_estado,
    semanas_gestacao INT,
    nif VARCHAR(9) UNIQUE,
    data_nascimento DATE,
    saldo DECIMAL(10, 2) DEFAULT 0.00,
	contacto_emergencia VARCHAR(9),
	contacto VARCHAR(9),
    FOREIGN KEY (id_utilizador) REFERENCES Utilizador(id_utilizador)
);

CREATE TABLE avaliacao_temp (
    id_temp SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    estado tipo_estado NOT NULL,
    semanas_gestacao INT,
    nif VARCHAR(9) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_profissional INT REFERENCES ProfissionalSaude(id_utilizador) ON DELETE SET NULL
);

CREATE TABLE CodigoAcesso (
    codigo VARCHAR(10) PRIMARY KEY,
    id_temp INT REFERENCES avaliacao_temp(id_temp) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_validade DATE NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE
);

-- PROFISSIONAL
CREATE TABLE ProfissionalSaude (
    id_utilizador INT PRIMARY KEY,
    especialidade VARCHAR(100),
    id_clinica INT,
    tipo_profissional tipo_profissional NOT NULL,
    FOREIGN KEY (id_utilizador) REFERENCES Utilizador(id_utilizador),
    FOREIGN KEY (id_clinica) REFERENCES Clinica(id_clinica)
);

CREATE TABLE AvaliacaoClinica (
    id_avaliacao SERIAL PRIMARY KEY,
    id_utilizador_profissional INT REFERENCES ProfissionalSaude(id_utilizador),
    id_utilizador_utente INT REFERENCES Utente(id_utilizador),
    data_avaliacao TIMESTAMP NOT NULL
);

-- BIOSINAL
CREATE TABLE Biosinal (
    id_biosinal INT PRIMARY KEY,
    tipo tipo_biosinal,
    valor FLOAT,
    data_medicao TIMESTAMP
);

-- TERAPIA
CREATE TABLE Terapia (
    id_terapia INT PRIMARY KEY,
    nome VARCHAR(100),
    descricao TEXT,
    n_vagas INT,
    duracao INT,
    valor DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE ProfissionalTerapia (
    id_utilizador INT,
    id_terapia INT,
    PRIMARY KEY (id_utilizador, id_terapia),
    FOREIGN KEY (id_utilizador) REFERENCES ProfissionalSaude(id_utilizador),
    FOREIGN KEY (id_terapia) REFERENCES Terapia(id_terapia)
);

-- AULA
CREATE TABLE Aula (
    id_aula INT PRIMARY KEY,
    id_terapia INT,
    id_espaco INT,
    data TIMESTAMP,
    estado estado_aula DEFAULT 'inativo',
    capacidade_atual INT DEFAULT 0,
    id_utilizador INT,
    FOREIGN KEY (id_utilizador) REFERENCES ProfissionalSaude(id_utilizador),
    FOREIGN KEY (id_terapia) REFERENCES Terapia(id_terapia),
    FOREIGN KEY (id_espaco) REFERENCES Espaco(id_espaco),
    CONSTRAINT chk_limite_absoluto CHECK (capacidade_atual <= 15)
);

-- PARTICIPAÇÃO
CREATE TABLE Participacao (
    id_utilizador INT,
    id_aula INT,
    id_avaliacao INT,
    id_biosinal INT,
    presente BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_utilizador, id_aula),
    FOREIGN KEY (id_utilizador) REFERENCES Utente(id_utilizador),
    FOREIGN KEY (id_aula) REFERENCES Aula(id_aula),
    FOREIGN KEY (id_avaliacao) REFERENCES AvaliacaoSessao(id_avaliacao),
    FOREIGN KEY (id_biosinal) REFERENCES Biosinal(id_biosinal)
);


CREATE TABLE DefinicaoTerapia (
    id_avaliacao INT REFERENCES AvaliacaoClinica(id_avaliacao) ON DELETE CASCADE,
    id_terapia INT REFERENCES Terapia(id_terapia),
    tipo tipo_definicao NOT NULL,
    PRIMARY KEY (id_avaliacao, id_terapia)
);


CREATE TABLE DefinicaoTerapiaTemp (
    id_temp INT REFERENCES avaliacao_temp(id_temp) ON DELETE CASCADE,
    id_terapia INT REFERENCES Terapia(id_terapia),
    tipo tipo_definicao NOT NULL,
    PRIMARY KEY (id_temp, id_terapia)
);
-- AGENDA
CREATE TABLE Agenda (
    id_agenda SERIAL PRIMARY KEY,
    id_utilizador INT,
    id_aula INT,
    estado estado_agendamento DEFAULT 'pendente',
    data_agendamento TIMESTAMP,
    pago BOOLEAN DEFAULT FALSE,
    UNIQUE (id_utilizador, id_aula),
    FOREIGN KEY (id_utilizador) REFERENCES Utente(id_utilizador),
    FOREIGN KEY (id_aula) REFERENCES Aula(id_aula)
);

-- FILA DE ESPERA
CREATE TABLE FilaEspera (
    id_utilizador INT,
    id_aula INT,
    data_entrada_fila TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prioridade INT,
    data_expiracao TIMESTAMP,
    PRIMARY KEY (id_utilizador, id_aula),
    FOREIGN KEY (id_utilizador, id_aula) REFERENCES Agenda(id_utilizador, id_aula),
    CONSTRAINT uq_fila_unica UNIQUE (id_utilizador, id_aula)
);

-- DISPONIBILIDADE
CREATE TABLE disponibilidade_profissional (
    id SERIAL PRIMARY KEY,
    id_profissional INT REFERENCES ProfissionalSaude(id_utilizador),
    id_clinica INT REFERENCES Clinica(id_clinica),
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    tipo tipo_disponibilidade DEFAULT 'avaliacao'
);