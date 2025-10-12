const sdk = require('node-appwrite');
const { v4: uuidv4 } = require('uuid');

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new sdk.Databases(client);

module.exports = async function (req, res) {
  try {
    const { fromUser, toUser, action } = JSON.parse(req.payload || '{}');
    if (!fromUser || !toUser || !action)
      return res.json({ ok: false, error: 'fromUser, toUser, action required' });

    const swipeId = uuidv4();
    const swipeData = { fromUser, toUser, action, createdAt: new Date().toISOString() };
    await db.createDocument(process.env.DB_ID, 'swipes', swipeId, swipeData);

    const reverse = await db.listDocuments(process.env.DB_ID, 'swipes', [
      sdk.Query.equal('fromUser', toUser),
      sdk.Query.equal('toUser', fromUser),
      sdk.Query.equal('action', 'like')
    ]);

    if (reverse.total > 0 && action === 'like') {
      const matchId = uuidv4();
      await db.createDocument(process.env.DB_ID, 'matches', matchId, {
        matchId,
        users: [fromUser, toUser],
        createdAt: new Date().toISOString()
      });
      return res.json({ ok: true, matchCreated: true, matchId });
    }

    return res.json({ ok: true, matchCreated: false });
  } catch (err) {
    console.error(err);
    return res.json({ ok: false, error: String(err) });
  }
};
