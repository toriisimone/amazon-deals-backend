export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'products.json' });
    if (!blobs.length) return res.status(200).json({ products: [] });

    const fileRes = await fetch(blobs[0].url);
    const data = await fileRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Could not load products' });
  }
}
