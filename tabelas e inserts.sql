CREATE TABLE Utilizador (
    id_utilizador SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_utilizador VARCHAR(20) CHECK (tipo_utilizador IN ('administrador', 'utente', 'profissional')) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE Clinica (
    id_clinica INT PRIMARY KEY,
    nome VARCHAR(100),
    localizacao VARCHAR(200)
);

CREATE TABLE Espaco (
    id_espaco INT PRIMARY KEY,
    nome VARCHAR(100),
    id_clinica INT,
    max_vagas INT,
    FOREIGN KEY (id_clinica) REFERENCES Clinica(id_clinica)
);

CREATE TYPE tipo_estado AS ENUM (
    'Grávida',
    'Pós-parto'
);

CREATE TABLE Utente (
    id_utilizador INT PRIMARY KEY,
    estado tipo_estado,
    semanas_gestacao INT NULL,
    nif VARCHAR(9) UNIQUE,
    data_nascimento DATE,
    saldo DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (id_utilizador) REFERENCES Utilizador(id_utilizador)
);

CREATE TABLE CodigoAcesso (
    codigo VARCHAR(10) PRIMARY KEY,
    id_utilizador INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_validade DATE,
    utilizado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_utilizador) REFERENCES Utente(id_utilizador)
);

CREATE TABLE ProfissionalSaude (
    id_utilizador INT PRIMARY KEY,
    especialidade VARCHAR(100),
    id_clinica INT,
    FOREIGN KEY (id_utilizador) REFERENCES Utilizador(id_utilizador),
    FOREIGN KEY (id_clinica) REFERENCES Clinica(id_clinica)
);

CREATE TABLE AvaliacaoSessao (
    id_avaliacao INT PRIMARY KEY,
    data DATE,
    nota INT CHECK (nota BETWEEN 1 AND 10),
    comentarios TEXT
);

CREATE TYPE tipo_biosinal AS ENUM ('ECG', 'EMG');

CREATE TABLE Biosinal (
    id_biosinal INT PRIMARY KEY,
    tipo tipo_biosinal,
    valor FLOAT,
    data_medicao TIMESTAMP
);

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

CREATE TYPE estado_aula AS ENUM (
    'inativo',
    'ativo'
);

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
    FOREIGN KEY (id_espaco) REFERENCES Espaco(id_espaco)
);

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

CREATE TABLE AvaliacaoClinica (
    id_utilizador_profissional INT,
    id_utilizador_utente INT,
    data_avaliacao TIMESTAMP,
    codigo VARCHAR(10),
    FOREIGN KEY (codigo) REFERENCES CodigoAcesso(codigo),
    PRIMARY KEY (id_utilizador_profissional, id_utilizador_utente),
    FOREIGN KEY (id_utilizador_profissional) REFERENCES ProfissionalSaude(id_utilizador),
    FOREIGN KEY (id_utilizador_utente) REFERENCES Utente(id_utilizador)
);

CREATE TYPE tipo_definicao AS ENUM ('recomendada', 'nao_recomendada', 'proibida');

CREATE TABLE DefinicaoTerapia (
    id_utilizador_profissional INT,
    id_utilizador_utente INT,
    id_terapia INT,
    tipo tipo_definicao,
    PRIMARY KEY (id_utilizador_profissional, id_utilizador_utente, id_terapia),
    FOREIGN KEY (id_utilizador_profissional, id_utilizador_utente) REFERENCES AvaliacaoClinica(id_utilizador_profissional, id_utilizador_utente),
    FOREIGN KEY (id_terapia) REFERENCES Terapia(id_terapia)
);

CREATE TYPE estado_agendamento AS ENUM ('pendente', 'confirmada', 'cancelada');

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

CREATE TYPE status_fila AS ENUM ('pendente', 'colocado', 'removido');

CREATE TABLE FilaEspera (
    id_utilizador INT,
    id_aula INT,
    data_entrada_fila TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prioridade INT,
    notificado BOOLEAN DEFAULT FALSE,
    status status_fila DEFAULT 'pendente',
    data_expiracao TIMESTAMP,
    PRIMARY KEY (id_utilizador, id_aula),
    FOREIGN KEY (id_utilizador, id_aula) REFERENCES Agenda(id_utilizador, id_aula)
);

-- Inserir na tabela Utilizador
INSERT INTO Utilizador (nome, email, senha, tipo_utilizador, ativo)
VALUES (
  'Maria Siilva',
  'maria1@example.com',
  '$2b$10$duFRWbrtkCrCsLKenTrsxOqbhPxi6Vt02slgt5ExqtYYT.RLsKNDG', -- senha: 123456
  'utente',
  TRUE
);

-- Assumindo que o id_utilizador gerado foi 1, insere na tabela Utente
INSERT INTO Utente (id_utilizador, estado, semanas_gestacao, nif, data_nascimento, saldo)
VALUES (
  4,
  'Grávida',
  20,
  '123456787',
  '1990-05-20',
  0.00
);

INSERT INTO terapia (id_terapia, nome, descricao, n_vagas, duracao, valor)
VALUES
(1, 'Yoga Pré-Natal', 'Exercícios suaves para gestantes.', 10, 60, 15.00),
(2, 'Pilates Pré-Natal', 'Fortalecimento e postura para grávidas.', 8, 45, 18.00);

INSERT INTO clinica (id_clinica, nome, localizacao)
VALUES (1, 'Clínica BemGestar', 'Rua das Mães, nº 123, Porto');


INSERT INTO espaco (id_espaco, nome, id_clinica, max_vagas)
VALUES
(1, 'Sala 1', 1, 12),
(2, 'Sala 2', 1, 10);

-- Utilizador do tipo profissional
INSERT INTO utilizador (id_utilizador, nome, email, senha, tipo_utilizador, ativo)
VALUES (10, 'Ana Silva', 'ana@bemgestar.com', 'fakehash', 'profissional', true);

-- Profissional associado à clínica 1
INSERT INTO profissionalsaude (id_utilizador, especialidade, id_clinica)
VALUES (10, 'Fisioterapia Obstétrica', 1);

INSERT INTO aula (id_aula, id_terapia, id_espaco, data, estado, capacidade_atual, id_utilizador)
VALUES
(3, 1, 1, '2025-05-15 15:00:00', 'ativo', 0, 10),
(4, 1, 2, '2025-05-16 10:00:00', 'ativo', 0, 10);




delete from utilizador;

SELECT * FROM utilizador; WHERE email = 'maria@example.com';

SELECT id_utilizador, email, senha FROM utilizador WHERE email = 'maria@example.com';
