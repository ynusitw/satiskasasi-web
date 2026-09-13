// Geçici: Vercel'in api/ fonksiyonlarını tanıyıp tanımadığını sınar.
export default function handler(req, res) {
  res.status(200).json({ ok: true, runtime: 'node' })
}
