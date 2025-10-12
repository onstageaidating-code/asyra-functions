const sdk = require('node-appwrite');
const { createHash } = require('crypto');

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new sdk.Databases(client);

function mockEmbedding(seed) {
  const hash = createHash('sha512').update(seed).digest('hex');
  const out = [];
  for (let i = 0; i < 128; i++) {
    const sub = hash.substr((i * 4) % hash.length, 4);
    const val = (parseInt(sub, 16) / 0xffff) * 2 - 1;
    out.push(Number(val.toFixed(5)));
  }
  return out;
}

module.exports = async function (req, res) {
  try {
    const { userId } = JSON.parse(req.payload || '{}');
    if (!userId) return res.json({ ok: false, error: 'userId required' });

    const embedding = mockEmbedding(userId);
    await db.updateDocument(process.env.DB_ID, 'profiles', userId, {
      avatar_features: {
        mock: true,
        embedding,
        embedding_generated_at: new Date().toISOString()
      }
    });

    return res.json({ ok: true, embeddingLength: embedding.length });
  } catch (err) {
    console.error(err);
    return res.json({ ok: false, error: String(err) });
  }
};
