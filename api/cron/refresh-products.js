export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.AMAZON_CLIENT_ID,
        client_secret: process.env.AMAZON_CLIENT_SECRET,
        scope: 'creatorsapi::default'
      })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const asins = [
      'B0FNWDR3S9',
      'B0C285T9JV',
      'B0FQ5STH6H',
      'B0H1B2G6YB'
    ];
    const itemsRes = await fetch('https://creatorsapi.amazon/catalog/v1/getItems', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-marketplace': 'www.amazon.com'
      },
      body: JSON.stringify({
        itemIds: asins,
        itemIdType: 'ASIN',
        marketplace: 'www.amazon.com',
        partnerTag: process.env.AMAZON_PARTNER_TAG,
        resources: [
          'images.primary.large',
          'itemInfo.title',
          'itemInfo.features'
        ]
      })
    });
    const itemsData = await itemsRes.json();
    const products = (itemsData.itemsResult?.items || []).map((item) => ({
      asin: item.asin,
      title: item.itemInfo?.title?.displayValue || '',
      image: item.images?.primary?.large?.url || '',
      url: item.detailPageURL || ''
    }));
    const { put } = await import('@vercel/blob');
    await put('products.json', JSON.stringify({ updatedAt: new Date().toISOString(), products }), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    return res.status(200).json({ ok: true, count: products.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Refresh failed' });
  }
}
