# CDN Recommendation for AIAMusic

## What is a CDN?

A **Content Delivery Network (CDN)** caches your static content on servers distributed globally. When a user requests a file, they receive it from the nearest edge server instead of your single VPS location, resulting in faster load times and reduced bandwidth usage on your server.

## Why Consider Cloudflare for AIAMusic?

### Benefits Specific to Your App

1. **Audio File Delivery** - MP3 files are cached globally, reducing VPS bandwidth
2. **Free Tier Available** - No cost for basic caching and CDN features
3. **Automatic SSL** - Handles certificates for all subdomains
4. **DDoS Protection** - Absorbs attack traffic before it reaches your VPS
5. **Global Performance** - Users worldwide get faster audio playback
6. **Bandwidth Savings** - Repeated plays don't hit your VPS

### Performance Impact

```
Without CDN:  User (Australia) → VPS (USA) → Audio file
Latency: ~200-300ms, uses VPS bandwidth every time

With CDN:     User (Australia) → Cloudflare Edge (Sydney) → Audio file
Latency: ~20-50ms, VPS only hit once to cache
```

## Current Architecture

```
Internet → Traefik (SSL) → Nginx (static + proxy) → FastAPI
                 ↓
            Audio files served from VPS
```

## Proposed Architecture with Cloudflare

```
Internet → Cloudflare CDN → Traefik (SSL) → Nginx → FastAPI
              ↓ (cached)
         Audio served from edge
```

## Setup Instructions

### 1. Sign Up for Cloudflare (Free Tier)

1. Go to [cloudflare.com](https://cloudflare.com)
2. Create a free account
3. Click "Add Site" and enter `aiacopilot.com`

### 2. Update Domain Nameservers

Cloudflare will provide nameservers like:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

Update these at your domain registrar (wherever you bought aiacopilot.com).

**DNS propagation takes 24-48 hours**, but usually completes within a few hours.

### 3. Configure SSL/TLS Settings

In Cloudflare dashboard:
- **SSL/TLS** → Set to "Full (strict)"
- This ensures end-to-end encryption (Cloudflare ↔ Your VPS)

### 4. Set Up Caching Rules

#### Page Rules (Free Tier Allows 3 Rules)

**Rule 1: Cache Audio Files**
```
URL Pattern: *aiamusic.aiacopilot.com/*.mp3
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 4 hours
```

**Rule 2: Cache Frontend Assets**
```
URL Pattern: *aiamusic.aiacopilot.com/*.js
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
```

**Rule 3: Cache CSS & Images**
```
URL Pattern: *aiamusic.aiacopilot.com/*.css
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
```

### 5. Additional Optimizations (Optional)

- **Auto Minify**: Enable for JS, CSS, HTML (in Speed → Optimization)
- **Brotli Compression**: Enabled by default
- **HTTP/2**: Enabled by default

## Important Considerations

### Audio File Sources

**Check where your audio is actually served from:**

1. **Archived URLs** (songs with `archived_url_1`, `archived_url_2`)
   - These may already be on a CDN from your archiving service
   - Cloudflare won't help if files are served from external URLs

2. **Local/VPS URLs** (served from `download_url_1`, `download_url_2`)
   - These WILL benefit from Cloudflare caching
   - Significant bandwidth savings

To verify:
```bash
# Check a song's audio URLs
ssh vps "cd /srv/apps/aiamusic && docker compose -f docker-compose.prod.yml exec backend python -c \"
from app.database import SessionLocal
from app.models import Song
db = SessionLocal()
song = db.query(Song).first()
print(f'Download URL: {song.download_url_1}')
print(f'Archived URL: {song.archived_url_1}')
\""
```

### Cache Purging

When you update files, you may need to purge Cloudflare's cache:

```bash
# Via Cloudflare Dashboard
Caching → Configuration → Purge Cache → Purge Everything

# Or use Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Expected Performance Improvements

### Metrics to Track Before/After

1. **VPS Bandwidth Usage**
   - Check via Hostinger dashboard
   - Expect 50-70% reduction for audio traffic

2. **Page Load Speed**
   - Test with [GTmetrix](https://gtmetrix.com) or [WebPageTest](https://www.webpagetest.org)
   - Expect faster initial load for users outside your VPS region

3. **Time to First Byte (TTFB)**
   - Should improve for static assets
   - API responses won't benefit (dynamic content)

### What WON'T Be Cached

- API requests (`/api/*` endpoints)
- Database queries
- Dynamic content generation

These still hit your VPS and won't benefit from CDN caching.

## Cost

**Cloudflare Free Tier includes:**
- Unlimited bandwidth
- Global CDN
- 3 Page Rules
- Automatic SSL
- Basic DDoS protection

**Paid tiers** ($20/mo+) add:
- More Page Rules
- Advanced caching
- Image optimization
- Better analytics

For your current scale, **free tier is sufficient**.

## Alternative: Self-Hosted CDN

If you want to avoid third-party services, you could:
1. Set up multiple VPS instances in different regions
2. Use GeoDNS to route users to nearest server
3. Use Nginx caching more aggressively

**Not recommended** - significantly more complex and costly than Cloudflare.

## Next Steps

1. **Test current performance** - Establish baseline metrics
2. **Set up Cloudflare** - Follow steps above
3. **Monitor for 1 week** - Check bandwidth and speed improvements
4. **Optimize caching rules** - Adjust TTL based on usage patterns

## Questions to Answer First

- [ ] Where are audio files currently served from? (VPS or external archiving service)
- [ ] What's current monthly bandwidth usage?
- [ ] Are there any compliance/data residency requirements?
- [ ] Do users experience slow audio loading currently?

## Resources

- [Cloudflare Docs - Getting Started](https://developers.cloudflare.com/fundamentals/get-started/)
- [Cloudflare Page Rules](https://developers.cloudflare.com/rules/page-rules/)
- [Cache Everything vs. Standard](https://developers.cloudflare.com/cache/about/default-cache-behavior/)

---

**Bottom Line:** Cloudflare CDN is a low-risk, high-reward optimization. The free tier provides significant benefits with minimal setup effort. Your current Traefik + Nginx stack works seamlessly with Cloudflare's reverse proxy.
