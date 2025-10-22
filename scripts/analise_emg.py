import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import find_peaks
import os
import sys
import json

# Argumentos recebidos do Node.js
ficheiro = sys.argv[1]              # Caminho completo para o ficheiro .txt
pasta_resultados = sys.argv[2]      # Pasta onde guardar CSV e PNG

# Garantir que a pasta existe
os.makedirs(pasta_resultados, exist_ok=True)

# Lê os dados do ficheiro ignorando o cabeçalho
with open(ficheiro, "r", encoding="utf-8") as f:
    linhas = f.readlines()

# Filtra apenas as linhas com dados válidos
dados_lidos = [linha.strip() for linha in linhas if not linha.startswith("#") and linha.strip()]
dados = [linha.split("\t") for linha in dados_lidos]

# Define as colunas típicas do BITalino
colunas = ["nSeq", "I1", "I2", "O1", "O2", "A1", "A2", "A3", "A4", "A5", "A6"]
df = pd.DataFrame(dados, columns=colunas).astype(int)

# Frequência de amostragem (Hz)
fs = 100

# Intervalo entre 10s e 30s
start_sample = 10 * fs
end_sample = 30 * fs
emg = df["A1"].iloc[start_sample:end_sample].reset_index(drop=True)

# Cálculos estatísticos
rms = np.sqrt(np.mean(np.square(emg)))
media = np.mean(emg)
desvio = np.std(emg)

# Identifica picos
picos, _ = find_peaks(emg, height=media + desvio)
valores_picos = emg.iloc[picos].values

# Criar tabela de picos
tabela = pd.DataFrame({
    "Tempo(ms)": picos,
    "Pico(mv)": valores_picos
})

# Guardar CSV
caminho_csv = os.path.join(pasta_resultados, "tabela_picos.csv")
tabela.to_csv(caminho_csv, index=False, sep=';')

# Criar gráfico
fig, ax = plt.subplots(figsize=(14, 6))
ax.plot(emg[:1500], label="Sinal EMG (A1)", color="blue")
ax.plot(picos[picos < 1500], emg[picos[picos < 1500]], "rx", label="Picos")
ax.hlines(rms, 0, 1500, colors="green", linestyles="dashed", label=f"RMS = {rms:.2f}")
ax.set_title("Sinal EMG [10s a 30s] com Picos e RMS")
ax.set_xlabel("Amostras (ms)")
ax.set_ylabel("Valor (mV)")
ax.grid(True)
ax.legend()

# Inserir tabela de picos no gráfico
tabela_str = tabela.head(30).to_string(index=False)
props = dict(boxstyle='round', facecolor='white', alpha=0.8)
ax.text(1.02, 0.95, f"Picos:\n{tabela_str}",
        transform=ax.transAxes, fontsize=10, verticalalignment='top',
        bbox=props, family='monospace')

# Guardar gráfico como imagem
caminho_png = os.path.join(pasta_resultados, "emg_com_picos_e_rms_com_tabela.png")
plt.tight_layout()
plt.savefig(caminho_png)

# Supondo que 'emg' é um array NumPy com os valores do sinal
rms = float(np.sqrt(np.mean(np.square(emg))))
media = float(np.mean(emg))
desvio = float(np.std(emg))

estatisticas = {
    'rms': rms,
    'media': media,
    'desvio': desvio
}

with open(os.path.join(sys.argv[2], 'estatisticas.json'), 'w') as f:
    json.dump(estatisticas, f)