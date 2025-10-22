const QRCode = require('qrcode');

exports.gerarQRCode = async (req, res) => {
  const { id_utilizador, id_aula } = req.params;
  const url = `http://localhost:3000/confirmar_presenca.html?uid=${id_utilizador}&id=${id_aula}`;

  try {
    const qr = await QRCode.toDataURL(url);
    res.json({ qr });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
};
