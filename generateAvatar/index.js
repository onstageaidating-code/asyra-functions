const sdk = require('node-appwrite');
const { createHash } = require('crypto');

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new sdk.Storage(client);
const db = new sdk.Databases(client);

function makeSvgAvatar(userId, prompt) {
  const h = createHash('sha256').update(userId).digest('hex');
  const color = '#' + h.slice(0, 6);
  const initials = userId.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="100%" height="100%" fill="${color}"/>
    <text x="50%" y="55%" font-size="180" text-anchor="middle" fill="#fff">${initials}</text>
  </svg>`;
  return Buffer.from(svg, 'utf8');
}

module.exports = async function (req, res) {
  try {
    const payload = req.payload ? JSON.parse(req.payload) : {};
    const userId = payload.userId;
    const prompt = payload.prompt || 'avatar';

    if (!userId) return res.json({ ok: false, error: 'userId required' });

    const filename = `avatars/${userId}_mock_${Date.now()}.svg`;
    const buffer = makeSvgAvatar(userId, prompt);

    const file = await storage.createFile(process.env.BUCKET_ID, filename, buffer);
    await db.updateDocument(process.env.DB_ID, 'profiles', userId, {
      avatar_id: file.$id,
      avatar_features: { mock: true, created: new Date().toISOString() }
    });

    return res.json({ ok: true, fileId: file.$id });
  } catch (err) {
    console.error(err);
    return res.json({ ok: false, error: String(err) });
  }
};
